import { randomBytes } from "node:crypto"
import { execFile as execFileCallback } from "node:child_process"
import { readFile } from "node:fs/promises"
import process from "node:process"
import { promisify } from "node:util"

import { chromium, devices, expect } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"

const baseUrl = process.env.E2E_BASE_URL
const superadminEmail =
  process.env.E2E_SUPERADMIN_EMAIL ?? process.env.PLEXUS_SUPERADMIN_EMAIL
const superadminPassword =
  process.env.E2E_SUPERADMIN_PASSWORD ?? process.env.PLEXUS_SUPERADMIN_PASSWORD
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseSecret = process.env.SUPABASE_SECRET_KEY
const useVercelBypass = process.env.E2E_VERCEL_BYPASS === "1"
const execFile = promisify(execFileCallback)

for (const [name, value] of Object.entries({
  E2E_BASE_URL: baseUrl,
  E2E_SUPERADMIN_EMAIL: superadminEmail,
  E2E_SUPERADMIN_PASSWORD: superadminPassword,
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  SUPABASE_SECRET_KEY: supabaseSecret,
})) {
  if (!value) {
    throw new Error(`${name} is required for production role verification.`)
  }
}

const target = new URL(baseUrl)
if (target.protocol !== "https:" || target.hostname === "localhost") {
  throw new Error("E2E_BASE_URL must be a deployed HTTPS origin.")
}

if (useVercelBypass && !target.hostname.endsWith(".vercel.app")) {
  throw new Error(
    "E2E_VERCEL_BYPASS can only be used with a Vercel deployment hostname."
  )
}

const vercelBypassSecret = useVercelBypass
  ? await getVercelBypassSecret()
  : undefined

const service = createClient(supabaseUrl, supabaseSecret, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
})

const stamp = Date.now().toString(36)
const adminEmail = `release-qa-admin-${stamp}@example.invalid`
const vendorEmail = `release-qa-vendor-${stamp}@example.invalid`
const adminPassword = `QaAdmin!1${randomBytes(18).toString("base64url")}`
const vendorPassword = `QaVendor!1${randomBytes(18).toString("base64url")}`
const tenantSlug = `release-qa-${stamp}`
const tenantName = `Release QA ${stamp}`
const vendorName = `Release QA Vendor ${stamp}`

let browser
let adminProfile
let vendorProfile
let testError

async function getVercelBypassSecret() {
  const projectConfig = JSON.parse(
    await readFile(new URL("../.vercel/project.json", import.meta.url), "utf8")
  )
  const { stdout } = await execFile(
    "npx",
    [
      "vercel",
      "api",
      `/v9/projects/${projectConfig.projectId}`,
      "--raw",
    ],
    {
      cwd: new URL("..", import.meta.url),
      maxBuffer: 10 * 1024 * 1024,
    }
  )
  const project = JSON.parse(stdout)
  const bypassEntry = Object.entries(project.protectionBypass ?? {}).find(
    ([, value]) => value.scope === "automation-bypass"
  )

  if (!bypassEntry) {
    throw new Error(
      "The Vercel project has no automation bypass token for protected deployment verification."
    )
  }

  return bypassEntry[0]
}

function createContext(options = {}) {
  return browser.newContext({
    ...options,
    baseURL: baseUrl,
    extraHTTPHeaders: vercelBypassSecret
      ? { "x-vercel-protection-bypass": vercelBypassSecret }
      : undefined,
  })
}

async function login(page, email, password, expectedPath) {
  await page.goto("/en/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: /login/i }).click()
  await expect(page).toHaveURL(new RegExp(`${expectedPath.replaceAll("/", "\\/")}$`), {
    timeout: 30_000,
  })
}

async function expectNoHorizontalOverflow(page) {
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            Math.max(
              document.documentElement.scrollWidth,
              document.body.scrollWidth
            ) - document.documentElement.clientWidth
        ),
      { message: "The deployed page should fit inside the viewport." }
    )
    .toBeLessThanOrEqual(1)
}

async function waitForProfile(email) {
  let lastError

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { data, error } = await service
      .from("user_profiles")
      .select("id, role, admin_id, vendor_company_id, vendor_type, active, email")
      .eq("email", email)
      .maybeSingle()

    if (data) {
      return data
    }

    lastError = error
    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }

  throw new Error(
    `Timed out waiting for ${email}: ${lastError?.message ?? "profile not found"}`
  )
}

