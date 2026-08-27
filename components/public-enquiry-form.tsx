"use client"

import { useState, type FormEvent, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import type { PublicLocale } from "@/lib/public-site"
import type { PublicEnquiryType } from "@/lib/public-enquiry"

type EnquiryFormCopy = {
  title: string
  body: string
  nameLabel: string
  organisationLabel: string
  emailLabel: string
  phoneLabel: string
  phoneOptional: string
  enquiryTypeLabel: string
  enquiryTypes: Record<PublicEnquiryType, string>
  messageLabel: string
  messageHint: string
  pricingMessageLabel: string
  pricingMessageHint: string
  submit: string
  sending: string
  pricingSubmit: string
  pricingSending: string
  successTitle: string
  successBody: string
  errors: Record<
    | "invalid"
    | "invalidEmail"
    | "validation_failed"
    | "request_too_large"
    | "invalid_request"
    | "service_unavailable"
    | "delivery_failed"
    | "network",
    string
  >
}

type FormValues = {
  name: string
  organisation: string
  email: string
  phone: string
  enquiryType: PublicEnquiryType
  message: string
  websiteConfirm: string
}

type FormField = keyof Pick<
  FormValues,
  "name" | "organisation" | "email" | "message"
>

function createInitialValues(enquiryType: PublicEnquiryType): FormValues {
  return {
    name: "",
    organisation: "",
    email: "",
    phone: "",
    enquiryType,
    message: "",
    websiteConfirm: "",
  }
}

export function PublicEnquiryForm({
  copy,
  locale,
  sourcePage,
  initialEnquiryType,
  fallbackEmail,
}: {
  copy: EnquiryFormCopy
  locale: PublicLocale
  sourcePage: "pricing" | "contact"
  initialEnquiryType: PublicEnquiryType
  fallbackEmail: string
}) {
  const [values, setValues] = useState(() =>
    createInitialValues(initialEnquiryType)
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted">(
    "idle"
  )
  const [formError, setFormError] = useState("")

  function updateValue(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => {
      if (!current[field]) {
        return current
      }

      const next = { ...current }
      delete next[field]
      return next
    })
    setFormError("")
  }

  function validate() {
    const next: Partial<Record<FormField, string>> = {}

    if (!values.name.trim()) next.name = copy.errors.invalid
    if (!values.organisation.trim()) next.organisation = copy.errors.invalid
    if (!values.email.trim() || !/^\S+@\S+\.\S+$/.test(values.email)) {
      next.email = copy.errors.invalidEmail
    }
    if (values.message.trim().length < 10) next.message = copy.errors.invalid

    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validate()) {
      return
    }

    setStatus("submitting")
    setFormError("")

    try {
      const response = await fetch("/api/public-enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, locale, sourcePage }),
      })
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean
        error?: keyof EnquiryFormCopy["errors"]
        fieldErrors?: Record<string, "invalid" | "invalidEmail">
      } | null

      if (!response.ok || !payload?.ok) {
        setFieldErrors(
          Object.fromEntries(
            Object.entries(payload?.fieldErrors ?? {}).map(([field, error]) => [
              field,
              copy.errors[error],
            ])
          )
        )
        setFormError(copy.errors[payload?.error ?? "network"])
        setStatus("idle")
        return
      }

      setStatus("submitted")
    } catch {
      setFormError(copy.errors.network)
      setStatus("idle")
    }
  }

  if (status === "submitted") {
    return (
      <div
        className="rounded-[14px] bg-[#071326] p-6 text-white sm:p-8"
        aria-live="polite"
      >
        <h3 className="text-2xl font-semibold tracking-[-0.02em]">
          {copy.successTitle}
        </h3>
        <p className="mt-3 max-w-xl text-base leading-7 text-[#dcecf7]">
          {copy.successBody}
        </p>
      </div>
    )
  }

  const fieldClassName =
    "mt-2 min-h-12 w-full rounded-[11px] border bg-[#f7f7f2] px-3 text-base text-[#111826] outline-none transition placeholder:text-[#607084] aria-invalid:border-[#a33a00] focus-visible:border-[#0a84ff] focus-visible:ring-2 focus-visible:ring-[#0a84ff]/35"
  const isPricing = sourcePage === "pricing"

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="rounded-[14px] bg-white p-5 sm:p-8"
    >
      <h3 className="text-2xl font-semibold tracking-[-0.02em] text-[#111826]">
        {copy.title}
      </h3>
      <p className="mt-3 max-w-2xl text-base leading-7 text-[#53667c]">
        {copy.body}
      </p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field
          error={fieldErrors.name}
          htmlFor={`${sourcePage}-enquiry-name`}
          label={copy.nameLabel}
          required
        >
          <input
            id={`${sourcePage}-enquiry-name`}
            name="name"
            autoComplete="name"
            required
            maxLength={160}
            value={values.name}
            onChange={(event) => updateValue("name", event.target.value)}
            className={fieldClassName}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={
              fieldErrors.name ? `${sourcePage}-enquiry-name-error` : undefined
            }
          />
        </Field>
        <Field
          error={fieldErrors.organisation}
          htmlFor={`${sourcePage}-enquiry-organisation`}
          label={copy.organisationLabel}
          required
        >
          <input
            id={`${sourcePage}-enquiry-organisation`}
            name="organisation"
            autoComplete="organization"
            required
            maxLength={160}
            value={values.organisation}
            onChange={(event) =>
              updateValue("organisation", event.target.value)
            }
            className={fieldClassName}
            aria-invalid={Boolean(fieldErrors.organisation)}
            aria-describedby={
              fieldErrors.organisation
                ? `${sourcePage}-enquiry-organisation-error`
                : undefined
            }
          />
        </Field>
        <Field
          error={fieldErrors.email}
          htmlFor={`${sourcePage}-enquiry-email`}
          label={copy.emailLabel}
          required
        >
          <input
            id={`${sourcePage}-enquiry-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={values.email}
            onChange={(event) => updateValue("email", event.target.value)}
            className={fieldClassName}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={
              fieldErrors.email
                ? `${sourcePage}-enquiry-email-error`
                : undefined
            }
          />
        </Field>
        <Field
          htmlFor={`${sourcePage}-enquiry-phone`}
          label={`${copy.phoneLabel} (${copy.phoneOptional})`}
        >
          <input
            id={`${sourcePage}-enquiry-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            value={values.phone}
            onChange={(event) => updateValue("phone", event.target.value)}
            className={fieldClassName}
          />
        </Field>
      </div>

      <Field
        htmlFor={`${sourcePage}-enquiry-type`}
        label={copy.enquiryTypeLabel}
        className="mt-5"
      >
        <select
          id={`${sourcePage}-enquiry-type`}
          name="enquiryType"
          value={values.enquiryType}
          onChange={(event) => updateValue("enquiryType", event.target.value)}
          className={fieldClassName}
        >
          {(Object.keys(copy.enquiryTypes) as PublicEnquiryType[]).map(
            (type) => (
              <option key={type} value={type}>
                {copy.enquiryTypes[type]}
              </option>
            )
          )}
        </select>
      </Field>

      <Field
        error={fieldErrors.message}
        htmlFor={`${sourcePage}-enquiry-message`}
        label={isPricing ? copy.pricingMessageLabel : copy.messageLabel}
        hint={isPricing ? copy.pricingMessageHint : copy.messageHint}
        className="mt-5"
        required
      >
        <textarea
          id={`${sourcePage}-enquiry-message`}
          name="message"
          rows={6}
          required
          maxLength={4000}
          value={values.message}
          onChange={(event) => updateValue("message", event.target.value)}
          className={`${fieldClassName} min-h-36 py-3`}
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={
            fieldErrors.message
              ? `${sourcePage}-enquiry-message-error`
              : undefined
          }
        />
      </Field>

      <div className="sr-only" aria-hidden="true">
        <label htmlFor={`${sourcePage}-enquiry-website`}>Website</label>
        <input
          id={`${sourcePage}-enquiry-website`}
          name="websiteConfirm"
          tabIndex={-1}
          autoComplete="off"
          value={values.websiteConfirm}
          onChange={(event) =>
            updateValue("websiteConfirm", event.target.value)
          }
        />
      </div>

      {formError ? (
        <div
          className="mt-5 rounded-[11px] bg-[#fff0c9] p-4 text-sm leading-6 text-[#51436a]"
          role="alert"
        >
          <p>{formError}</p>
          <a
            href={`mailto:${fallbackEmail}`}
            className="mt-2 inline-flex font-semibold text-[#0758c8] underline underline-offset-4 hover:text-[#071326] focus-visible:ring-2 focus-visible:ring-[#0a84ff] focus-visible:outline-none"
          >
            {fallbackEmail}
          </a>
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={status === "submitting"}
        className="mt-6 min-h-12 rounded-[11px] bg-[#0758c8] px-5 text-sm text-white hover:bg-[#064caf]"
      >
        {status === "submitting"
          ? isPricing
            ? copy.pricingSending
            : copy.sending
          : isPricing
            ? copy.pricingSubmit
            : copy.submit}
      </Button>
    </form>
  )
}

function Field({
  children,
  className = "",
  error,
  hint,
  htmlFor,
  label,
  required = false,
}: {
  children: ReactNode
  className?: string
  error?: string
  hint?: string
  htmlFor: string
  label: string
  required?: boolean
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-[#111826]">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {hint ? (
        <p className="mt-2 text-sm leading-6 text-[#53667c]">{hint}</p>
      ) : null}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          className="mt-2 text-sm leading-6 text-[#a33a00]"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
