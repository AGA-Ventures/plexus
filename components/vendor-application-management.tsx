"use client"

import { useMemo, useState, useTransition } from "react"
import {
  CheckmarkCircle02Icon,
  Copy01Icon,
  Loading03Icon,
  Mail01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  approveVendorApplicationAction,
  rejectVendorApplicationAction,
  resendVendorSetupEmailAction,
  type ManagementActionResult,
} from "@/app/actions/management"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Locale } from "@/lib/i18n"
import type { CompanyRegistrationProfile } from "@/lib/local-db"
import type { VendorApplication } from "@/lib/vendor-applications"

function formatDate(value: string | null) {
  if (!value) return "—"

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function statusVariant(status: VendorApplication["status"]) {
  if (status === "approved") return "secondary" as const
  if (status === "rejected") return "destructive" as const
  return "outline" as const
}

function displayProfileValue(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "string") return value || "—"
  return "—"
}

const profileLabels: Record<keyof CompanyRegistrationProfile, string> = {
  companyNameEn: "Company name (English)",
  companyNameCn: "Company name (Chinese)",
  countryRegion: "Country / Region",
  countryOther: "Other country / region",
  yearEstablished: "Year established",
  registrationNumber: "Company registration number",
  website: "Website",
  address: "Company address",
  employeeRange: "Number of employees",
  annualRevenueRange: "Annual revenue range",
  contactName: "Contact name",
  contactPosition: "Contact position",
  contactEmail: "Contact email",
  mobileNumber: "Mobile number",
  chatId: "WhatsApp / WeChat ID",
  preferredLanguages: "Preferred languages",
  industries: "Industries",
  industryOther: "Other industry",
  introduction: "Company introduction",
  productsServices: "Key products / services",
  certifications: "Certifications",
  certificationOther: "Other certification",
  offers: "Company offers",
  offerOther: "Other offer",
  lookingFor: "Looking for",
  lookingForOther: "Other requirement",
  preferredPartnerTypes: "Preferred partner types",
  preferredPartnerOther: "Other preferred partner type",
  expectedOutcomes: "Expected outcomes",
  idealPartner: "Ideal business partner",
  opportunity: "Opportunity to discuss",
  exportsInternationally: "Exports internationally",
  exportMarkets: "Export markets",
  meetingFormat: "Meeting format",
  availableMeetingDates: "Available meeting dates",
  maxMeetings: "Maximum meetings",
  supportingDocuments: "Supporting documents checklist",
  consent: "Consent",
  consentName: "Consent name",
  consentDate: "Consent date",
}