async function verifyDesktopFlows() {
  const superadminContext = await createContext()
  const superadminPage = await superadminContext.newPage()

  await login(
    superadminPage,
    superadminEmail,
    superadminPassword,
    "/en/superadmin"
  )
  await expect(
    superadminPage.getByRole("heading", {
      name: "Plexus platform control center",
    })
  ).toBeVisible()
  await expect(
    superadminPage.getByRole("button", { name: "Create Admin" })
  ).toBeEnabled()
  await expectNoHorizontalOverflow(superadminPage)

  await superadminPage.getByRole("button", { name: "Create Admin" }).click()
  const adminDialog = superadminPage.getByRole("dialog", {
    name: "Create Admin tenant and account",
  })
  await adminDialog.getByLabel("Tenant name").fill(tenantName)
  await adminDialog.getByLabel("Tenant slug").fill(tenantSlug)
  await adminDialog
    .getByLabel("Support email")
    .fill(`release-qa-${stamp}@example.invalid`)
  await adminDialog.getByLabel("Admin name").fill(`Release QA Admin ${stamp}`)
  await adminDialog.getByLabel("Admin email").fill(adminEmail)
  await adminDialog.getByLabel("Temporary password").fill(adminPassword)
  await adminDialog
    .getByRole("button", { name: "Create tenant and Admin" })
    .click()
  adminProfile = await waitForProfile(adminEmail)

  await superadminPage.goto("/en/admin")
  await expect(superadminPage).toHaveURL(/\/en\/superadmin$/)
  await superadminContext.close()

  const adminContext = await createContext()
  const adminPage = await adminContext.newPage()

  await login(adminPage, adminEmail, adminPassword, "/en/admin")
  await expect(
    adminPage.getByRole("heading", { name: "Admin operations dashboard" })
  ).toBeVisible()
  await expect(adminPage.getByText("Tenant-scoped Admin view")).toBeVisible()
  await expectNoHorizontalOverflow(adminPage)

  await adminPage.getByRole("link", { name: "Manage Vendor accounts" }).click()
  await expect(adminPage).toHaveURL(/\/en\/admin\/vendors$/)
  await adminPage
    .getByRole("button", { name: "Provision Vendor account" })
    .click()

  const vendorDialog = adminPage.getByRole("dialog", {
    name: "Create a Vendor in your tenant",
  })
  await vendorDialog.getByLabel("Vendor subtype").selectOption("delegation")
  await vendorDialog.getByLabel("Sector").fill("Release verification")
  await vendorDialog.getByLabel("Company name").fill(vendorName)
  await vendorDialog.getByLabel("Account holder").fill(`QA Vendor ${stamp}`)
  await vendorDialog.getByLabel("Email").fill(vendorEmail)
  await vendorDialog.getByLabel("Temporary password").fill(vendorPassword)
  await vendorDialog
    .getByRole("button", { name: "Create Vendor and account" })
    .click()
  vendorProfile = await waitForProfile(vendorEmail)

  await adminPage.goto("/en/superadmin")
  await expect(adminPage).toHaveURL(/\/en\/admin$/)
  await adminPage.goto("/en/vendor")
  await expect(adminPage).toHaveURL(/\/en\/admin$/)
  await adminContext.close()

  const vendorContext = await createContext()
  const vendorPage = await vendorContext.newPage()

  await login(vendorPage, vendorEmail, vendorPassword, "/en/vendor")
  await expect(
    vendorPage.getByRole("heading", { name: /delegation company workspace/i })
  ).toBeVisible()
  await expectNoHorizontalOverflow(vendorPage)
  await vendorPage.goto("/en/admin")
  await expect(vendorPage).toHaveURL(/\/en\/vendor$/)
  await vendorPage.goto("/en/superadmin")
  await expect(vendorPage).toHaveURL(/\/en\/vendor$/)
  await vendorContext.close()
}

async function verifyMobileLogins() {
  const cases = [
    {
      role: "superadmin",
      email: superadminEmail,
      password: superadminPassword,
      path: "/en/superadmin",
      heading: "Plexus platform control center",
    },
    {
      role: "admin",
      email: adminEmail,
      password: adminPassword,
      path: "/en/admin",
      heading: "Admin operations dashboard",
    },
    {
      role: "vendor",
      email: vendorEmail,
      password: vendorPassword,
      path: "/en/vendor",
      heading: /delegation company workspace/i,
    },
  ]

  for (const roleCase of cases) {
    const context = await createContext({
      ...devices["Pixel 7"],
    })
    const page = await context.newPage()

    await login(page, roleCase.email, roleCase.password, roleCase.path)
    await expect(
      page.getByRole("heading", { name: roleCase.heading })
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)

    if (roleCase.role !== "superadmin") {
      await expect(
        page.getByRole("button", { name: /^Menu:/ })
      ).toBeVisible()
    }

    await context.close()
  }
}

