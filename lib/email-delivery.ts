export const emailSenderTypes = [
  "supabase_auth",
  "plexus_system",
  "superadmin",
  "admin",
  "vendor",
] as const

export type EmailSenderType = (typeof emailSenderTypes)[number]

export const emailDeliveryStatuses = [
  "requested",
  "queued",
  "scheduled",
  "sent",
  "delivered",
  "delivery_delayed",
  "bounced",
  "complained",
  "suppressed",
  "failed",
  "canceled",
] as const

export type EmailDeliveryStatus = (typeof emailDeliveryStatuses)[number]

export const emailTriggerCatalog = [
  {
    key: "password_reset",
    label: "Forgot password",
    sender: "Supabase Auth",
    recipient: "Entered account",
    provider: "Supabase Auth → Resend SMTP",
    behavior: "Secure recovery link; tracked as requested by Plexus.",
  },
  {
    key: "admin_recovery",
    label: "Superadmin sends Admin recovery",
    sender: "Superadmin",
    recipient: "Selected Admin",
    provider: "Supabase Auth → Resend SMTP",
    behavior: "Secure recovery link; actor and tenant are recorded.",
  },
  {
    key: "vendor_setup",
    label: "Approve Vendor application",
    sender: "Admin",
    recipient: "Applicant Vendor",
    provider: "Supabase Auth → Resend SMTP",
    behavior: "First-time password setup link after account provisioning.",
  },
  {
    key: "vendor_setup_resend",
    label: "Resend Vendor setup",
    sender: "Admin",
    recipient: "Approved Vendor",
    provider: "Supabase Auth → Resend SMTP",
    behavior: "Creates a new secure setup link and a new request record.",
  },
  {
    key: "vendor_application_received",
    label: "Vendor application submitted",
    sender: "Plexus system",
    recipient: "Applicant Vendor and tenant Admins",
    provider: "Resend API",
    behavior: "Submission confirmation and Admin review alert.",
  },
  {
    key: "vendor_application_rejected",
    label: "Vendor application rejected",
    sender: "Admin",
    recipient: "Applicant Vendor",
    provider: "Resend API",
    behavior: "Decision notice without exposing internal review details.",
  },
  {
    key: "account_setup",
    label: "Direct account creation",
    sender: "Superadmin or Admin",
    recipient: "New Admin or Vendor",
    provider: "Supabase Auth → Resend SMTP",
    behavior:
      "Secure password setup link; temporary password is never emailed.",
  },
  {
    key: "password_changed",
    label: "Password changed",
    sender: "Plexus system",
    recipient: "Account owner",
    provider: "Resend API",
    behavior: "Security confirmation with support guidance.",
  },
  {
    key: "login_email_changed",
    label: "Vendor login email changed",
    sender: "Admin",
    recipient: "Previous and new login addresses",
    provider: "Resend API",
    behavior: "Security notice to both addresses after the direct Auth update.",
  },
  {
    key: "account_status_changed",
    label: "Suspend or reactivate account",
    sender: "Superadmin or Admin",
    recipient: "Account owner",
    provider: "Resend API",
    behavior: "Account-access status notice.",
  },
  {
    key: "vendor_transferred",
    label: "Transfer Vendor",
    sender: "Superadmin",
    recipient: "Vendor accounts and affected Admins",
    provider: "Resend API",
    behavior: "Tenant ownership change notice.",
  },
  {
    key: "match_activity",
    label: "Match request or acceptance",
    sender: "Admin or Vendor",
    recipient: "Matched Vendors",
    provider: "Resend API",
    behavior: "Counterparty action update.",
  },
  {
    key: "meeting_activity",
    label: "Meeting proposal, approval, or update",
    sender: "Admin or Vendor",
    recipient: "Meeting participants",
    provider: "Resend API",
    behavior: "Proposal and schedule update.",
  },
  {
    key: "mou_activity",
    label: "MOU signing",
    sender: "Vendor",
    recipient: "Counterparty and tenant Admins",
    provider: "Resend API",
    behavior: "Signature progress update; no signature evidence is emailed.",
  },
  {
    key: "operations_activity",
    label: "Itinerary, attendance, check-in, or resource",
    sender: "Admin or Vendor",
    recipient: "Relevant tenant participants",
    provider: "Resend API",
    behavior: "Operational update based on the affected audience.",
  },
  {
    key: "information_blast",
    label: "Information blast: Email or Both",
    sender: "Admin",
    recipient: "Selected tenant audience",
    provider: "Resend API",
    behavior: "One delivery record per recipient.",
  },
  {
    key: "scheduled_reminder",
    label: "Application, meeting, or MOU reminder",
    sender: "Plexus system",
    recipient: "Responsible participants",
    provider: "Resend API",
    behavior: "Scheduled reminder with duplicate-send protection.",
  },
] as const

export type EmailTriggerKey = (typeof emailTriggerCatalog)[number]["key"]

export type EmailDelivery = {
  id: string
  admin_id: string | null
  sender_type: EmailSenderType
  sender_user_id: string | null
  sender_name: string
  from_address: string
  recipient_email: string
  recipient_name: string
  recipient_role: "superadmin" | "admin" | "vendor" | "external" | "unknown"
  trigger_key: string
  subject: string
  provider: "resend" | "supabase_auth"
  provider_message_id: string | null
  status: EmailDeliveryStatus
  status_detail: string
  source_table: string | null
  source_id: string | null
  requested_at: string
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  failed_at: string | null
  last_event_at: string | null
  created_at: string
  updated_at: string
}

export function emailSenderLabel(sender: EmailSenderType) {
  const labels: Record<EmailSenderType, string> = {
    supabase_auth: "Supabase Auth",
    plexus_system: "Plexus system",
    superadmin: "Superadmin",
    admin: "Admin",
    vendor: "Vendor",
  }

  return labels[sender]
}

export function emailStatusLabel(status: EmailDeliveryStatus) {
  return status
    .replaceAll("_", " ")
    .replace(/^\w/, (letter) => letter.toUpperCase())
}
