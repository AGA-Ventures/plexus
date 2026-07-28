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
  await page.getByLabel("Password", { exact: true }).fill(password)
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
        name: "Discover. Connect. Agree. Grow.",
      })
    ).toBeVisible()
    await expect(page.getByLabel("Email")).toHaveCount(1)
    await expect(page.getByLabel("Password", { exact: true })).toHaveCount(1)
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible()
    await expect(page.getByText("Supabase Auth")).toHaveCount(0)
    await expect(page.getByText("Portal routes")).toHaveCount(0)
    await expect(page.getByText("Self-signup is disabled")).toHaveCount(0)
    await expect(page.getByText(/\/en\/superadmin/)).toHaveCount(0)
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
          name: /discover\. connect\. agree\. grow\.|发现、连接、合作、成长。/i,
        })
      ).toBeVisible()
    })
  }

  test("keeps legacy Vendor subtype routes as redirects", async ({ page }) => {
    await page.goto("/en/delegation")
    await expect(page).toHaveURL(/\/en\/login/)
  })

  test("offers self-service password recovery without a valid session", async ({
    page,
  }) => {
    await page.goto("/en/login")
    await page.getByRole("link", { name: "Forgot password?" }).click()
    await expect(page).toHaveURL(/\/en\/forgot-password$/)
    await expect(
      page.getByRole("heading", { name: "Reset your password" })
    ).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Send recovery link" })
    ).toBeVisible()

    await page.goto("/en/reset-password")
    await expect(
      page.getByText("Recovery link unavailable", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Request a new recovery link" })
    ).toBeVisible()
  })

  test("does not expose protected portal paths on missing pages", async ({
    page,
  }) => {
    await page.goto("/en/not-a-plexus-route")
    await expect(
      page.getByRole("heading", { name: "Page not found" })
    ).toBeVisible()
    await expect(page.getByText("Portal routes")).toHaveCount(0)
    await expect(page.getByText(/\/en\/superadmin/)).toHaveCount(0)
  })

  test("rejects invalid email/password login", async ({ page }) => {
    await login(page, "invalid@example.com", "wrong-password")
    await expect(
      page.getByRole("main").getByText(/email or password is incorrect/i)
    ).toBeVisible()
  })
})

