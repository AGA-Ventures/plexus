"use client"

import { useState, type CSSProperties, type FormEvent } from "react"
import Link from "next/link"
import {
  CheckmarkCircle02Icon,
  Loading03Icon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { CompanyProfileQuestionnaire } from "@/components/company-profile-questionnaire"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  createBlankCompanyRegistrationProfile,
  getCompanyProfileCompletion,
  getCompanyProfileCoreErrors,
} from "@/lib/company-profile"
import type { Locale } from "@/lib/i18n"
import type { CompanyRegistrationProfile, CompanyRole } from "@/lib/local-db"
import { getLoginPath } from "@/lib/password-recovery"
import type { LoginBranding } from "@/lib/tenant-login"
import type { VendorApplicationFieldErrors } from "@/lib/vendor-applications"

type ApplicationStyle = CSSProperties & {
  "--application-accent": string
  "--application-accent-foreground": string
}

export function VendorApplicationForm({
  locale,
  vendorType,
  branding,
}: {
  locale: Locale
  vendorType: CompanyRole
  branding: LoginBranding & { mode: "tenant"; slug: string }
}) {
  const [profile, setProfile] = useState(createBlankCompanyRegistrationProfile)
  const [websiteConfirm, setWebsiteConfirm] = useState("")
  const [errors, setErrors] = useState<VendorApplicationFieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const completion = getCompanyProfileCompletion(profile)
  const style = {
    "--application-accent": branding.primaryColor,
    "--application-accent-foreground": branding.accentForeground,
  } satisfies ApplicationStyle

  function setValue<K extends keyof CompanyRegistrationProfile>(
    field: K,
    value: CompanyRegistrationProfile[K]
  ) {
    setProfile((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const coreErrors = getCompanyProfileCoreErrors(profile)

    if (Object.keys(coreErrors).length) {
      setErrors(coreErrors)
      document
        .querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus({ preventScroll: false })
      return
    }

    setSubmitting(true)
    setErrors({})

    try {
      const response = await fetch("/api/vendor-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: branding.slug,
          vendorType,
          profile,
          websiteConfirm,
        }),
      })
      const payload = (await response.json()) as {
        ok?: boolean
        error?: string
        fieldErrors?: VendorApplicationFieldErrors
      }

      if (!response.ok || !payload.ok) {
        setErrors(
          payload.fieldErrors ?? {
            form:
              payload.error ??
              "The application could not be submitted. Try again.",
          }
        )
        return
      }

      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setErrors({
        form: "The application could not be submitted. Check your connection.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-svh bg-muted/25 px-4 py-10 sm:px-6" style={style}>
        <Card className="mx-auto max-w-2xl overflow-hidden border-0 shadow-xl ring-1 ring-border">
          <div
            className="h-2"
            style={{ backgroundColor: branding.primaryColor }}
          />
          <CardHeader className="items-center justify-items-center px-6 pt-10 text-center sm:px-10">
            <ApplicationBrand branding={branding} compact />
            <span className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                className="size-8"
                strokeWidth={1.8}
              />
            </span>
            <Badge variant="secondary" className="mt-3 capitalize">
              {vendorType} application
            </Badge>
            <CardTitle className="mt-2 text-2xl">
              Your application is awaiting review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-10 text-center sm:px-10">
            <p className="text-sm leading-6 text-muted-foreground">
              {branding.name} has received the company profile. No account has
              been created yet. If the application is approved, the contact
              email will receive a one-time link to set a password.
            </p>
            <Alert className="text-left">
              <HugeiconsIcon icon={SecurityCheckIcon} strokeWidth={1.8} />
              <AlertTitle>Keep an eye on the contact inbox</AlertTitle>
              <AlertDescription>
                The password-setup message will identify this workspace. The
                link is only sent after an Admin approves the application.
              </AlertDescription>
            </Alert>
            <Button asChild variant="outline">
              <Link href={getLoginPath(locale, branding.slug)}>
                Go to {branding.name} login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main
      className="min-h-svh bg-muted/25 px-4 py-8 sm:px-6 sm:py-12"
      style={style}
    >
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
          <div
            className="h-2"
            style={{ backgroundColor: branding.primaryColor }}
          />
          <div className="grid gap-5 p-6 sm:p-8 md:grid-cols-[1fr_260px] md:items-end">
            <div>
              <ApplicationBrand branding={branding} />
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Vendor company application
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Complete all core company-profile questions. Your account will
                only be created if an Admin approves this application.
              </p>
              <Badge className="mt-4 capitalize" variant="outline">
                Vendor type: {vendorType}
              </Badge>
            </div>
            <div className="rounded-xl border bg-muted/25 p-4">
              <div className="flex items-center justify-between text-sm">
                <span>Core profile</span>
                <strong>{completion.percentage}%</strong>
              </div>
              <Progress
                className="mt-3"
                value={completion.percentage}
                aria-label={`Company profile ${completion.percentage}% complete`}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {completion.completed} of {completion.total} required items
              </p>
            </div>
          </div>
        </header>

        <form noValidate onSubmit={submitApplication}>
          <CompanyProfileQuestionnaire
            profile={profile}
            onChange={setValue}
            errors={errors}
            idPrefix="vendor-application"
            publicApplication
          />

          <div className="pointer-events-none absolute top-auto -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="vendor-application-website-confirm">
              Leave this field empty
            </label>
            <input
              id="vendor-application-website-confirm"
              name="websiteConfirm"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={websiteConfirm}
              onChange={(event) => setWebsiteConfirm(event.target.value)}
            />
          </div>

          {errors.form ? (
            <Alert variant="destructive" className="mt-5" aria-live="polite">
              <AlertTitle>Application not submitted</AlertTitle>
              <AlertDescription>{errors.form}</AlertDescription>
            </Alert>
          ) : null}

          <Card className="mt-5">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                By submitting, you confirm the information is accurate. A
                password and Vendor workspace are not created at this stage.
              </p>
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="shrink-0 bg-[var(--application-accent)] text-[var(--application-accent-foreground)] hover:bg-[var(--application-accent)] hover:opacity-90"
              >
                <HugeiconsIcon
                  icon={submitting ? Loading03Icon : CheckmarkCircle02Icon}
                  className={submitting ? "animate-spin" : undefined}
                  strokeWidth={1.8}
                />
                {submitting ? "Submitting…" : "Submit application"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </main>
  )
}

function ApplicationBrand({
  branding,
  compact = false,
}: {
  branding: LoginBranding & { mode: "tenant"; slug: string }
  compact?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 ${compact ? "justify-center" : ""}`}
      data-testid="tenant-vendor-application-brand"
    >
      {branding.logoUrl ? (
        // Tenant operators control this validated HTTPS or public-path URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={branding.logoUrl}
          alt={`${branding.name} logo`}
          className="max-h-12 max-w-[180px] object-contain"
        />
      ) : (
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-semibold"
          style={{
            backgroundColor: branding.primaryColor,
            color: branding.accentForeground,
          }}
          aria-hidden
        >
          {branding.name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <div className={compact ? "text-left" : undefined}>
        <p className="font-semibold">{branding.name}</p>
        <p className="text-xs text-muted-foreground">Powered by Plexus</p>
      </div>
    </div>
  )
}
