import { expect, test, type Page } from "@playwright/test"

const adminEmail = process.env.E2E_ADMIN_EMAIL
const adminPassword = process.env.E2E_ADMIN_PASSWORD
const delegationEmail = process.env.E2E_DELEGATION_EMAIL
const delegationPassword = process.env.E2E_DELEGATION_PASSWORD
const partnerEmail = process.env.E2E_PARTNER_EMAIL
const partnerPassword = process.env.E2E_PARTNER_PASSWORD

async function login(page: Page, email: string, password: string) {
  await page.goto("/en/login")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: /login/i }).click()
}

test.describe("launch route protection", () => {
  for (const route of ["/en/admin", "/en/delegation", "/en/partner", "/zh/admin", "/cn/admin"]) {
    test(`redirects unauthenticated users from ${route}`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/(en|zh)\/login/)
      await expect(page.getByRole("heading", { name: /login to plexus connect|登录 plexus connect/i })).toBeVisible()
    })
  }

  test("rejects invalid email/password login", async ({ page }) => {
    await login(page, "invalid@example.com", "wrong-password")
    await expect(page.getByRole("main").getByText("Invalid login credentials.")).toBeVisible()
  })
})

test.describe("authenticated launch flows", () => {
  test.skip(!adminEmail || !adminPassword, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.")

  test("admin can enter the Supabase production dashboard", async ({ page }) => {
    await login(page, adminEmail!, adminPassword!)
    await expect(page).toHaveURL(/\/en\/admin/)
    await expect(page.getByText("Supabase production")).toBeVisible()
    await expect(page.getByRole("heading", { name: "Admin operations dashboard" })).toBeVisible()
  })

  test("admin role is redirected away from another role route", async ({ page }) => {
    await login(page, adminEmail!, adminPassword!)
    await page.goto("/en/delegation")
    await expect(page).toHaveURL(/\/en\/admin/)
  })

  test("admin can open company CRUD dialog", async ({ page }) => {
    await login(page, adminEmail!, adminPassword!)
    await page.getByRole("button", { name: "Companies" }).click()
    await page.getByRole("tab", { name: "Delegation" }).click()
    await page.getByRole("button", { name: "Add Delegation" }).click()
    await expect(page.getByRole("dialog", { name: /add delegation company/i })).toBeVisible()
    await page.getByRole("button", { name: "Cancel" }).click()
  })
})

test.describe("delegation and partner launch flows", () => {
  test.skip(
    !delegationEmail || !delegationPassword || !partnerEmail || !partnerPassword,
    "Set E2E_DELEGATION_* and E2E_PARTNER_* credentials."
  )

  test("delegation user lands on delegation portal", async ({ page }) => {
    await login(page, delegationEmail!, delegationPassword!)
    await expect(page).toHaveURL(/\/en\/delegation/)
    await expect(page.getByRole("heading", { name: "Delegation company workspace" })).toBeVisible()
  })

  test("partner user can confirm attendance", async ({ page }) => {
    await login(page, partnerEmail!, partnerPassword!)
    await expect(page).toHaveURL(/\/en\/partner/)
    await expect(page.getByRole("heading", { name: "Partner enterprise workspace" })).toBeVisible()
    await page.getByRole("button", { name: /confirm attendance/i }).first().click()
    await expect(page.getByText(/attendance confirmed/i)).toBeVisible()
  })
})
