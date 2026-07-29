"use client"

import { useActionState, useState, type CSSProperties } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Building01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { submitPublicPartnerRegistrationAction } from "@/app/actions/public-registration"
import { IndustrySectorCombobox } from "@/components/industry-sector-combobox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Locale } from "@/lib/i18n"
import {
  emptyPublicPartnerRegistrationState,
  type PublicPartnerRegistrationField,
} from "@/lib/public-partner-registration"
import type { LoginBranding } from "@/lib/tenant-login"

type RegistrationStyle = CSSProperties & {
  "--registration-accent": string
  "--registration-accent-foreground": string
}

const copy = {
  en: {
    kicker: "Malaysian company registration",
    title: "Register your company for business matching.",
    description:
      "Submit a short company profile for the organizer to review. Registration does not create a login account.",
    formTitle: "Company registration",
    formDescription:
      "Fields marked * are required. Approved companies will be contacted separately with account access.",
    company: "Company",
    companyName: "Company name",
    registrationNumber: "SSM / registration number",
    website: "Website (optional)",
    sector: "Industry sector",
    matching: "Business matching",
    introduction: "Company profile",
    introductionHint: "Describe the company in 100–200 words.",
    products: "Products and services",
    lookingFor: "What are you looking for?",
    lookingForHint:
      "Describe the partners, buyers, suppliers, investment, or opportunities you want to meet.",
    contact: "Primary contact",
    contactName: "Contact name",
    contactPosition: "Position / title",
    contactEmail: "Business email",
    mobileNumber: "Mobile number",
    logo: "Company logo (optional)",
    logoHint: "JPG, PNG, or WebP. Maximum 2 MB.",
    submit: "Submit registration",
    submitting: "Submitting...",
    successTitle: "Registration received",
    back: "Back to Plexus",
    privacy:
      "Your information is sent to the named organizer for qualification and business-matching purposes.",
  },
} as const

function Required() {
  return (
    <span className="text-destructive" aria-hidden="true">
      *
    </span>
  )
}