test.describe("Superadmin flow", () => {
  test.skip(
    !superadminEmail || !superadminPassword,
    "Set E2E_SUPERADMIN_EMAIL and E2E_SUPERADMIN_PASSWORD."
  )

  test("Superadmin can view every management directory", async ({ page }) => {
    await login(page, superadminEmail!, superadminPassword!, /\/en\/superadmin/)
    await expect(page).toHaveURL(/\/en\/superadmin/)
    await expect(
      page.getByRole("heading", { name: "Plexus platform control center" })
    ).toBeVisible()
    await openMobilePortalMenu(page)
    const navigation =
      (page.viewportSize()?.width ?? 1024) >= 1024
        ? page.getByRole("complementary")
        : page.getByRole("dialog")
    await expect(navigation.getByText("Superadmin workspace")).toBeVisible()
    await expect(
      navigation.getByRole("tab", { name: "Admin tenants" })
    ).toBeVisible()
    await expect(navigation.getByRole("tab", { name: "Vendors" })).toBeVisible()
    await expect(
      navigation.getByRole("tab", { name: "Audit events" })
    ).toBeVisible()

    if ((page.viewportSize()?.width ?? 1024) < 1024) {
      await navigation.getByRole("tab", { name: "Admin tenants" }).click()
    }

    await expect(
      page.getByRole("button", { name: /send (admin )?reset link/i }).first()
    ).toBeVisible()
    await page.getByRole("button", { name: "Create Admin" }).click()
    const createAdminDialog = page.getByRole("dialog", {
      name: "Create Admin tenant and account",
    })
    await expect(
      createAdminDialog.getByText(
        "Shown to tenant users for login and account help."
      )
    ).toBeVisible()
    await expect(
      createAdminDialog.getByText(
        "Private sign-in and password-recovery email for the first Admin."
      )
    ).toBeVisible()
    await createAdminDialog
      .getByLabel("Temporary password", { exact: true })
      .fill("Temporary-Password-1")
    await createAdminDialog
      .getByLabel("Confirm temporary password")
      .fill("Temporary-Password-2")
    await createAdminDialog.getByLabel("Confirm temporary password").blur()
    await expect(
      createAdminDialog.getByText("Passwords do not match.")
    ).toBeVisible()
    await expect(
      createAdminDialog.getByRole("button", {
        name: "Create tenant and Admin",
      })
    ).toBeDisabled()
    await createAdminDialog
      .getByLabel("Confirm temporary password")
      .fill("Temporary-Password-1")
    await expect(createAdminDialog.getByText("Passwords match.")).toBeVisible()
    await createAdminDialog.getByRole("button", { name: "Close" }).click()
    await page
      .getByRole("button", { name: /edit( tenant profile)?/i })
      .first()
      .click()
    const tenantProfile = page.getByRole("dialog", {
      name: "Edit Admin tenant profile",
    })
    await expect(
      tenantProfile.getByLabel("Login logo", { exact: true })
    ).toHaveAttribute("type", "file")
    await expect(
      tenantProfile.getByRole("link", { name: "Preview login page" })
    ).toHaveAttribute("target", "_blank")
    await expectNoHorizontalOverflow(page)
  })

  test("Superadmin is redirected away from the Admin workspace", async ({
    page,
  }) => {
    await login(page, superadminEmail!, superadminPassword!, /\/en\/superadmin/)
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
    await expect(page.getByText("Tenant-scoped Admin view")).toHaveCount(0)
    await expect(page.getByText("Operational alerts")).toHaveCount(0)
    await expect(
      page.getByRole("link", { name: "Vendor accounts" })
    ).toBeVisible()
    const complianceTab = page.getByRole("tab", { name: "Compliance" })
    await expect(complianceTab).toBeVisible()
    await complianceTab.click()
    await expect(page).toHaveURL(/\/en\/admin\/?$/)
    await expect(
      page.getByRole("heading", { name: "Compliance is coming soon" })
    ).toBeVisible()
    await expect(page.getByText("In progress", { exact: true })).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Provision Vendor account" })
    ).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Tenant settings" })
    ).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
    await openMobilePortalMenu(page)
  })

  test("Admin account settings hide IDs and expose profile, branding, and access controls", async ({
    page,
  }) => {
    await login(page, adminEmail!, adminPassword!, /\/en\/admin/)
    await page.getByRole("button", { name: /Admin account$/ }).click()

    const dialog = page.getByRole("dialog", { name: "User profile" })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel("Display name")).toBeVisible()
    await expect(dialog.getByLabel("Login email")).toHaveAttribute(
      "readonly",
      ""
    )
    await expect(dialog.getByText("User ID", { exact: true })).toHaveCount(0)
    await expect(dialog.getByText("Tenant ID", { exact: true })).toHaveCount(0)

    await dialog.getByRole("button", { name: /White label/ }).click()
    await expect(dialog.getByLabel("Workspace name")).toBeVisible()
    await expect(dialog.getByLabel("Support email")).toBeVisible()
    const accountBrandAvatar = dialog.getByTestId("account-brand-avatar")
    const configuredLogoUrl = await dialog
      .getByLabel("Login logo URL")
      .inputValue()

    if (configuredLogoUrl) {
      await expect(
        accountBrandAvatar.getByRole("img", { name: /workspace logo$/ })
      ).toHaveAttribute("src", configuredLogoUrl)
    } else {
      await expect(
        accountBrandAvatar.locator('[data-slot="avatar-fallback"]')
      ).not.toBeEmpty()
    }
    await expect(
      dialog.getByRole("link", { name: "Preview login page" })
    ).toBeVisible()

    await dialog.getByRole("button", { name: /Access Security/ }).click()
    const languageRoutes = dialog.getByRole("radiogroup", { name: "Language" })
    await expect(languageRoutes.locator("a")).toHaveCount(4)
    await expect(languageRoutes.locator('a[href="/en/admin"]')).toBeVisible()
    await expect(languageRoutes.locator('a[href="/zh/admin"]')).toBeVisible()
    await expect(
      languageRoutes.locator('a[href="/zh-Hant/admin"]')
    ).toBeVisible()
    await expect(languageRoutes.locator('a[href="/th/admin"]')).toBeVisible()
    await expect(languageRoutes.locator('a[href="/ja/admin"]')).toHaveCount(0)
    await expect(
      dialog.getByRole("link", { name: "Send password recovery" })
    ).toBeVisible()
    await expect(dialog.getByText(/Supabase Auth/i)).toHaveCount(0)
    await expect(dialog.getByRole("button", { name: "Logout" })).toBeVisible()
    await expectNoHorizontalOverflow(page)
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
    await openMobilePortalMenu(page)
    await page.getByRole("link", { name: "Vendor accounts" }).click()
    await expect(page).toHaveURL(/\/en\/admin\/vendors/)
    await expect(
      page.getByRole("heading", { name: /Vendor management$/ })
    ).toBeVisible()
    await openMobilePortalMenu(page)
    await expect(
      page.getByRole("link", { name: "Vendor accounts" })
    ).toHaveAttribute("data-state", "active")
    await expect(page.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/en/admin?section=dashboard"
    )
    const viewport = page.viewportSize()
    if (viewport && viewport.width < 1024) {
      const mobileDrawer = page.getByRole("dialog", {
        name: "Plexus Connect",
      })
      const drawerBox = await mobileDrawer.boundingBox()
      const dashboardBox = await page
        .getByRole("link", { name: "Dashboard" })
        .boundingBox()

      expect(drawerBox?.width).toBeGreaterThanOrEqual(viewport.width - 28)
      expect(dashboardBox?.height).toBeGreaterThanOrEqual(48)
    }
    await page.keyboard.press("Escape")
    await page.getByRole("button", { name: "Provision Vendor account" }).click()
    const dialog = page.getByRole("dialog", {
      name: "Create a Vendor in your tenant",
    })
    await expect(dialog).toBeVisible()
    const vendorTypePicker = dialog.getByRole("combobox", {
      name: "Vendor subtype",
    })
    await expect(vendorTypePicker).toContainText("Delegation")
    await vendorTypePicker.click()
    await page.getByRole("option", { name: /Partner/ }).click()
    await expect(vendorTypePicker).toContainText("Partner")
    const sectorPicker = dialog.getByRole("combobox", {
      name: "Sector required",
    })
    await sectorPicker.click()
    const sectorList = page.getByRole("listbox", { name: "Suggestions" })
    await expect(sectorList).toBeVisible()
    const initialSectorScrollTop = await sectorList.evaluate(
      (element) => element.scrollTop
    )
    const initialDialogScrollTop = await dialog.evaluate(
      (element) => element.scrollTop
    )
    await sectorList.hover()
    await page.mouse.wheel(0, 500)
    await expect
      .poll(() => sectorList.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(initialSectorScrollTop)
    await expect
      .poll(() => dialog.evaluate((element) => element.scrollTop))
      .toBe(initialDialogScrollTop)
    await page.keyboard.press("Escape")
    await expectNoHorizontalOverflow(page)
  })

  test("Admin can review meeting operations and provider readiness", async ({
    page,
  }) => {
    await login(page, adminEmail!, adminPassword!, /\/en\/admin/)
    await page.getByRole("button", { name: "Meetings" }).click()
    await page.getByRole("tab", { name: "Meeting dashboard" }).click()

    await expect(
      page.getByText("Meeting operations", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Total meetings", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "All meetings" })
    ).toBeVisible()
    await expect(page.getByText("Zoom", { exact: true }).first()).toBeVisible()
    await expect(page.getByText("Lark", { exact: true }).first()).toBeVisible()

    await page.getByRole("button", { name: "Create meeting" }).click()
    const manualMeetingDialog = page.getByRole("dialog", {
      name: "Create a meeting",
    })
    await expect(manualMeetingDialog).toBeVisible()
    await expect(
      manualMeetingDialog.getByRole("combobox", {
        name: "Delegation Vendor",
      })
    ).toBeVisible()
    await expect(
      manualMeetingDialog.getByRole("combobox", {
        name: "Malaysian partner",
      })
    ).toBeVisible()
    await expect(
      manualMeetingDialog.getByRole("combobox", {
        name: "Meeting platform",
      })
    ).toContainText("Zoom")
    await expect(manualMeetingDialog.getByLabel("Date and time")).toBeVisible()
    await expect(manualMeetingDialog.getByLabel("Meeting agenda")).toBeVisible()
    await expect(
      manualMeetingDialog.getByText("Provider-link protection")
    ).toBeVisible()
    await manualMeetingDialog.getByRole("button", { name: "Cancel" }).click()

    const calendarEntries = page.getByRole("button", {
      name: /View or edit meeting with/,
    })
    const calendarEntryCount = await calendarEntries.count()

    if (calendarEntryCount > 0) {
      await calendarEntries.first().click()
      const meetingDetailsDialog = page.getByRole("dialog", {
        name: "Meeting details",
      })
      await expect(meetingDetailsDialog).toBeVisible()
      await expect(
        meetingDetailsDialog.getByRole("button", { name: "Edit meeting" })
      ).toBeVisible()
      await page.keyboard.press("Escape")
    }

    const rowDetailsActions = page.getByRole("button", {
      name: "View / edit",
    })
    const rowDetailsActionCount = await rowDetailsActions.count()

    if (rowDetailsActionCount > 0) {
      const copyJoinActions = page.getByRole("button", {
        name: "Copy join link",
      })
      const copyJoinActionCount = await copyJoinActions.count()
      expect(copyJoinActionCount).toBeGreaterThan(0)
      await expect(copyJoinActions.first()).toBeVisible()

      await rowDetailsActions.first().click()
      const meetingDetailsDialog = page.getByRole("dialog", {
        name: "Meeting details",
      })
      await meetingDetailsDialog
        .getByRole("button", { name: "Edit meeting" })
        .click()
      await expect(
        page.getByRole("dialog", { name: "Edit meeting" })
      ).toBeVisible()
      await expect(page.getByLabel("Meeting platform")).toBeVisible()
      await expect(page.getByLabel("Date and time")).toBeVisible()
      await expect(page.getByLabel("Meeting agenda")).toBeVisible()
      await page.getByRole("button", { name: "Cancel editing" }).click()
      await page.keyboard.press("Escape")
    }

    await page.getByRole("button", { name: "Meeting settings" }).click()
    await expect(
      page.getByText("Meeting settings", { exact: true }).last()
    ).toBeVisible()
    await expect(page.getByText("Protected meeting links")).toBeVisible()
    await expect(page.getByText("Configuration access")).toBeVisible()
    await expect(page.getByText("Platform managed")).toBeVisible()
    await expect(
      page.getByText(/ZOOM_CLIENT_SECRET|LARK_APP_SECRET/)
    ).toHaveCount(0)
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
    const viewport = page.viewportSize()
    await expect(
      page.getByTestId(
        viewport && viewport.width < 1024
          ? "tenant-workspace-brand-mobile"
          : "tenant-workspace-brand-desktop"
      )
    ).toBeVisible()
    const vendorMetrics = page.getByTestId("vendor-dashboard-metrics")
    await expect(page.getByTestId("vendor-realtime-status")).toHaveText(
      "Live data"
    )
    await expect(vendorMetrics).toContainText("Profile readiness")
    await expect(vendorMetrics).toContainText("Pending matches")
    await expect(vendorMetrics).toContainText("Upcoming meetings")
    await expect(vendorMetrics).toContainText("Active MOUs")
    await expect(
      page.getByText(/Supabase.*Auth.*RLS/, { exact: false })
    ).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
    await openMobilePortalMenu(page)
  })

  test("Vendor cannot enter Admin or Superadmin workspaces", async ({
    page,
  }) => {
    await login(page, vendorEmail!, vendorPassword!, /\/en\/vendor/)
    await page.goto("/en/admin")
    await expect(page).toHaveURL(/\/en\/vendor/)
    await page.goto("/en/superadmin")
    await expect(page).toHaveURL(/\/en\/vendor/)
  })

  test("Vendor profile is single-account, collapsible, and validates typed fields", async ({
    page,
  }) => {
    await login(page, vendorEmail!, vendorPassword!, /\/en\/vendor/)
    await page
      .getByRole("tab", { name: /company profile|partner profile/i })
      .click()

    await expect(page.getByText("Production account")).toHaveCount(0)
    await expect(page.getByTestId("company-profile-completion")).toBeVisible()

    const companySection = page.getByRole("button", {
      name: "1. Company information",
    })
    await expect(companySection).toHaveAttribute("aria-expanded", "true")
    await expect(
      companySection.getByLabel(/\d+ of 7 questions complete/)
    ).toBeVisible()
    await expect(page.getByLabel("Year established")).toHaveAttribute(
      "type",
      "number"
    )
    await expect(page.getByLabel("Website")).toHaveAttribute("type", "url")

    const callingCode = page.getByTestId("mobile-country-code")
    await expect(callingCode).toContainText(/[A-Z]{2} \+\d+/)
    await callingCode.click()
    await page
      .getByRole("combobox", {
        name: "Search country or region calling codes",
      })
      .fill("+853")
    await page.getByRole("option", { name: /MO Macao \+853/ }).click()
    await expect(callingCode).toContainText("MO +853")

    const mobile = page.getByRole("textbox", { name: "Mobile number" })
    await mobile.fill("6612 3456")
    await expect(mobile).toHaveValue("6612 3456")
    await expectNoHorizontalOverflow(page)

    const email = page.getByLabel("Email")
    await expect(email).toHaveAttribute("type", "email")
    await email.fill("not-an-email")
    await email.blur()
    await expect(page.getByText("Enter a valid email address.")).toBeVisible()

    await companySection.click()
    await expect(companySection).toHaveAttribute("aria-expanded", "false")
  })

  test("Vendor can upload and delete a private profile PDF", async ({
    page,
  }) => {
    await login(page, vendorEmail!, vendorPassword!, /\/en\/vendor/)
    await page
      .getByRole("tab", { name: /company profile|partner profile/i })
      .click()

    const fileName = `vendor-profile-e2e-${Date.now()}.pdf`
    await page.getByLabel("Upload PDF document").setInputFiles({
      name: fileName,
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\n%%EOF\n"),
    })

    const library = page.getByTestId("vendor-profile-document-library")
    await expect(library.getByText(fileName)).toBeVisible()
    await expect(library.getByRole("link", { name: "Review" })).toHaveAttribute(
      "target",
      "_blank"
    )

    await library.getByRole("button", { name: `Delete ${fileName}` }).click()
    await page.getByRole("button", { name: "Delete PDF" }).click()
    await expect(library.getByText(fileName)).toHaveCount(0)
  })

  test("Vendor discovery keeps the workspace sidebar and returns to tab routes", async ({
    page,
  }) => {
    await login(page, vendorEmail!, vendorPassword!, /\/en\/vendor/)
    await page.getByRole("tab", { name: "My matches" }).click()
    await page.getByRole("link", { name: "Find companies" }).click()

    await expect(page).toHaveURL(/\/en\/vendor\/discover$/)
    await expect(
      page.getByRole("heading", { name: "Search for your match" })
    ).toBeVisible()
    const backToMatches = page.getByRole("link", {
      name: "Back to My matches",
    })
    await expect(backToMatches).toHaveAttribute(
      "href",
      "/en/vendor?section=matches"
    )
    await backToMatches.click()
    await expect(page).toHaveURL(/\/en\/vendor\?section=matches$/)
    await expect(
      page.getByRole("link", { name: "Find companies" })
    ).toBeVisible()
    const matchCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: "Matched with" })
      .first()
    await expect(matchCard.getByText("Linked Vendor")).toBeVisible()
    await matchCard.getByRole("button", { name: "View details" }).click()
    const matchDetails = page.getByRole("dialog", { name: "Match details" })
    await expect(matchDetails.getByText("Decision progress")).toBeVisible()
    await matchDetails.getByRole("button", { name: "Close" }).click()
    await page.getByRole("link", { name: "Find companies" }).click()
    await expect(page).toHaveURL(/\/en\/vendor\/discover$/)
    await expectNoHorizontalOverflow(page)
    await openMobilePortalMenu(page)

    const navigation =
      (page.viewportSize()?.width ?? 1024) >= 1024
        ? page.getByRole("complementary")
        : page.getByRole("dialog")
    await expect(
      navigation.getByRole("link", { name: "My matches" })
    ).toHaveAttribute("data-state", "active")
    await navigation.getByRole("link", { name: "Dashboard" }).click()
    await expect(page).toHaveURL(/\/en\/vendor\?section=dashboard$/)
    await expect(
      page.getByRole("heading", {
        name: /delegation company workspace|partner enterprise workspace/i,
      })
    ).toBeVisible()
  })

  test("legacy subtype route resolves to the Vendor workspace", async ({
    page,
  }) => {
    await login(page, vendorEmail!, vendorPassword!, /\/en\/vendor/)
    await page.goto("/en/delegation")
    await expect(page).toHaveURL(/\/en\/vendor/)
  })
})
