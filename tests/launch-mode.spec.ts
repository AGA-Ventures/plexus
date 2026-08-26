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
  await page.getByRole("button", { name: /sign in/i }).click()

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

test.describe("shared public navigation", () => {
  test("uses one SiteHeader across every public route family", async ({
    page,
  }) => {
    for (const route of [
      "/?lang=en",
      "/app?lang=en",
      "/pre-event?lang=en",
      "/contact?lang=en",
      "/for-investment?lang=en",
      "/for-government?lang=en",
      "/events?lang=en",
      "/events/macau-malaysia-business-delegation?lang=en",
      "/legal/privacy?lang=en",
      "/en/privacy",
    ]) {
      await page.goto(route)
      await expect(page.getByTestId("site-header")).toHaveCount(1)
      await expect(
        page.getByTestId("site-header").getByRole("img", { name: "Plexus" })
      ).toBeVisible()
      await expectNoHorizontalOverflow(page)
    }
  })
})

test.describe("public pre-event campaign", () => {
  test("prepares a worldwide inquiry without collecting personal data", async ({
    page,
  }) => {
    const supabaseRequests: string[] = []
    page.on("request", (request) => {
      if (request.url().includes("supabase.co")) {
        supabaseRequests.push(request.url())
      }
    })

    await page.goto("/pre-event?lang=en")

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Build the right business relationships before you arrive.",
      })
    ).toBeVisible()
    await expect(page).toHaveTitle(
      "Cross-border business matching and pre-event support | Plexus"
    )
    await expect(
      page.getByRole("img", {
        name: "A Plexus coordinator helps an international delegate prepare business matches, meetings and an arrival plan",
      })
    ).toHaveAttribute("src", /plexus-pre-event-planning/)
    if ((page.viewportSize()?.width ?? 1024) >= 640) {
      await expect(
        page.getByTestId("site-header").getByRole("link", {
          name: "Login",
          exact: true,
        })
      ).toHaveCSS("background-color", "rgb(7, 88, 200)")
    } else {
      await page
        .getByTestId("site-header")
        .getByRole("button", { name: "Menu" })
        .click()
      await expect(
        page.getByTestId("site-header").getByRole("link", {
          name: "Login",
          exact: true,
        })
      ).toBeVisible()
    }
    await expect(
      page.getByRole("img", { name: "Plexus" }).first()
    ).toHaveAttribute("src", /plexus-wordmark-transparent-trimmed/)
    await expect(
      page.getByRole("img", { name: "Plexus" }).last()
    ).toHaveAttribute("src", /plexus-wordmark-transparent-trimmed/)
    await expect(
      page.getByText("Worldwide inquiries", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("Malaysia · Live", { exact: true })
    ).toBeVisible()
    await expect(page.getByText("Macao · Live", { exact: true })).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "More than an introduction." })
    ).toBeVisible()
    await expect(
      page
        .locator("#country-support")
        .getByText(/business outcomes are not guaranteed\./)
    ).toBeVisible()
    await expect(
      page.getByText(
        /This page does not sell flight tickets or hotel rooms, issue visas, guarantee approvals, or accept travel payments\./
      )
    ).toBeVisible()

    const search = page.getByRole("searchbox", {
      name: "Search countries and regions",
    })
    await search.fill("Macao")
    const macaoOption = page.getByRole("button", {
      name: "Select Macao SAR China",
    })
    await macaoOption.focus()
    await page.keyboard.press("Enter")
    await expect(macaoOption).toHaveAttribute("aria-pressed", "true")

    const whatsapp = page.getByTestId("pre-event-whatsapp")
    if ((await whatsapp.count()) > 0) {
      const whatsappHref = await whatsapp.getAttribute("href")
      expect(whatsappHref).toBeTruthy()
      const whatsappUrl = new URL(whatsappHref!)
      expect(whatsappUrl.origin).toBe("https://wa.me")
      expect(whatsappUrl.searchParams.get("text")).toContain(
        "travelling from Macao SAR China"
      )
      expect(whatsappUrl.searchParams.get("text")).toContain(
        "business objectives"
      )
    } else {
      await expect(
        page.getByRole("link", { name: "Discuss your program" }).last()
      ).toBeVisible()
    }

    await expect(page.getByTestId("pre-event-cobrand")).toHaveCount(0)
    await expect(page.getByTestId("pre-event-email")).toHaveCount(0)
    await expect(page.getByTestId("pre-event-callback")).toHaveCount(0)
    await expect(page.getByText("MDEC", { exact: true })).toHaveCount(0)
    await expect(page.getByText("WeChat", { exact: true })).toHaveCount(0)
    await expect(page.getByText("LINE", { exact: true })).toHaveCount(0)
    await expect(
      page.getByRole("link", { name: "Pre-event Support", exact: true })
    ).toHaveAttribute("href", "/pre-event?lang=en")
    expect(supabaseRequests).toEqual([])
    await expectNoHorizontalOverflow(page)
  })

  test("localizes the public campaign and normalizes an unsupported locale", async ({
    page,
  }) => {
    for (const [lang, heading] of [
      ["ms", "Bina hubungan perniagaan yang tepat sebelum anda tiba."],
      ["zh-Hant", "抵埗前，先建立合適的商務關係。"],
      [
        "unsupported",
        "Build the right business relationships before you arrive.",
      ],
    ] as const) {
      await page.goto(`/pre-event?lang=${lang}`)
      await expect(
        page.getByRole("heading", { level: 1, name: heading })
      ).toBeVisible()
      await expectNoHorizontalOverflow(page)
    }
  })
})