async function cleanupQaData() {
  const { data: discoveredProfiles, error: profileLookupError } = await service
    .from("user_profiles")
    .select("id, role, admin_id, vendor_company_id, vendor_type, active, email")
    .in("email", [adminEmail, vendorEmail])

  if (profileLookupError) {
    throw profileLookupError
  }

  adminProfile ??= discoveredProfiles?.find((profile) => profile.role === "admin")
  vendorProfile ??= discoveredProfiles?.find((profile) => profile.role === "vendor")

  const { data: discoveredTenant, error: tenantLookupError } = await service
    .from("admin_tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .maybeSingle()

  if (tenantLookupError) {
    throw tenantLookupError
  }

  const { data: discoveredVendor, error: vendorLookupError } = await service
    .from("vendor_companies")
    .select("id")
    .eq("name_en", vendorName)
    .maybeSingle()

  if (vendorLookupError) {
    throw vendorLookupError
  }

  const profileIds = [
    adminProfile?.id,
    vendorProfile?.id,
    ...(discoveredProfiles ?? []).map((profile) => profile.id),
  ].filter((value, index, values) => value && values.indexOf(value) === index)
  const vendorCompanyId =
    vendorProfile?.vendor_company_id ?? discoveredVendor?.id
  const adminId =
    adminProfile?.admin_id ??
    vendorProfile?.admin_id ??
    discoveredTenant?.id

  if (profileIds.length) {
    const { error } = await service
      .from("user_profiles")
      .delete()
      .in("id", profileIds)
    if (error) throw error
  }

  if (vendorCompanyId) {
    const { error: delegationError } = await service
      .from("delegation_companies")
      .delete()
      .eq("vendor_company_id", vendorCompanyId)
    if (delegationError) throw delegationError

    const { error: partnerError } = await service
      .from("partner_companies")
      .delete()
      .eq("vendor_company_id", vendorCompanyId)
    if (partnerError) throw partnerError

    const { error: vendorError } = await service
      .from("vendor_companies")
      .delete()
      .eq("id", vendorCompanyId)
    if (vendorError) throw vendorError
  }

  if (adminId) {
    const { error } = await service
      .from("admin_tenants")
      .delete()
      .eq("id", adminId)
    if (error) throw error
  } else {
    const { error } = await service
      .from("admin_tenants")
      .delete()
      .eq("slug", tenantSlug)
    if (error) throw error
  }

  const { data: usersPage } = await service.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })
  const qaUsers = usersPage?.users.filter((user) =>
    [adminEmail, vendorEmail].includes(user.email ?? "")
  )

  for (const user of qaUsers ?? []) {
    const { error } = await service.auth.admin.deleteUser(user.id)
    if (error) throw error
  }

  const { count: remainingProfiles } = await service
    .from("user_profiles")
    .select("id", { count: "exact", head: true })
    .in("email", [adminEmail, vendorEmail])
  const { count: remainingTenants } = await service
    .from("admin_tenants")
    .select("id", { count: "exact", head: true })
    .eq("slug", tenantSlug)
  const { data: remainingUsersPage } = await service.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })
  const remainingUsers = remainingUsersPage?.users.filter((user) =>
    [adminEmail, vendorEmail].includes(user.email ?? "")
  )

  if (
    (remainingProfiles ?? 0) !== 0 ||
    (remainingTenants ?? 0) !== 0 ||
    (remainingUsers?.length ?? 0) !== 0
  ) {
    throw new Error("Temporary production QA records were not fully removed.")
  }
}

try {
  browser = await chromium.launch()
  await verifyDesktopFlows()
  await verifyMobileLogins()
  console.log(
    "PASS: Superadmin, Admin, and Vendor production login and route isolation."
  )
} catch (error) {
  testError = error
} finally {
  await browser?.close()

  try {
    await cleanupQaData()
    console.log("PASS: Temporary production QA identities and tenant data removed.")
  } catch (cleanupError) {
    testError = new AggregateError(
      [testError, cleanupError].filter(Boolean),
      "Production verification or cleanup failed."
    )
  }
}

if (testError) {
  throw testError
}
