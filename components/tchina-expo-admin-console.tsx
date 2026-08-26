"use client"

import Link from "next/link"
import { useMemo, useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  deleteTChinaRegistrationAction,
  rejectTChinaRegistrationAction,
  saveTChinaEventAction,
} from "@/app/actions/tchina-expo"
import type { Locale } from "@/lib/i18n"
import type { TChinaEvent, TChinaRegistration } from "@/lib/tchina-expo"

type Props = {
  locale: Locale
  event: TChinaEvent | null
  registrations: TChinaRegistration[]
}

const fieldClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"

export function TChinaExpoSuperadminPanel({
  locale,
  event,
  registrations,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [registrationOpen, setRegistrationOpen] = useState(
    event?.registration_open ?? false
  )
  const publicPath = `/${locale === "zh" ? "zh" : "en"}/tchina-expo`
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return registrations.filter((registration) => {
      const matchesStatus = status === "all" || registration.status === status
      const matchesQuery =
        !query ||
        `${registration.full_name} ${registration.normalized_email} ${registration.reference_code} ${registration.country_region}`
          .toLowerCase()
          .includes(query)
      return matchesStatus && matchesQuery
    })
  }, [registrations, search, status])

  function saveEvent(eventObject: FormEvent<HTMLFormElement>) {
    eventObject.preventDefault()
    const data = new FormData(eventObject.currentTarget)
    startTransition(async () => {
      const result = await saveTChinaEventAction({
        locale,
        title: data.get("title"),
        venueName: data.get("venueName"),
        venueAddress: data.get("venueAddress"),
        organizerName: data.get("organizerName"),
        supportEmail: data.get("supportEmail"),
        registrationOpen,
      })
      if (!result.ok) {
        toast.error(result.error ?? "Event setup could not be saved.")
        return
      }
      toast.success(
        registrationOpen ? "Registration is open." : "Event setup saved."
      )
      router.refresh()
    })
  }

  function runRegistrationAction(
    action: typeof rejectTChinaRegistrationAction,
    registrationId: string,
    success: string
  ) {
    startTransition(async () => {
      const result = await action({ locale, registrationId })
      if (!result.ok) {
        toast.error(result.error ?? "Action failed.")
        return
      }
      toast.success(success)
      router.refresh()
    })
  }

  async function copyPublicLink() {
    await navigator.clipboard.writeText(
      `${window.location.origin}${publicPath}`
    )
    toast.success("Public registration link copied.")
  }

  return (
    <div className="min-w-0 space-y-5">
      <header className="rounded-xl border bg-card p-5 sm:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            TChina Expo registration
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Configure the single Plexus-owned Guangzhou questionnaire and review
            every attendee. Tenant Admins have no access to this campaign or its
            registrations.
          </p>
        </div>
      </header>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Public registration link</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              English and Simplified Chinese use the same questionnaire and
              registration records.
            </p>
          </div>
          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${event?.registration_open ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
          >
            {event?.registration_open ? "Open" : "Not published"}
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-muted px-3 py-3 text-xs">
            {publicPath}
          </code>
          <button
            type="button"
            onClick={copyPublicLink}
            className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Copy link
          </button>
          {event?.registration_open ? (
            <Link
              target="_blank"
              href={publicPath}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold hover:bg-muted"
            >
              Open page
            </Link>
          ) : null}
        </div>
      </section>

      <form
        onSubmit={saveEvent}
        className="rounded-xl border bg-card p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Event setup</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The venue, organizer and support email are required before
              registration can open.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={registrationOpen}
              onChange={(e) => setRegistrationOpen(e.target.checked)}
              className="size-4 accent-primary"
            />
            Registration open
          </label>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <AdminField label="Event title">
            <input
              name="title"
              className={fieldClass}
              defaultValue={event?.title ?? "TChina Expo 2026"}
              required
            />
          </AdminField>
          <AdminField label="City">
            <input className={fieldClass} value="Guangzhou" disabled />
          </AdminField>
          <AdminField label="Venue name">
            <input
              name="venueName"
              className={fieldClass}
              defaultValue={event?.venue_name ?? ""}
            />
          </AdminField>
          <AdminField label="Venue address">
            <input
              name="venueAddress"
              className={fieldClass}
              defaultValue={event?.venue_address ?? ""}
            />
          </AdminField>
          <AdminField label="Organizer">
            <input
              name="organizerName"
              className={fieldClass}
              defaultValue={event?.organizer_name ?? ""}
            />
          </AdminField>
          <AdminField label="Support email">
            <input
              name="supportEmail"
              type="email"
              className={fieldClass}
              defaultValue={event?.support_email ?? ""}
            />
          </AdminField>
          <AdminField label="Dates">
            <input
              className={fieldClass}
              value="31 August–4 September 2026"
              disabled
            />
          </AdminField>
          <AdminField label="Timezone">
            <input className={fieldClass} value="Asia/Shanghai" disabled />
          </AdminField>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            disabled={pending}
            className="min-h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save event setup"}
          </button>
        </div>
      </form>

      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Registrations</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {registrations.length} total ·{" "}
              {registrations.filter((item) => item.status === "pending").length}{" "}
              pending review
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[240px_150px]">
            <label className="text-xs font-medium text-muted-foreground">
              Search
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={fieldClass}
                placeholder="Name, email or reference"
              />
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={fieldClass}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {filtered.length ? (
            filtered.map((registration) => (
              <details
                key={registration.id}
                className="group rounded-xl border bg-background open:border-primary/40"
              >
                <summary className="grid cursor-pointer list-none gap-3 p-4 sm:grid-cols-[1.2fr_1.4fr_.7fr_.7fr] sm:items-center">
                  <div>
                    <p className="font-semibold">{registration.full_name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {registration.reference_code}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {registration.normalized_email}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {registration.country_region}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-xs font-semibold capitalize">
                    {registration.attendee_type.replaceAll("_", " ")}
                  </span>
                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(registration.status)}`}
                  >
                    {registration.status}
                  </span>
                </summary>
                <div className="border-t p-4 sm:p-5">
                  <div className="grid gap-5 text-sm sm:grid-cols-2">
                    <Info label="Mobile" value={registration.mobile_number} />
                    <Info
                      label="WhatsApp / WeChat"
                      value={
                        registration.chat_platform === "none"
                          ? "Not supplied"
                          : `${registration.chat_platform}: ${registration.chat_id}`
                      }
                    />
                    <Info
                      label="Attendance dates"
                      value={registration.attendance_dates.join(", ")}
                    />
                    <Info
                      label="Preferred language"
                      value={registration.preferred_language.toUpperCase()}
                    />
                  </div>
                  <h3 className="mt-6 border-b pb-2 text-sm font-semibold">
                    Questionnaire answers
                  </h3>
                  <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                    {Object.entries(registration.answers).map(
                      ([key, value]) => (
                        <Info
                          key={key}
                          label={humanize(key)}
                          value={
                            Array.isArray(value)
                              ? value.join(", ")
                              : typeof value === "boolean"
                                ? value
                                  ? "Yes"
                                  : "No"
                                : String(value || "—")
                          }
                        />
                      )
                    )}
                  </dl>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <p className="max-w-xl text-xs leading-5 text-muted-foreground">
                      Approval and invitation delivery remain unavailable while
                      the email integration is intentionally deferred. Rejection
                      and confirmed deletion are active.
                    </p>
                    <div className="flex gap-2">
                      {registration.status === "pending" ? (
                        <button
                          disabled={pending}
                          type="button"
                          onClick={() =>
                            runRegistrationAction(
                              rejectTChinaRegistrationAction,
                              registration.id,
                              "Registration rejected."
                            )
                          }
                          className="min-h-10 rounded-lg border border-red-300 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      ) : null}
                      <button
                        disabled={pending}
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete ${registration.reference_code}? Linked accounts and audit/email ledgers will not be deleted.`
                            )
                          ) {
                            runRegistrationAction(
                              deleteTChinaRegistrationAction,
                              registration.id,
                              "Registration deleted."
                            )
                          }
                        }}
                        className="min-h-10 rounded-lg border px-3 text-xs font-semibold hover:bg-muted disabled:opacity-50"
                      >
                        Delete…
                      </button>
                    </div>
                  </div>
                </div>
              </details>
            ))
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No registrations match this view.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function AdminField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      {children}
    </label>
  )
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm break-words">{value}</dd>
    </div>
  )
}
function humanize(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (letter) => letter.toUpperCase())
}
function statusClass(status: string) {
  if (status === "approved") return "bg-emerald-100 text-emerald-800"
  if (status === "rejected") return "bg-red-100 text-red-800"
  return "bg-amber-100 text-amber-800"
}