test.describe("three-tier route protection", () => {
  test("uses one responsive login page for all three roles", async ({
    page,
  }) => {
    await page.goto("/en/login")
    await expect(
      page.getByRole("heading", {
        name: "One governed workspace. Every responsible next step.",
      })
    ).toBeVisible()
    await expect(page.getByLabel("Email")).toHaveCount(1)
    await expect(page.getByLabel("Password", { exact: true })).toHaveCount(1)
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible()
    await expect(page.getByText("Remember me")).toHaveCount(0)
    await expect(page.getByText("Identity", { exact: true })).toBeVisible()
    await expect(page.getByText("Workspace", { exact: true })).toBeVisible()
    await expect(
      page.getByText("Responsible next step", { exact: true })
    ).toBeVisible()
    await expect(page.locator("[data-login-rail]")).toBeVisible()
    await expect(page.locator("[data-login-network]")).toBeVisible()
    await expect(page.locator("[data-login-stage-grid]")).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Open support options" })
    ).toHaveAttribute("href", "/contact?lang=en")
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
          name: /one governed workspace\. every responsible next step\.|一个受治理的工作台，承接每个负责任的下一步。/i,
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

  test("localizes login errors and password controls", async ({ page }) => {
    await page.goto("/th/login")
    await expect(
      page.getByRole("button", { name: "แสดงรหัสผ่าน" })
    ).toBeVisible()
    await page.getByLabel("อีเมล").fill("invalid@example.com")
    await page.getByLabel("รหัสผ่าน", { exact: true }).fill("wrong-password")
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click()
    await expect(
      page.getByText("อีเมลหรือรหัสผ่านไม่ถูกต้อง โปรดตรวจสอบแล้วลองอีกครั้ง")
    ).toBeVisible()
    await expect(
      page.getByText(/app_metadata|admin_id|vendor_company_id/)
    ).toHaveCount(0)
  })

  test("explains unavailable tenant links without exposing tenant data", async ({
    page,
  }) => {
    await page.goto("/en/login?tenant=unavailable-workspace")
    await expect(
      page.getByText("Organization sign-in unavailable", { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText(/continue with Plexus or contact support/i)
    ).toBeVisible()
    await expect(page.locator('input[name="tenantSlug"]')).toHaveCount(0)
    await expect(
      page.getByRole("link", { name: "Open support options" })
    ).toBeVisible()
  })

  test("keeps password recovery confirmation inline and clears its query flag", async ({
    page,
  }) => {
    await page.goto("/en/login?passwordUpdated=1")
    await expect(page).toHaveURL(/\/en\/login$/)
    await expect(
      page.getByText("Password updated. Sign in with your new password.", {
        exact: true,
      })
    ).toHaveCount(1)
  })

  test("keeps mobile login controls within the accessible target floor", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/en/login")

    await expect(page.locator("main.login-checkpoint")).toBeVisible()
    await expect(page.getByText("Identity", { exact: true })).toBeVisible()
    await expect(page.getByText("Workspace", { exact: true })).toBeVisible()

    for (const control of [
      page.getByRole("button", { name: "Show password" }),
      page.getByRole("link", { name: "Forgot password?" }),
      page.getByRole("link", { name: "Open support options" }),
    ]) {
      const box = await control.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)
    }

    await expectNoHorizontalOverflow(page)
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
    await expect(
      page.getByTestId(
        (page.viewportSize()?.width ?? 1024) >= 1024
          ? "workspace-navigation-shell"
          : "workspace-mobile-header"
      )
    ).toBeVisible()
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
    await expect(page.getByText("Phase timeline", { exact: true })).toHaveCount(
      0
    )
    expect(
      await page.getByRole("group", { name: "Meeting actions" }).count()
    ).toBeGreaterThan(0)
    await expect(page.getByText("Tenant-scoped Admin view")).toHaveCount(0)
    await expect(page.getByText("Operational alerts")).toHaveCount(0)
    await expect(
      page.getByRole("link", { name: "Vendor accounts" })
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Compliance" })).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Provision Vendor account" })
    ).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Tenant settings" })
    ).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
    await openMobilePortalMenu(page)
  })

  test("Admin can view the tenant Vendor discovery control in Matching", async ({
    page,
  }) => {
    await login(page, adminEmail!, adminPassword!, /\/en\/admin/)
    await page.getByRole("tab", { name: "Matching" }).click()

    await expect(
      page.getByRole("heading", { name: "Vendor discovery" })
    ).toBeVisible()
    await expect(
      page.getByRole("switch", {
        name: "Allow Vendors to browse companies",
      })
    ).toBeVisible()
    await expect(
      page.getByText(
        "Allow Vendors to browse eligible companies and request matches themselves."
      )
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test("Admin account settings hide IDs and keep logout in the sidebar", async ({
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
    await expect(dialog.getByRole("button", { name: "Logout" })).toHaveCount(0)
    await expect(
      dialog.getByRole("link", { name: /Open .* page/ })
    ).toHaveCount(0)
    await dialog.getByRole("button", { name: "Close" }).click()
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible()
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
    await expectNoHorizontalOverflow(page)
  })

  test("Admin signup links open locked public forms without file uploads", async ({
    page,
  }) => {
    await login(page, adminEmail!, adminPassword!, /\/en\/admin/)
    await page.goto("/en/admin/vendors")

    await expect(
      page.getByRole("heading", { name: "Signup links" })
    ).toBeVisible()
    const delegationPath = await page
      .getByText(/\/en\/vendor-signup\/.+\/delegation$/)
      .textContent()
    const partnerPath = await page
      .getByText(/\/en\/vendor-signup\/.+\/partner$/)
      .textContent()

    expect(delegationPath).toBeTruthy()
    expect(partnerPath).toBeTruthy()

    await page.goto(delegationPath!)
    await expect(
      page.getByRole("heading", { name: "Vendor company application" })
    ).toBeVisible()
    await expect(page.getByText("Vendor type: delegation")).toBeVisible()
    await expect(page.locator('input[type="file"]')).toHaveCount(0)
    await expect(
      page.getByTestId("public-document-upload-deferred")
    ).toBeVisible()
    await expect(page.getByText("0 of 25 required items")).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "10. Meeting arrangement" })
    ).toHaveCount(0)
    await expect(
      page.getByRole("heading", { name: "10. Supporting documents" })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "11. Consent" })
    ).toBeVisible()
    await expectNoHorizontalOverflow(page)

    await page.goto(partnerPath!)
    await expect(page.getByText("Vendor type: partner")).toBeVisible()
    await expect(page.locator('input[type="file"]')).toHaveCount(0)
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

    const completeActions = page.getByRole("button", { name: "Complete" })
    const completeActionCount = await completeActions.count()

    if (completeActionCount > 0) {
      await completeActions.first().click()
      const completeDialog = page.getByRole("alertdialog")
      await expect(
        completeDialog.getByText("Complete this meeting?", { exact: true })
      ).toBeVisible()
      await expect(
        completeDialog.getByRole("button", { name: "Confirm complete" })
      ).toBeVisible()
      await completeDialog.getByRole("button", { name: "Keep active" }).click()
    }

    await page.getByRole("button", { name: "Meeting settings" }).click()
    await expect(
      page.getByText("Meeting settings", { exact: true }).last()
    ).toBeVisible()
    await expect(page.getByText("Protected meeting links")).toBeVisible()
    await expect(page.getByText("Configuration access")).toBeVisible()
    await expect(page.getByText("Platform managed")).toBeVisible()
    await expect(page.getByText("Vendor booking availability")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Save availability" })
    ).toBeDisabled()
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
    await expect(
      page.getByTestId(
        viewport && viewport.width < 1024
          ? "workspace-mobile-header"
          : "workspace-navigation-shell"
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
    await expect(
      page.getByRole("button", { name: "Request change" })
    ).toHaveCount(0)
    await expect(
      page
        .getByText(
          /Awaiting acceptance|Pending other Vendor|Your acceptance needed|Pending meeting|Meeting approval needed|Awaiting Vendor approval|Meeting scheduled/
        )
        .first()
    ).toBeVisible()
    const pendingMeetingCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: "Pending meeting" })
      .first()
    await expect(
      pendingMeetingCard.getByRole("button", { name: "Propose meeting" })
    ).toBeVisible()
    await pendingMeetingCard
      .getByRole("button", { name: "Propose meeting" })
      .click()
    const scheduleDialog = page.getByRole("dialog", {
      name: "Propose a meeting time",
    })
    await expect(scheduleDialog.getByText("1. Choose a date")).toBeVisible()
    await expect(scheduleDialog.getByText("2. Choose a time")).toBeVisible()
    await expect(
      scheduleDialog.getByText(
        "Select a date first to see its available times."
      )
    ).toBeVisible()
    const availableDates = scheduleDialog.getByRole("group", {
      name: "Available dates",
    })
    await expect(availableDates.getByRole("button")).toHaveCount(5)
    await availableDates.getByRole("button").first().click()
    const availableTimes = scheduleDialog.getByRole("group", {
      name: "Available times",
    })
    await expect(availableTimes).toBeVisible()
    await availableTimes.getByRole("button").first().click()
    await expect(
      scheduleDialog.getByRole("button", { name: "Send proposal" })
    ).toBeEnabled()
    await scheduleDialog.getByRole("button", { name: "Cancel" }).click()
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
