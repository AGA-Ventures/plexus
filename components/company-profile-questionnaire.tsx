"use client"

import type { ReactNode } from "react"

import { IndustrySectorMultiCombobox } from "@/components/industry-sector-combobox"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  companyIntroductionWordLimits,
  companyProfileOptionGroups,
  getMalaysiaToday,
  type CompanyProfileValidationErrors,
} from "@/lib/company-profile"
import type { CompanyRegistrationProfile } from "@/lib/local-db"
import { cn } from "@/lib/utils"

export function CompanyProfileQuestionnaire({
  profile,
  onChange,
  errors = {},
  idPrefix = "company-profile",
  documentLibrary,
  publicApplication = false,
}: {
  profile: CompanyRegistrationProfile
  onChange: <K extends keyof CompanyRegistrationProfile>(
    field: K,
    value: CompanyRegistrationProfile[K]
  ) => void
  errors?: CompanyProfileValidationErrors
  idPrefix?: string
  documentLibrary?: ReactNode
  publicApplication?: boolean
}) {
  function toggleList(field: keyof CompanyRegistrationProfile, value: string) {
    const current = profile[field]

    if (!Array.isArray(current)) return

    onChange(
      field,
      (current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]) as never
    )
  }

  const introductionWords = profile.introduction.trim()
    ? profile.introduction.trim().split(/\s+/).length
    : 0

  return (
    <div className="space-y-5">
      <QuestionnaireSection title="1. Company information">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            id={`${idPrefix}-company-name-en`}
            label="Company name (English)"
            required
            maxLength={240}
            value={profile.companyNameEn}
            error={errors.companyNameEn}
            onChange={(value) => onChange("companyNameEn", value)}
          />
          <TextField
            id={`${idPrefix}-company-name-cn`}
            label="Company name (Chinese, if applicable)"
            maxLength={240}
            value={profile.companyNameCn}
            error={errors.companyNameCn}
            onChange={(value) => onChange("companyNameCn", value)}
          />
          <SelectField
            id={`${idPrefix}-country-region`}
            label="Country / Region"
            required
            options={companyProfileOptionGroups.countryRegion}
            value={profile.countryRegion}
            error={errors.countryRegion}
            onChange={(value) => onChange("countryRegion", value)}
          />
          {profile.countryRegion === "Other" ? (
            <TextField
              id={`${idPrefix}-country-other`}
              label="Other country / region"
              required
              maxLength={120}
              value={profile.countryOther}
              error={errors.countryOther}
              onChange={(value) => onChange("countryOther", value)}
            />
          ) : null}
          <TextField
            id={`${idPrefix}-year-established`}
            label="Year established"
            required
            type="number"
            inputMode="numeric"
            min={1800}
            max={Number(getMalaysiaToday().slice(0, 4))}
            placeholder="e.g. 2018"
            value={profile.yearEstablished}
            error={errors.yearEstablished}
            onChange={(value) => onChange("yearEstablished", value)}
          />
          <TextField
            id={`${idPrefix}-registration-number`}
            label="Company registration number"
            required
            maxLength={120}
            value={profile.registrationNumber}
            error={errors.registrationNumber}
            onChange={(value) => onChange("registrationNumber", value)}
          />
          <TextField
            id={`${idPrefix}-website`}
            label="Website"
            required
            type="url"
            inputMode="url"
            autoComplete="url"
            maxLength={240}
            placeholder="https://example.com"
            value={profile.website}
            error={errors.website}
            onChange={(value) => onChange("website", value)}
          />
          <TextField
            id={`${idPrefix}-address`}
            label="Company address"
            required
            autoComplete="street-address"
            maxLength={500}
            value={profile.address}
            error={errors.address}
            onChange={(value) => onChange("address", value)}
          />
          <SelectField
            id={`${idPrefix}-employee-range`}
            label="Number of employees"
            required
            options={companyProfileOptionGroups.employeeRange}
            value={profile.employeeRange}
            error={errors.employeeRange}
            onChange={(value) => onChange("employeeRange", value)}
          />
          <SelectField
            id={`${idPrefix}-annual-revenue`}
            label="Annual revenue range (optional)"
            options={companyProfileOptionGroups.annualRevenueRange}
            value={profile.annualRevenueRange}
            error={errors.annualRevenueRange}
            onChange={(value) => onChange("annualRevenueRange", value)}
          />
        </div>
      </QuestionnaireSection>

      <QuestionnaireSection title="2. Contact person">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            id={`${idPrefix}-contact-name`}
            label="Name"
            required
            autoComplete="name"
            maxLength={160}
            value={profile.contactName}
            error={errors.contactName}
            onChange={(value) => onChange("contactName", value)}
          />
          <TextField
            id={`${idPrefix}-contact-position`}
            label="Position"
            required
            autoComplete="organization-title"
            maxLength={160}
            value={profile.contactPosition}
            error={errors.contactPosition}
            onChange={(value) => onChange("contactPosition", value)}
          />
          <TextField
            id={`${idPrefix}-contact-email`}
            label="Email (used for login after approval)"
            required
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            placeholder="name@company.com"
            value={profile.contactEmail}
            error={errors.contactEmail}
            onChange={(value) => onChange("contactEmail", value)}
          />
          <TextField
            id={`${idPrefix}-mobile-number`}
            label="Mobile number"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={30}
            placeholder="+60 12 345 6789"
            value={profile.mobileNumber}
            error={errors.mobileNumber}
            onChange={(value) => onChange("mobileNumber", value)}
          />
          <TextField
            id={`${idPrefix}-chat-id`}
            label="WhatsApp / WeChat ID (optional)"
            maxLength={120}
            value={profile.chatId}
            error={errors.chatId}
            onChange={(value) => onChange("chatId", value)}
          />
        </div>
        <ChoiceGroup
          label="Preferred language"
          required
          options={companyProfileOptionGroups.preferredLanguages}
          values={profile.preferredLanguages}
          error={errors.preferredLanguages}
          onToggle={(value) => toggleList("preferredLanguages", value)}
        />
      </QuestionnaireSection>

      <QuestionnaireSection title="3. Industry / sector">
        <Field>
          <FieldLabel>
            Select all applicable <RequiredMark />
          </FieldLabel>
          <IndustrySectorMultiCombobox
            id={`${idPrefix}-industries`}
            values={profile.industries}
            onToggle={(value) => toggleList("industries", value)}
          />
          <FieldError message={errors.industries} />
        </Field>
        <TextField
          id={`${idPrefix}-industry-other`}
          label="Other industry (optional)"
          maxLength={160}
          value={profile.industryOther}
          error={errors.industryOther}
          onChange={(value) => onChange("industryOther", value)}
        />
      </QuestionnaireSection>

      <QuestionnaireSection title="4. Company profile">
        <TextareaField
          id={`${idPrefix}-introduction`}
          label={`Brief company introduction (${companyIntroductionWordLimits.min}–${companyIntroductionWordLimits.max} words)`}
          required
          maxLength={3000}
          description={`${introductionWords} words · required range ${companyIntroductionWordLimits.min}–${companyIntroductionWordLimits.max}`}
          value={profile.introduction}
          error={errors.introduction}
          onChange={(value) => onChange("introduction", value)}
        />
        <TextareaField
          id={`${idPrefix}-products-services`}
          label="Key products / services"
          required
          maxLength={3000}
          value={profile.productsServices}
          error={errors.productsServices}
          onChange={(value) => onChange("productsServices", value)}
        />
        <ChoiceGroup
          label="Certifications (optional)"
          options={companyProfileOptionGroups.certifications}
          values={profile.certifications}
          error={errors.certifications}
          onToggle={(value) => toggleList("certifications", value)}
        />
        <TextField
          id={`${idPrefix}-certification-other`}
          label="Other certification (optional)"
          maxLength={160}
          value={profile.certificationOther}
          error={errors.certificationOther}
          onChange={(value) => onChange("certificationOther", value)}
        />
      </QuestionnaireSection>

      <QuestionnaireSection title="5. What does your company offer?">
        <ChoiceGroup
          label="Select all that apply"
          required
          options={companyProfileOptionGroups.offers}
          values={profile.offers}
          error={errors.offers}
          onToggle={(value) => toggleList("offers", value)}
        />
        <TextField
          id={`${idPrefix}-offer-other`}
          label="Other offer (optional)"
          maxLength={160}
          value={profile.offerOther}
          error={errors.offerOther}
          onChange={(value) => onChange("offerOther", value)}
        />
      </QuestionnaireSection>

      <QuestionnaireSection title="6. What are you looking for?">
        <ChoiceGroup
          label="Select all that apply"
          required
          options={companyProfileOptionGroups.lookingFor}
          values={profile.lookingFor}
          error={errors.lookingFor}
          onToggle={(value) => toggleList("lookingFor", value)}
        />
        <TextField
          id={`${idPrefix}-looking-for-other`}
          label="Other requirement (optional)"
          maxLength={160}
          value={profile.lookingForOther}
          error={errors.lookingForOther}
          onChange={(value) => onChange("lookingForOther", value)}
        />
      </QuestionnaireSection>

      <QuestionnaireSection title="7. Matchmaking preferences">
        <ChoiceGroup
          label="Preferred partner type"
          required
          options={companyProfileOptionGroups.preferredPartnerTypes}
          values={profile.preferredPartnerTypes}
          error={errors.preferredPartnerTypes}
          onToggle={(value) => toggleList("preferredPartnerTypes", value)}
        />
        <TextField
          id={`${idPrefix}-preferred-partner-other`}
          label="Other preferred partner type (optional)"
          maxLength={160}
          value={profile.preferredPartnerOther}
          error={errors.preferredPartnerOther}
          onChange={(value) => onChange("preferredPartnerOther", value)}
        />
        <ChoiceGroup
          label="Expected outcome"
          required
          options={companyProfileOptionGroups.expectedOutcomes}
          values={profile.expectedOutcomes}
          error={errors.expectedOutcomes}
          onToggle={(value) => toggleList("expectedOutcomes", value)}
        />
      </QuestionnaireSection>

      <QuestionnaireSection title="8. Specific business needs">
        <TextareaField
          id={`${idPrefix}-ideal-partner`}
          label="Describe your ideal business partner"
          required
          maxLength={2500}
          value={profile.idealPartner}
          error={errors.idealPartner}
          onChange={(value) => onChange("idealPartner", value)}
        />
        <TextareaField
          id={`${idPrefix}-opportunity`}
          label="Describe the opportunity you wish to discuss"
          required
          maxLength={2500}
          value={profile.opportunity}
          error={errors.opportunity}
          onChange={(value) => onChange("opportunity", value)}
        />
      </QuestionnaireSection>

      <QuestionnaireSection title="9. Export / international experience">
        <SelectField
          id={`${idPrefix}-exports`}
          label="Do you currently export internationally?"
          required
          options={companyProfileOptionGroups.exportsInternationally}
          value={profile.exportsInternationally}
          error={errors.exportsInternationally}
          onChange={(value) => onChange("exportsInternationally", value)}
        />
        <TextField
          id={`${idPrefix}-export-markets`}
          label="If yes, list markets"
          required={profile.exportsInternationally === "Yes"}
          maxLength={1000}
          value={profile.exportMarkets}
          error={errors.exportMarkets}
          onChange={(value) => onChange("exportMarkets", value)}
        />
      </QuestionnaireSection>

      <QuestionnaireSection title="10. Meeting arrangement">
        <SelectField
          id={`${idPrefix}-meeting-format`}
          label="Meeting format"
          required
          options={companyProfileOptionGroups.meetingFormat}
          value={profile.meetingFormat}
          error={errors.meetingFormat}
          onChange={(value) => onChange("meetingFormat", value)}
        />
        <TextareaField
          id={`${idPrefix}-meeting-dates`}
          label="Available meeting dates"
          required
          maxLength={1000}
          placeholder="List dates, time windows, and time zone."
          value={profile.availableMeetingDates}
          error={errors.availableMeetingDates}
          onChange={(value) => onChange("availableMeetingDates", value)}
        />
        <SelectField
          id={`${idPrefix}-max-meetings`}
          label="Maximum number of meetings requested"
          required
          options={companyProfileOptionGroups.maxMeetings}
          value={profile.maxMeetings}
          error={errors.maxMeetings}
          onChange={(value) => onChange("maxMeetings", value)}
        />
      </QuestionnaireSection>

      <QuestionnaireSection title="11. Supporting documents">
        <ChoiceGroup
          label="Please prepare"
          options={companyProfileOptionGroups.supportingDocuments}
          values={profile.supportingDocuments}
          error={errors.supportingDocuments}
          onToggle={(value) => toggleList("supportingDocuments", value)}
        />
        {publicApplication ? (
          <p
            className="rounded-lg border border-dashed bg-muted/25 p-4 text-sm text-muted-foreground"
            data-testid="public-document-upload-deferred"
          >
            No files are required now. Approved Vendors can upload PDFs to their
            private document library after setting up their account.
          </p>
        ) : (
          documentLibrary
        )}
      </QuestionnaireSection>

      <QuestionnaireSection title="12. Consent">
        <label className="flex items-start gap-3 rounded-lg border p-4 text-sm leading-6">
          <Checkbox
            checked={profile.consent}
            aria-invalid={Boolean(errors.consent)}
            onCheckedChange={(checked) => onChange("consent", checked === true)}
          />
          <span>
            I agree that my company information may be shared with relevant
            participants and organizers for B2B matchmaking purposes.{" "}
            <RequiredMark />
          </span>
        </label>
        <FieldError message={errors.consent} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            id={`${idPrefix}-consent-name`}
            label="Name"
            required
            autoComplete="name"
            maxLength={160}
            value={profile.consentName}
            error={errors.consentName}
            onChange={(value) => onChange("consentName", value)}
          />
          <TextField
            id={`${idPrefix}-consent-date`}
            label="Date"
            type="date"
            required
            max={getMalaysiaToday()}
            value={profile.consentDate}
            error={errors.consentDate}
            onChange={(value) => onChange("consentDate", value)}
          />
        </div>
      </QuestionnaireSection>
    </div>
  )
}

function QuestionnaireSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden>
      *
    </span>
  )
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="text-xs font-medium text-destructive" role="alert">
      {message}
    </p>
  ) : null
}

function TextField({
  id,
  label,
  value,
  error,
  onChange,
  required = false,
  ...inputProps
}: {
  id: string
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
  required?: boolean
} & Omit<
  React.ComponentProps<typeof Input>,
  "id" | "value" | "onChange" | "required"
>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label} {required ? <RequiredMark /> : null}
      </FieldLabel>
      <Input
        {...inputProps}
        id={id}
        value={value}
        required={required}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError message={error} />
    </Field>
  )
}

function TextareaField({
  id,
  label,
  value,
  error,
  description,
  onChange,
  required = false,
  ...textareaProps
}: {
  id: string
  label: string
  value: string
  error?: string
  description?: string
  onChange: (value: string) => void
  required?: boolean
} & Omit<
  React.ComponentProps<typeof Textarea>,
  "id" | "value" | "onChange" | "required"
>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label} {required ? <RequiredMark /> : null}
      </FieldLabel>
      <Textarea
        {...textareaProps}
        id={id}
        value={value}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn("min-h-28", textareaProps.className)}
        onChange={(event) => onChange(event.target.value)}
      />
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      <FieldError message={error} />
    </Field>
  )
}

function SelectField({
  id,
  label,
  options,
  value,
  error,
  onChange,
  required = false,
}: {
  id: string
  label: string
  options: readonly string[]
  value: string
  error?: string
  onChange: (value: string) => void
  required?: boolean
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label} {required ? <RequiredMark /> : null}
      </FieldLabel>
      <select
        id={id}
        value={value}
        required={required}
        aria-invalid={Boolean(error)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive"
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </Field>
  )
}

function ChoiceGroup({
  label,
  options,
  values,
  error,
  onToggle,
  required = false,
}: {
  label: string
  options: readonly string[]
  values: string[]
  error?: string
  onToggle: (value: string) => void
  required?: boolean
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">
        {label} {required ? <RequiredMark /> : null}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label
            key={option}
            className="flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <Checkbox
              checked={values.includes(option)}
              onCheckedChange={() => onToggle(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <FieldError message={error} />
    </fieldset>
  )
}