export function PublicPartnerRegistrationForm({
  locale,
  branding,
}: {
  locale: Locale
  branding: LoginBranding & { mode: "tenant"; slug: string }
}) {
  const t = copy.en
  const [sector, setSector] = useState("")
  const [state, action, pending] = useActionState(
    submitPublicPartnerRegistrationAction,
    emptyPublicPartnerRegistrationState
  )
  const style = {
    "--registration-accent": branding.primaryColor,
    "--registration-accent-foreground": branding.accentForeground,
  } satisfies RegistrationStyle
  const errorFor = (field: PublicPartnerRegistrationField | "logo") =>
    state.errors?.[field]

  return (
    <main
      style={style}
      className="relative min-h-screen overflow-hidden bg-[#08080b] px-4 py-8 text-foreground sm:px-6 lg:py-12"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,color-mix(in_srgb,var(--registration-accent)_24%,transparent),transparent_42%),radial-gradient(circle_at_100%_30%,rgba(73,54,99,.2),transparent_38%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
        <section className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-12 lg:p-8">
          <div className="flex items-center gap-3">
            <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
              {branding.logoUrl ? (
                <Image
                  src={branding.logoUrl}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-contain p-2"
                />
              ) : (
                <HugeiconsIcon icon={Building01Icon} className="size-7" />
              )}
            </div>
            <div>
              <p className="text-lg font-semibold">{branding.name}</p>
              <p className="text-sm text-muted-foreground">
                Powered by Plexus
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--registration-accent)] uppercase">
              {t.kicker}
            </p>
            <h1 className="text-3xl leading-tight font-semibold text-balance sm:text-4xl">
              {t.title}
            </h1>
            <p className="leading-7 text-muted-foreground">{t.description}</p>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/15 p-4 text-sm text-muted-foreground">
            <HugeiconsIcon
              icon={SecurityCheckIcon}
              className="mt-0.5 size-5 shrink-0 text-[var(--registration-accent)]"
            />
            <p>{t.privacy}</p>
          </div>
        </section>

        <Card className="border-white/10 bg-card/95 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl">{t.formTitle}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t.formDescription}
            </p>
          </CardHeader>

          {state.ok ? (
            <>
              <CardContent>
                <Alert className="border-[var(--registration-accent)]/40 bg-[var(--registration-accent)]/10 py-4">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} />
                  <AlertTitle>{t.successTitle}</AlertTitle>
                  <AlertDescription>{state.message}</AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/${locale}`}>{t.back}</Link>
                </Button>
              </CardFooter>
            </>
          ) : (
            <form action={action}>
              <input type="hidden" name="tenantSlug" value={branding.slug} />
              <div
                className="absolute -left-[10000px] top-auto size-px overflow-hidden"
                aria-hidden="true"
              >
                <label htmlFor="companyFax">Company fax</label>
                <input
                  id="companyFax"
                  name="companyFax"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>
              <CardContent className="flex flex-col gap-7">
                {state.message ? (
                  <Alert variant="destructive">
                    <AlertTitle>Unable to submit</AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                  </Alert>
                ) : null}

                <FieldGroup>
                  <h2 className="border-b pb-2 text-sm font-semibold">
                    {t.company}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <RegistrationInput
                      name="companyName"
                      label={t.companyName}
                      error={errorFor("companyName")}
                      required
                    />
                    <RegistrationInput
                      name="registrationNumber"
                      label={t.registrationNumber}
                      error={errorFor("registrationNumber")}
                      required
                    />
                    <RegistrationInput
                      name="website"
                      label={t.website}
                      placeholder="https://company.com"
                      error={errorFor("website")}
                    />
                    <Field data-invalid={Boolean(errorFor("sector"))}>
                      <FieldLabel>
                        {t.sector} <Required />
                      </FieldLabel>
                      <input type="hidden" name="sector" value={sector} />
                      <IndustrySectorCombobox
                        id="sector-picker"
                        name="sectorPicker"
                        value={sector}
                        onValueChange={setSector}
                        required
                      />
                      <FieldError message={errorFor("sector")} />
                    </Field>
                  </div>
                  <Field data-invalid={Boolean(errorFor("logo"))}>
                    <FieldLabel htmlFor="logo">{t.logo}</FieldLabel>
                    <Input
                      id="logo"
                      name="logo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      aria-invalid={Boolean(errorFor("logo"))}
                    />
                    <FieldDescription>{t.logoHint}</FieldDescription>
                    <FieldError message={errorFor("logo")} />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <h2 className="border-b pb-2 text-sm font-semibold">
                    {t.matching}
                  </h2>
                  <RegistrationTextarea
                    name="introduction"
                    label={t.introduction}
                    description={t.introductionHint}
                    error={errorFor("introduction")}
                    required
                  />
                  <RegistrationTextarea
                    name="productsServices"
                    label={t.products}
                    error={errorFor("productsServices")}
                    required
                  />
                  <RegistrationTextarea
                    name="lookingFor"
                    label={t.lookingFor}
                    description={t.lookingForHint}
                    error={errorFor("lookingFor")}
                    required
                  />
                </FieldGroup>

                <FieldGroup>
                  <h2 className="border-b pb-2 text-sm font-semibold">
                    {t.contact}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <RegistrationInput
                      name="contactName"
                      label={t.contactName}
                      error={errorFor("contactName")}
                      autoComplete="name"
                      required
                    />
                    <RegistrationInput
                      name="contactPosition"
                      label={t.contactPosition}
                      error={errorFor("contactPosition")}
                      required
                    />
                    <RegistrationInput
                      name="contactEmail"
                      label={t.contactEmail}
                      type="email"
                      error={errorFor("contactEmail")}
                      autoComplete="email"
                      required
                    />
                    <RegistrationInput
                      name="mobileNumber"
                      label={t.mobileNumber}
                      type="tel"
                      placeholder="+60 12 345 6789"
                      error={errorFor("mobileNumber")}
                      autoComplete="tel"
                      required
                    />
                  </div>
                </FieldGroup>
              </CardContent>
              <CardFooter className="mt-6 flex-col gap-3 border-t pt-6">
                <Button
                  type="submit"
                  disabled={pending}
                  className="w-full bg-[var(--registration-accent)] text-[var(--registration-accent-foreground)] hover:bg-[var(--registration-accent)]/90"
                >
                  {pending ? (
                    <>
                      <HugeiconsIcon
                        icon={Loading03Icon}
                        className="animate-spin"
                      />
                      {t.submitting}
                    </>
                  ) : (
                    t.submit
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {branding.supportEmail
                    ? `Questions? Contact ${branding.supportEmail}.`
                    : "Questions? Contact the organizer who shared this link."}
                </p>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </main>
  )
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="text-xs text-destructive" role="alert">
      {message}
    </p>
  ) : null
}

function RegistrationInput({
  name,
  label,
  error,
  required,
  ...props
}: {
  name: string
  label: string
  error?: string
  required?: boolean
} & Omit<React.ComponentProps<typeof Input>, "id" | "name">) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={name}>
        {label} {required ? <Required /> : null}
      </FieldLabel>
      <Input
        id={name}
        name={name}
        required={required}
        aria-invalid={Boolean(error)}
        {...props}
      />
      <FieldError message={error} />
    </Field>
  )
}

function RegistrationTextarea({
  name,
  label,
  description,
  error,
  required,
}: {
  name: string
  label: string
  description?: string
  error?: string
  required?: boolean
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={name}>
        {label} {required ? <Required /> : null}
      </FieldLabel>
      <Textarea
        id={name}
        name={name}
        required={required}
        rows={4}
        aria-invalid={Boolean(error)}
      />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError message={error} />
    </Field>
  )
}