export function VendorSignupLinks({
  locale,
  tenantSlug,
}: {
  locale: Locale
  tenantSlug: string
}) {
  const links = [
    {
      type: "Delegation",
      path: `/${locale}/vendor-signup/${tenantSlug}/delegation`,
    },
    {
      type: "Partner",
      path: `/${locale}/vendor-signup/${tenantSlug}/partner`,
    },
  ]

  async function copyLink(path: string, type: string) {
    const url = new URL(path, window.location.origin).toString()
    await navigator.clipboard.writeText(url)
    toast.success(`${type} signup link copied.`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signup links</CardTitle>
        <CardDescription>
          Each tenant-branded link fixes the Vendor subtype. Share the matching
          URL with applicants.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {links.map((link) => (
          <div
            key={link.type}
            className="flex min-w-0 items-center gap-3 rounded-lg border p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{link.type}</p>
              <p className="truncate text-xs text-muted-foreground">
                {link.path}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void copyLink(link.path, link.type)}
            >
              <HugeiconsIcon icon={Copy01Icon} strokeWidth={1.8} />
              Copy
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function VendorApplicationsPanel({
  locale,
  applications,
  approvalEnabled,
}: {
  locale: Locale
  applications: VendorApplication[]
  approvalEnabled: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState<string>()
  const selected = useMemo(
    () => applications.find((application) => application.id === selectedId),
    [applications, selectedId]
  )

  function runAction(
    action: () => Promise<ManagementActionResult>,
    successMessage: string
  ) {
    startTransition(async () => {
      const result = await action()

      if (!result.ok) {
        toast.error(result.error ?? "Action failed.")
        return
      }

      if (result.warning) {
        toast.warning(result.warning)
      } else {
        toast.success(successMessage)
      }

      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor applications</CardTitle>
        <CardDescription>
          Review the submitted company profile before creating a Vendor and
          login account.
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="secondary">
            Pending{" "}
            {
              applications.filter(
                (application) => application.status === "pending"
              ).length
            }
          </Badge>
          <Badge variant="outline">
            History{" "}
            {
              applications.filter(
                (application) => application.status !== "pending"
              ).length
            }
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {applications.length ? (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Subtype</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">
                        {application.company_name}
                      </TableCell>
                      <TableCell>
                        <p>{application.contact_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {application.normalized_email}
                        </p>
                      </TableCell>
                      <TableCell className="capitalize">
                        {application.vendor_type}
                      </TableCell>
                      <TableCell>
                        {formatDate(application.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant(application.status)}
                          className="capitalize"
                        >
                          {application.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ApplicationActions
                          locale={locale}
                          application={application}
                          pending={pending}
                          approvalEnabled={approvalEnabled}
                          onView={() => setSelectedId(application.id)}
                          runAction={runAction}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-3 md:hidden">
              {applications.map((application) => (
                <div key={application.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{application.company_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {application.contact_name} ·{" "}
                        {application.normalized_email}
                      </p>
                    </div>
                    <Badge
                      variant={statusVariant(application.status)}
                      className="capitalize"
                    >
                      {application.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground capitalize">
                    {application.vendor_type} ·{" "}
                    {formatDate(application.created_at)}
                  </p>
                  <div className="mt-3">
                    <ApplicationActions
                      locale={locale}
                      application={application}
                      pending={pending}
                      approvalEnabled={approvalEnabled}
                      onView={() => setSelectedId(application.id)}
                      runAction={runAction}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="font-medium">No Vendor applications yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New submissions from either signup link will appear here.
            </p>
          </div>
        )}
      </CardContent>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(undefined)
        }}
      >
        {selected ? (
          <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selected.company_name}</DialogTitle>
              <DialogDescription>
                Complete submitted profile · {selected.profile_complete}% ·{" "}
                <span className="capitalize">{selected.vendor_type}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                Object.keys(profileLabels) as Array<
                  keyof CompanyRegistrationProfile
                >
              ).map((field) => (
                <div
                  key={field}
                  className={
                    [
                      "introduction",
                      "productsServices",
                      "idealPartner",
                      "opportunity",
                      "address",
                      "availableMeetingDates",
                    ].includes(field)
                      ? "rounded-lg border p-3 sm:col-span-2"
                      : "rounded-lg border p-3"
                  }
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {profileLabels[field]}
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {displayProfileValue(selected.profile_data[field])}
                  </p>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedId(undefined)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </Card>
  )
}

function ApplicationActions({
  locale,
  application,
  pending,
  approvalEnabled,
  onView,
  runAction,
}: {
  locale: Locale
  application: VendorApplication
  pending: boolean
  approvalEnabled: boolean
  onView: () => void
  runAction: (
    action: () => Promise<ManagementActionResult>,
    successMessage: string
  ) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={onView}>
        <HugeiconsIcon icon={ViewIcon} strokeWidth={1.8} />
        View
      </Button>
      {application.status === "pending" ? (
        <>
          <Button
            type="button"
            disabled={pending || !approvalEnabled}
            onClick={() => {
              if (
                window.confirm(
                  `Approve ${application.company_name} and create its Vendor login?`
                )
              ) {
                runAction(
                  () =>
                    approveVendorApplicationAction({
                      locale,
                      applicationId: application.id,
                    }),
                  "Vendor approved and setup email sent."
                )
              }
            }}
          >
            <HugeiconsIcon
              icon={pending ? Loading03Icon : CheckmarkCircle02Icon}
              className={pending ? "animate-spin" : undefined}
              strokeWidth={1.8}
            />
            Approve
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => {
              if (
                window.confirm(
                  `Reject ${application.company_name}? No account will be created.`
                )
              ) {
                runAction(
                  () =>
                    rejectVendorApplicationAction({
                      locale,
                      applicationId: application.id,
                    }),
                  "Vendor application rejected."
                )
              }
            }}
          >
            Reject
          </Button>
        </>
      ) : null}
      {application.status === "approved" ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            runAction(
              () =>
                resendVendorSetupEmailAction({
                  locale,
                  applicationId: application.id,
                }),
              "Setup email sent again."
            )
          }
        >
          <HugeiconsIcon icon={Mail01Icon} strokeWidth={1.8} />
          Resend setup email
        </Button>
      ) : null}
    </div>
  )
}
