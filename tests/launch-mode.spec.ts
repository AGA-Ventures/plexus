import { expect, test, type Page } from "@playwright/test"

const superadminEmail = process.env.E2E_SUPERADMIN_EMAIL
const superadminPassword = process.env.E2E_SUPERADMIN_PASSWORD
const adminEmail = process.env.E2E_ADMIN_EMAIL
const adminPassword = process.env.E2E_ADMIN_PASSWORD
const vendorEmail = process.env.E2E_VENDOR_EMAIL
const vendorPassword = process.env.E2E_VENDOR_PASSWORD

async function login(
  page: Page,
  email: string,
  password: string,
  expectedPortal?: RegExp
) {
  await page.goto("/en/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: /login/i }).click()

  if (expectedPortal) {
    await expect(page).toHaveURL(expectedPortal)
  }
}

async function expectNoHorizontalOverflow(page: Page) {
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
      { message: "The page should fit inside the active viewport." }
    )
    .toBeLessThanOrEqual(1)
}

async function openMobilePortalMenu(page: Page) {
  if ((page.viewportSize()?.width ?? 1024) >= 1024) {
    return
  }

  const menu = page.getByRole("button", { name: /^Menu:/ })
  await expect(menu).toBeVisible()
  await menu.click()
  await expect(page.getByRole("dialog").getByText("Navigation")).toBeVisible()
  await expectNoHorizontalOverflow(page)
}

test.describe("three-tier route protection", () => {
  test("uses one responsive login page for all three roles", async ({
    page,
  }) => {
    await page.goto("/en/login")
    await expect(
      page.getByRole("heading", {
        name: "One login for every Plexus workspace",
      })
    ).toBeVisible()
    await expect(page.getByLabel("Email")).toHaveCount(1)
    await expect(page.getByLabel("Password")).toHaveCount(1)
    await expect(page.getByText("Superadmin: /en/superadmin")).toBeVisible()
    await expect(
      page.getByText("Admin: /en/admin", { exact: true })
    ).toBeVisible()
    await expect(page.getByText("Vendor: /en/vendor")).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  for (const route of [
    "/en/superadmin",
    "/en/admin",
    "/en/admin/vendors",
    "/en/vendor",
    "/zh/admin",
    "/cn/vendor",
  ]) {
    test(`redirects unauthenticated users from ${route}`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/(en|zh)\/login/)
      await expect(
        page.getByRole("heading", {
          name: /one login for every plexus workspace|一个入口登录所有 plexus 工作台/i,
        })
      ).toBeVisible()
    })
  }

  test("keeps legacy Vendor subtype routes as redirects", async ({ page }) => {
    await page.goto("/en/delegation")
    await expect(page).toHaveURL(/\/en\/login/)
  })

  test("rejects invalid email/password login", async ({ page }) => {
    await login(page, "invalid@example.com", "wrong-password")
    await expect(
      page.getByRole("main").getByText(/invalid login credentials/i)
    ).toBeVisible()
  })
})

test.describe("Superadmin flow", () => {
  test.skip(
    !superadminEmail || !superadminPassword,
    "Set E2E_SUPERADMIN_EMAIL and E2E_SUPERADMIN_PASSWORD."
  )

  test("Superadmin can view every management directory", async ({ page }) => {
    await login(
      page,
      superadminEmail!,
      superadminPassword!,
      /\/en\/superadmin/
    )
    await expect(page).toHaveURL(/\/en\/superadmin/)
    await expect(
      page.getByRole("heading", { name: "Plexus platform control center" })
    ).toBeVisible()
    await expect(
      page.getByRole("tab", { name: "Admin tenants" })
    ).toBeVisible()
    await expect(page.getByRole("tab", { name: "Vendors" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Audit events" })).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test("Superadmin is redirected away from the Admin workspace", async ({
    page,
  }) => {
    await login(
      page,
      superadminEmail!,
      superadminPassword!,
      /\/en\/superadmin/
    )
    await page.goto("/en/admin")
    await expect(page).toHaveURL(/\/en\/superadmin/)
  })
})

test.describe("Admin tenant flow", () => {
  test.skip(
    !adminEmail || !adminPassword,
    "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD."
  )

  test("Admin enters only its tenant-scoped dashboard", async ({ page }) => {
    await login(page, adminEmail!, adminPassword!, /\/en\/admin/)
    await expect(page).toHaveURL(/\/en\/admin/)
    await expect(
      page.getByRole("heading", { name: "Admin operations dashboard" })
    ).toBeVisible()
    await expect(page.getByText("Tenant-scoped Admin view")).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await openMobilePortalMenu(page)
  })

  test("Admin is redirected away from platform and Vendor routes", async ({
    page,
  }) => {
    await login(page, adminEmail!, adminPassword!, /\/en\/admin/)
    await page.goto("/en/superadmin")
    await expect(page).toHaveURL(/\/en\/admin/)
    await page.goto("/en/vendor")
    await expect(page).toHaveURL(/\/en\/admin/)
  })

  test("Admin can open its Vendor provisioning workflow", async ({ page }) => {
    await login(page, adminEmail!, adminPassword!, /\/en\/admin/)
    await page
      .getByRole("link", { name: "Manage Vendor accounts" })
      .click()
    await expect(page).toHaveURL(/\/en\/admin\/vendors/)
    await expect(
      page.getByRole("heading", { name: /Vendor management$/ })
    ).toBeVisible()
    await page.getByRole("button", { name: "Provision Vendor account" }).click()
    await expect(
      page.getByRole("dialog", { name: "Create a Vendor in your tenant" })
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})

test.describe("Vendor flow", () => {
  test.skip(
    !vendorEmail || !vendorPassword,
    "Set E2E_VENDOR_EMAIL and E2E_VENDOR_PASSWORD."
  )

  test("Vendor lands on the unified Vendor workspace", async ({ page }) => {
    await login(page, vendorEmail!, vendorPassword!, /\/en\/vendor/)
    await expect(page).toHaveURL(/\/en\/vendor/)
    await expect(
      page.getByRole("heading", {
        name: /delegation company workspace|partner enterprise workspace/i,
      })
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await openMobilePortalMenu(page)
  })

  test("Vendor cannot enter Admin or Superadmin workspaces", async ({ page }) => {
    await login(page, vendorEmail!, vendorPassword!, /\/en\/vendor/)
    await page.goto("/en/admin")
    await expect(page).toHaveURL(/\/en\/vendor/)
    await page.goto("/en/superadmin")
    await expect(page).toHaveURL(/\/en\/vendor/)
  })

  test("legacy subtype route resolves to the Vendor workspace", async ({
    page,
  }) => {
    await login(page, vendorEmail!, vendorPassword!, /\/en\/vendor/)
    await page.goto("/en/delegation")
    await expect(page).toHaveURL(/\/en\/vendor/)
  })
})
