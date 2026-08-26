"use client"

import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
  useTransition,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AddIcon,
  AnalyticsUpIcon,
  Alert02Icon,
  Audit01Icon,
  Building01Icon,
  Calendar03Icon,
  Logout03Icon,
  Mail01Icon,
  ResetPasswordIcon,
  Settings01Icon,
  ShieldUserIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { logoutAction } from "@/app/actions/auth"
import {
  createAdminAccountAction,
  createVendorAccountAction,
  retryMeetingCreationAction,
  sendAdminPasswordResetAction,
  setAccountActiveAction,
  setTenantStatusAction,
  setVendorStatusAction,
  syncAccountClaimsAction,
  transferVendorAction,
  type ManagementActionResult,
} from "@/app/actions/management"
import { isActiveAdminRecoveryAccount } from "@/lib/admin-password-recovery"
import type { AuthenticatedIdentity } from "@/lib/authorization"
import {
  emailSenderLabel,
  emailStatusLabel,
  emailTriggerCatalog,
  type EmailDelivery,
  type EmailDeliveryStatus,
} from "@/lib/email-delivery"
import type { Locale } from "@/lib/i18n"
import { hasMatchingPasswordConfirmation } from "@/lib/password-confirmation"
import type {
  AdminTenant,
  AuditEvent,
  ManagedAccount,
  ManagedVendor,
  MeetingCreationIncident,
  PlatformSetting,
  TenantOperationalCount,
  TenantStatus,
  VendorStatus,
} from "@/lib/management-data"
import { IndustrySectorCombobox } from "@/components/industry-sector-combobox"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TenantProfileDialog } from "@/components/tenant-profile-dialog"
import { TChinaExpoSuperadminPanel } from "@/components/tchina-expo-admin-console"
import { VendorDirectoryDialog } from "@/components/vendor-directory-dialog"
import { PlatformSettingEditor } from "@/components/platform-setting-editor"
import { WorkspaceNavigationShell } from "@/components/workspace-navigation-shell"
import type { TChinaEvent, TChinaRegistration } from "@/lib/tchina-expo"

type Props = {
  locale: Locale
  session: AuthenticatedIdentity
  provisioningConfigured: boolean
  tenants: AdminTenant[]
  vendors: ManagedVendor[]
  accounts: ManagedAccount[]
  auditEvents: AuditEvent[]
  meetingCreationIncidents: MeetingCreationIncident[]
  emailDeliveries: EmailDelivery[]
  emailProviderReadiness: {
    resendApiConfigured: boolean
    resendFromConfigured: boolean
    resendWebhookConfigured: boolean
  }
  operations: {
    matches: TenantOperationalCount[]
    meetings: TenantOperationalCount[]
    deals: TenantOperationalCount[]
  }
  platformSettings: PlatformSetting[]
  tchinaEvent: TChinaEvent | null
  tchinaRegistrations: TChinaRegistration[]
}

const fieldClass =
  "h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"

const superadminNavItems = [
  { value: "admins", label: "Admin tenants", icon: Building01Icon },
  { value: "vendors", label: "Vendors", icon: UserGroupIcon },
  { value: "accounts", label: "Accounts", icon: ShieldUserIcon },
  { value: "reporting", label: "Reporting", icon: AnalyticsUpIcon },
  { value: "incidents", label: "Critical incidents", icon: Alert02Icon },
  { value: "tchina", label: "TChina Expo", icon: Calendar03Icon },
  { value: "email", label: "Email sending", icon: Mail01Icon },
  { value: "settings", label: "Platform settings", icon: Settings01Icon },
  { value: "audit", label: "Audit events", icon: Audit01Icon },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function labelStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/^\w/, (letter) => letter.toUpperCase())
}

function statusBadge(status: string) {
  return (
    <Badge
      variant={
        ["active", "configured"].includes(status)
          ? "secondary"
          : status === "archived"
            ? "outline"
            : "destructive"
      }
    >
      {labelStatus(status)}
    </Badge>
  )
}

function emailStatusBadge(status: EmailDeliveryStatus) {
  const failureStatuses: EmailDeliveryStatus[] = [
    "bounced",
    "complained",
    "suppressed",
    "failed",
  ]

  return (
    <Badge
      variant={
        failureStatuses.includes(status)
          ? "destructive"
          : status === "delivered"
            ? "secondary"
            : "outline"
      }
    >
      {emailStatusLabel(status)}
    </Badge>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string
  value: number
  detail: string
  icon: typeof Building01Icon
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-1 text-2xl">{value}</CardTitle>
        </div>
        <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <HugeiconsIcon icon={icon} strokeWidth={1.7} />
        </div>
      </CardHeader>
      <CardFooter className="text-xs text-muted-foreground">
        {detail}
      </CardFooter>
    </Card>
  )
}

function NativeSelect({ children, ...props }: React.ComponentProps<"select">) {
  return (
    <select className={fieldClass} {...props}>
      {children}
    </select>
  )
}

function CreateAdminDialog({
  disabled,
  pending,
  onSubmit,
}: {
  disabled: boolean
  pending: boolean
  onSubmit: (form: FormData) => void
}) {
  const [open, setOpen] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState("")
  const [confirmTemporaryPassword, setConfirmTemporaryPassword] = useState("")
  const [confirmTouched, setConfirmTouched] = useState(false)
  const passwordsMatch = hasMatchingPasswordConfirmation(
    temporaryPassword,
    confirmTemporaryPassword
  )
  const showPasswordMismatch =
    confirmTouched &&
    confirmTemporaryPassword.length > 0 &&
    temporaryPassword !== confirmTemporaryPassword

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)

    if (
      form.get("temporaryPassword") !== form.get("confirmTemporaryPassword")
    ) {
      setConfirmTouched(true)
      return
    }

    onSubmit(form)
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)

        if (!nextOpen) {
          setTemporaryPassword("")
          setConfirmTemporaryPassword("")
          setConfirmTouched(false)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled || pending}>
          <HugeiconsIcon icon={AddIcon} data-icon="inline-start" />
          Create Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Admin tenant and account</DialogTitle>
          <DialogDescription>
            Creates the tenant, trusted Auth claims, and its first Admin
            profile.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="tenantName">Tenant name</Label>
              <Input id="tenantName" name="tenantName" required minLength={2} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="tenantSlug">Tenant slug</Label>
              <Input
                id="tenantSlug"
                name="tenantSlug"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                placeholder="acme-malaysia"
                required
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="supportEmail">Support email (public contact)</Label>
            <Input
              id="supportEmail"
              name="supportEmail"
              type="email"
              aria-describedby="supportEmailDescription"
              required
            />
            <p
              id="supportEmailDescription"
              className="text-xs text-muted-foreground"
            >
              Shown to tenant users for login and account help. A shared inbox
              such as support@company.com is recommended.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="adminName">Admin name</Label>
              <Input id="adminName" name="displayName" required minLength={2} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="adminEmail">Admin email (login account)</Label>
              <Input
                id="adminEmail"
                name="email"
                type="email"
                aria-describedby="adminEmailDescription"
                required
              />
              <p
                id="adminEmailDescription"
                className="text-xs text-muted-foreground"
              >
                Private sign-in and password-recovery email for the first Admin.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="adminPassword">Temporary password</Label>
              <Input
                id="adminPassword"
                name="temporaryPassword"
                type="password"
                minLength={12}
                autoComplete="new-password"
                value={temporaryPassword}
                onChange={(event) => setTemporaryPassword(event.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirmAdminPassword">
                Confirm temporary password
              </Label>
              <Input
                id="confirmAdminPassword"
                name="confirmTemporaryPassword"
                type="password"
                minLength={12}
                autoComplete="new-password"
                value={confirmTemporaryPassword}
                onChange={(event) =>
                  setConfirmTemporaryPassword(event.target.value)
                }
                onBlur={() => setConfirmTouched(true)}
                aria-invalid={showPasswordMismatch}
                aria-describedby="adminPasswordDescription adminPasswordMatch"
                required
              />
            </div>
            <p
              id="adminPasswordDescription"
              className="text-xs text-muted-foreground sm:col-span-2"
            >
              Minimum 12 characters. Share it through an approved secure
              channel.
            </p>
            <p
              id="adminPasswordMatch"
              className={
                showPasswordMismatch
                  ? "text-xs text-destructive sm:col-span-2"
                  : passwordsMatch
                    ? "text-xs text-emerald-500 sm:col-span-2 dark:text-emerald-400"
                    : "text-xs text-muted-foreground sm:col-span-2"
              }
              aria-live="polite"
            >
              {showPasswordMismatch
                ? "Passwords do not match. Enter the same temporary password twice."
                : passwordsMatch
                  ? "Passwords match."
                  : "Enter the same temporary password again to confirm it."}
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !passwordsMatch}>
              Create tenant and Admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CreateVendorDialog({
  tenants,
  disabled,
  pending,
  onSubmit,
}: {
  tenants: AdminTenant[]
  disabled: boolean
  pending: boolean
  onSubmit: (form: FormData) => void
}) {
  const [open, setOpen] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(new FormData(event.currentTarget))
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled || pending}>
          <HugeiconsIcon icon={AddIcon} data-icon="inline-start" />
          Create Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Vendor company and account</DialogTitle>
          <DialogDescription>
            The Vendor will be bound to exactly one Admin tenant and subtype.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="vendorTenant">Admin tenant</Label>
              <NativeSelect id="vendorTenant" name="adminId" required>
                {tenants
                  .filter((tenant) => tenant.status === "active")
                  .map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="vendorType">Vendor subtype</Label>
              <NativeSelect id="vendorType" name="vendorType" required>
                <option value="delegation">Delegation</option>
                <option value="partner">Partner</option>
              </NativeSelect>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="companyName">Company name</Label>
              <Input id="companyName" name="companyName" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="companyNameCn">Chinese name</Label>
              <Input id="companyNameCn" name="companyNameCn" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="vendorSector">Sector</Label>
            <IndustrySectorCombobox id="vendorSector" name="sector" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="vendorName">Account holder</Label>
              <Input id="vendorName" name="displayName" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="vendorEmail">Email</Label>
              <Input id="vendorEmail" name="email" type="email" required />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="vendorPassword">Temporary password</Label>
            <Input
              id="vendorPassword"
              name="temporaryPassword"
              type="password"
              minLength={12}
              autoComplete="new-password"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit">Create Vendor and account</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StatusControl({
  value,
  options,
  pending,
  onApply,
}: {
  value: string
  options: string[]
  pending: boolean
  onApply: (value: string) => void
}) {
  const [status, setStatus] = useState(value)

  return (
    <div className="flex min-w-48 gap-2">
      <NativeSelect
        aria-label="Status"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labelStatus(option)}
          </option>
        ))}
      </NativeSelect>
      <Button
        variant="outline"
        disabled={pending || status === value}
        onClick={() => onApply(status)}
      >
        Apply
      </Button>
    </div>
  )
}

function TransferControl({
  vendor,
  tenants,
  pending,
  onTransfer,
}: {
  vendor: ManagedVendor
  tenants: AdminTenant[]
  pending: boolean
  onTransfer: (destinationId: string) => void
}) {
  const choices = tenants.filter(
    (tenant) => tenant.status === "active" && tenant.id !== vendor.admin_id
  )
  const [destination, setDestination] = useState(choices[0]?.id ?? "")

  if (choices.length === 0) {
    return null
  }

  return (
    <div className="flex min-w-60 gap-2">
      <NativeSelect
        aria-label="Destination Admin"
        value={destination}
        onChange={(event) => setDestination(event.target.value)}
      >
        {choices.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </NativeSelect>
      <Button
        variant="outline"
        disabled={pending || !destination}
        onClick={() => onTransfer(destination)}
      >
        Transfer
      </Button>
    </div>
  )
}

function MobileRecord({
  title,
  subtitle,
  status,
  children,
}: {
  title: string
  subtitle: string
  status?: string
  children?: ReactNode
}) {
  return (
    <Card className="md:hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-sm">{title}</CardTitle>
            <CardDescription className="mt-1 break-all">
              {subtitle}
            </CardDescription>
          </div>
          {status ? statusBadge(status) : null}
        </div>
      </CardHeader>
      {children ? (
        <CardContent className="grid gap-3">{children}</CardContent>
      ) : null}
    </Card>
  )
}

function AdminRecoveryButton({
  account,
  pending,
  provisioningConfigured,
  mobile = false,
  onSend,
}: {
  account?: ManagedAccount
  pending: boolean
  provisioningConfigured: boolean
  mobile?: boolean
  onSend: (account: ManagedAccount) => void
}) {
  const eligible = isActiveAdminRecoveryAccount(account)

  return (
    <Button
      className={mobile ? "w-full" : undefined}
      variant="outline"
      disabled={pending || !provisioningConfigured || !eligible}
      title={
        eligible
          ? `Send a secure recovery link to ${account.email}`
          : "No active Admin account is available for this tenant."
      }
      onClick={() => {
        if (eligible) {
          onSend(account)
        }
      }}
    >
      <HugeiconsIcon icon={ResetPasswordIcon} data-icon="inline-start" />
      {mobile ? "Send Admin reset link" : "Send reset link"}
    </Button>
  )
}

function SuperadminWorkspaceBrand({ subtitle }: { subtitle: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs font-semibold text-sidebar-foreground">
        Plexus Platform
      </p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {subtitle}
      </p>
    </div>
  )
}

function SuperadminWorkspaceNavigation({
  session,
  activeValue,
}: {
  session: AuthenticatedIdentity
  activeValue: string
}) {
  const activeLabel =
    superadminNavItems.find((item) => item.value === activeValue)?.label ??
    superadminNavItems[0].label
  const accountContext = (
    <div className="mt-auto rounded-lg border border-white/10 bg-white/6 px-3 py-2.5">
      <p className="truncate text-xs font-medium text-sidebar-foreground">
        {session.displayName}
      </p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {session.email}
      </p>
    </div>
  )

  return (
    <WorkspaceNavigationShell
      desktopClassName="lg:row-span-2"
      desktopBrand={
        <SuperadminWorkspaceBrand subtitle="Superadmin workspace" />
      }
      mobileBrand={<SuperadminWorkspaceBrand subtitle={activeLabel} />}
      sheetBrand={<SuperadminWorkspaceBrand subtitle="Superadmin workspace" />}
      navigationLabel="Navigation"
      menuLabel="Menu"
      activeLabel={activeLabel}
      sheetTitle="Plexus Platform"
      desktopFooter={accountContext}
      mobileFooter={accountContext}
      renderNavigation={(surface, closeMobile) => {
        const mobile = surface === "mobile"
        const navTriggerClass = mobile
          ? "h-12 w-full flex-none shrink-0 justify-start gap-3 rounded-lg px-4 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring/45 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:hover:bg-primary"
          : "h-10 w-full justify-start gap-2 rounded-md px-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring/45 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:hover:bg-primary"

        return (
          <TabsList
            aria-label="Superadmin navigation"
            className={`h-auto w-full flex-col items-stretch bg-transparent p-0 ${
              mobile ? "gap-1.5" : "gap-1"
            }`}
          >
            {superadminNavItems.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className={navTriggerClass}
                onClick={mobile ? closeMobile : undefined}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  strokeWidth={1.7}
                  className={mobile ? "size-5" : "size-4"}
                />
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )
      }}
    />
  )
}

export function SuperadminConsole(props: Props) {
  const {
    locale,
    session,
    provisioningConfigured,
    tenants,
    vendors,
    accounts,
    auditEvents,
    meetingCreationIncidents,
    emailDeliveries,
    emailProviderReadiness,
    operations,
    platformSettings,
    tchinaEvent,
    tchinaRegistrations,
  } = props
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [vendorSearch, setVendorSearch] = useState("")
  const [tenantFilter, setTenantFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [auditSearch, setAuditSearch] = useState("")
  const [emailSearch, setEmailSearch] = useState("")
  const [emailStatusFilter, setEmailStatusFilter] = useState("all")
  const [emailSenderFilter, setEmailSenderFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("admins")

  const tenantNames = useMemo(
    () => new Map(tenants.map((tenant) => [tenant.id, tenant.name])),
    [tenants]
  )
  const filteredVendors = vendors.filter((vendor) => {
    const text =
      `${vendor.name_en} ${vendor.name_cn} ${vendor.sector}`.toLowerCase()
    return (
      text.includes(vendorSearch.toLowerCase()) &&
      (tenantFilter === "all" || vendor.admin_id === tenantFilter) &&
      (typeFilter === "all" || vendor.vendor_type === typeFilter)
    )
  })
  const filteredAudit = auditEvents.filter((event) =>
    `${event.action} ${event.target_table} ${event.actor_role ?? ""} ${event.target_id ?? ""}`
      .toLowerCase()
      .includes(auditSearch.toLowerCase())
  )
  const filteredEmailDeliveries = emailDeliveries.filter((delivery) => {
    const searchText =
      `${delivery.sender_name} ${delivery.sender_type} ${delivery.recipient_email} ${delivery.recipient_name} ${delivery.trigger_key} ${delivery.subject} ${delivery.status}`.toLowerCase()

    return (
      searchText.includes(emailSearch.toLowerCase()) &&
      (emailStatusFilter === "all" || delivery.status === emailStatusFilter) &&
      (emailSenderFilter === "all" ||
        delivery.sender_type === emailSenderFilter)
    )
  })
  const emailSenderGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string
        label: string
        senderType: EmailDelivery["sender_type"]
        total: number
        delivered: number
        failed: number
      }
    >()

    for (const delivery of emailDeliveries) {
      const key = `${delivery.sender_type}:${delivery.sender_user_id ?? delivery.sender_name}`
      const current = groups.get(key) ?? {
        key,
        label: delivery.sender_name || emailSenderLabel(delivery.sender_type),
        senderType: delivery.sender_type,
        total: 0,
        delivered: 0,
        failed: 0,
      }

      current.total += 1
      if (delivery.status === "delivered") current.delivered += 1
      if (
        ["bounced", "complained", "suppressed", "failed"].includes(
          delivery.status
        )
      ) {
        current.failed += 1
      }
      groups.set(key, current)
    }

    return [...groups.values()].sort((left, right) => right.total - left.total)
  }, [emailDeliveries])
  const deliveredEmails = emailDeliveries.filter(
    (delivery) => delivery.status === "delivered"
  ).length
  const failedEmails = emailDeliveries.filter((delivery) =>
    ["bounced", "complained", "suppressed", "failed"].includes(delivery.status)
  ).length
  const requestedAuthEmails = emailDeliveries.filter(
    (delivery) =>
      delivery.provider === "supabase_auth" && delivery.status === "requested"
  ).length
  const activeTenants = tenants.filter((tenant) => tenant.status === "active")
  const activeVendors = vendors.filter((vendor) => vendor.status === "active")
  const suspendedAccounts = accounts.filter((account) => !account.active)
  const adminAccountsByTenant = useMemo(() => {
    const byTenant = new Map<string, ManagedAccount>()

    for (const account of accounts) {
      if (account.role !== "admin" || !account.admin_id) {
        continue
      }

      const current = byTenant.get(account.admin_id)
      if (!current || (!current.active && account.active)) {
        byTenant.set(account.admin_id, account)
      }
    }

    return byTenant
  }, [accounts])

  function runAction(
    action: () => Promise<ManagementActionResult>,
    successMessage: string
  ) {
    startTransition(async () => {
      const result = await action()
      if (result.ok) {
        toast.success(successMessage)
        router.refresh()
      } else {
        toast.error(result.error ?? "Action failed.")
      }
    })
  }

  function createAdmin(form: FormData) {
    runAction(
      () =>
        createAdminAccountAction({
          locale,
          tenantName: form.get("tenantName"),
          tenantSlug: form.get("tenantSlug"),
          supportEmail: form.get("supportEmail"),
          displayName: form.get("displayName"),
          email: form.get("email"),
          temporaryPassword: form.get("temporaryPassword"),
          confirmTemporaryPassword: form.get("confirmTemporaryPassword"),
        }),
      "Admin tenant and account created."
    )
  }

  function createVendor(form: FormData) {
    runAction(
      () =>
        createVendorAccountAction({
          locale,
          adminId: form.get("adminId"),
          vendorType: form.get("vendorType"),
          companyName: form.get("companyName"),
          companyNameCn: form.get("companyNameCn"),
          sector: form.get("sector"),
          displayName: form.get("displayName"),
          email: form.get("email"),
          temporaryPassword: form.get("temporaryPassword"),
        }),
      "Vendor company and account created."
    )
  }

  function sendAdminRecoveryLink(account: ManagedAccount) {
    runAction(
      () =>
        sendAdminPasswordResetAction({
          locale,
          userId: account.id,
        }),
      `Password reset link sent to ${account.email}.`
    )
  }

  function retryMeetingCreation(incident: MeetingCreationIncident) {
    runAction(
      () =>
        retryMeetingCreationAction({
          locale,
          jobId: incident.id,
        }),
      "Meeting created and the critical incident was resolved."
    )
  }

  return (
    <main className="min-h-svh bg-[#eef4f8]">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <header className="flex flex-col gap-4 rounded-2xl border-0 bg-[#071326] p-5 text-white shadow-none sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge>Superadmin</Badge>
              <Badge variant="outline">All tenants</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
              Plexus platform control center
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#b8cadc]">
              Manage Admin tenants, every Vendor, trusted account bindings,
              cross-tenant operations, and immutable audit history.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href={`/${locale}/compliance`}>Compliance</Link>
            </Button>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await logoutAction(locale)
                  router.push(result.redirectTo)
                })
              }
            >
              <HugeiconsIcon icon={Logout03Icon} data-icon="inline-start" />
              Sign out
            </Button>
          </div>
        </header>

        {!provisioningConfigured ? (
          <Alert>
            <HugeiconsIcon icon={ShieldUserIcon} />
            <AlertTitle>Account provisioning is locked</AlertTitle>
            <AlertDescription>
              Set the server-only <code>SUPABASE_SECRET_KEY</code> to enable
              account creation, recovery links, suspension, restoration, and
              Vendor transfers. Directory and reporting access remain available.
            </AlertDescription>
          </Alert>
        ) : null}

        {meetingCreationIncidents.length ? (
          <Alert variant="destructive" className="py-3">
            <HugeiconsIcon icon={Alert02Icon} />
            <AlertTitle>
              Critical: {meetingCreationIncidents.length} meeting creation{" "}
              {meetingCreationIncidents.length === 1 ? "failure" : "failures"}
            </AlertTitle>
            <AlertDescription>
              Vendor agreement was preserved, but Plexus could not create the
              provider meeting. Review the sanitized incident and retry after
              correcting provider availability or authorization.
            </AlertDescription>
            <AlertAction>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setActiveTab("incidents")}
              >
                Review
              </Button>
            </AlertAction>
          </Alert>
        ) : null}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          orientation="vertical"
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
            <SuperadminWorkspaceNavigation
              session={session}
              activeValue={activeTab}
            />

            <div className="grid gap-3 sm:grid-cols-2 lg:col-start-2 lg:row-start-1 xl:grid-cols-4">
              <MetricCard
                label="Admin tenants"
                value={tenants.length}
                detail={`${activeTenants.length} active`}
                icon={Building01Icon}
              />
              <MetricCard
                label="Vendors"
                value={vendors.length}
                detail={`${activeVendors.length} active across all Admins`}
                icon={UserGroupIcon}
              />
              <MetricCard
                label="Accounts"
                value={accounts.length}
                detail={`${suspendedAccounts.length} suspended`}
                icon={ShieldUserIcon}
              />
              <MetricCard
                label="Operational records"
                value={
                  operations.matches.length +
                  operations.meetings.length +
                  operations.deals.length
                }
                detail={`${operations.matches.length} matches · ${operations.meetings.length} meetings · ${operations.deals.length} deals`}
                icon={AnalyticsUpIcon}
              />
            </div>

            <TabsContent
              value="admins"
              className="grid min-w-0 gap-4 lg:col-start-2 lg:row-start-2"
            >
              <Card>
                <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Admin tenant directory</CardTitle>
                    <CardDescription>
                      One isolated white-label operator per tenant.
                    </CardDescription>
                  </div>
                  <CreateAdminDialog
                    disabled={!provisioningConfigured}
                    pending={pending}
                    onSubmit={createAdmin}
                  />
                </CardHeader>
                <CardContent>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Admin tenant</TableHead>
                          <TableHead>Support</TableHead>
                          <TableHead>Vendors</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Control</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tenants.map((tenant) => (
                          <TableRow key={tenant.id}>
                            <TableCell>
                              <div className="font-medium">{tenant.name}</div>
                              <div className="text-muted-foreground">
                                {tenant.slug}
                              </div>
                            </TableCell>
                            <TableCell>{tenant.support_email || "—"}</TableCell>
                            <TableCell>
                              {
                                vendors.filter(
                                  (vendor) => vendor.admin_id === tenant.id
                                ).length
                              }
                            </TableCell>
                            <TableCell>{statusBadge(tenant.status)}</TableCell>
                            <TableCell>
                              {formatDate(tenant.created_at)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap justify-end gap-2">
                                <TenantProfileDialog
                                  locale={locale}
                                  tenantId={tenant.id}
                                  initialName={tenant.name}
                                  initialSupportEmail={tenant.support_email}
                                  initialPrimaryColor={tenant.primary_color}
                                  initialLogoUrl={tenant.logo_url}
                                />
                                <AdminRecoveryButton
                                  account={adminAccountsByTenant.get(tenant.id)}
                                  pending={pending}
                                  provisioningConfigured={
                                    provisioningConfigured
                                  }
                                  onSend={sendAdminRecoveryLink}
                                />
                                <StatusControl
                                  value={tenant.status}
                                  options={["active", "suspended", "archived"]}
                                  pending={pending}
                                  onApply={(status) =>
                                    runAction(
                                      () =>
                                        setTenantStatusAction({
                                          locale,
                                          tenantId: tenant.id,
                                          status: status as TenantStatus,
                                        }),
                                      "Admin tenant status updated."
                                    )
                                  }
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="grid gap-3">
                    {tenants.map((tenant) => (
                      <MobileRecord
                        key={tenant.id}
                        title={tenant.name}
                        subtitle={tenant.support_email || tenant.slug}
                        status={tenant.status}
                      >
                        <p className="text-xs text-muted-foreground">
                          {
                            vendors.filter(
                              (vendor) => vendor.admin_id === tenant.id
                            ).length
                          }{" "}
                          Vendors · created {formatDate(tenant.created_at)}
                        </p>
                        <AdminRecoveryButton
                          account={adminAccountsByTenant.get(tenant.id)}
                          pending={pending}
                          provisioningConfigured={provisioningConfigured}
                          mobile
                          onSend={sendAdminRecoveryLink}
                        />
                        <StatusControl
                          value={tenant.status}
                          options={["active", "suspended", "archived"]}
                          pending={pending}
                          onApply={(status) =>
                            runAction(
                              () =>
                                setTenantStatusAction({
                                  locale,
                                  tenantId: tenant.id,
                                  status: status as TenantStatus,
                                }),
                              "Admin tenant status updated."
                            )
                          }
                        />
                        <TenantProfileDialog
                          locale={locale}
                          tenantId={tenant.id}
                          initialName={tenant.name}
                          initialSupportEmail={tenant.support_email}
                          initialPrimaryColor={tenant.primary_color}
                          initialLogoUrl={tenant.logo_url}
                          triggerLabel="Edit tenant profile"
                        />
                      </MobileRecord>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="vendors"
              className="grid min-w-0 gap-4 lg:col-start-2 lg:row-start-2"
            >
              <Card>
                <CardHeader className="gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <CardTitle>Vendor directory</CardTitle>
                    <CardDescription>
                      All Vendor companies, grouped by owning Admin and subtype.
                    </CardDescription>
                  </div>
                  <CreateVendorDialog
                    tenants={tenants}
                    disabled={!provisioningConfigured}
                    pending={pending}
                    onSubmit={createVendor}
                  />
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Input
                      aria-label="Search Vendors"
                      placeholder="Search name or sector"
                      value={vendorSearch}
                      onChange={(event) => setVendorSearch(event.target.value)}
                    />
                    <NativeSelect
                      aria-label="Filter by Admin tenant"
                      value={tenantFilter}
                      onChange={(event) => setTenantFilter(event.target.value)}
                    >
                      <option value="all">All Admin tenants</option>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </option>
                      ))}
                    </NativeSelect>
                    <NativeSelect
                      aria-label="Filter by Vendor subtype"
                      value={typeFilter}
                      onChange={(event) => setTypeFilter(event.target.value)}
                    >
                      <option value="all">All subtypes</option>
                      <option value="delegation">Delegation</option>
                      <option value="partner">Partner</option>
                    </NativeSelect>
                  </div>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Owning Admin</TableHead>
                          <TableHead>Subtype</TableHead>
                          <TableHead>Sector</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Control / transfer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVendors.map((vendor) => (
                          <TableRow key={vendor.id}>
                            <TableCell>
                              <div className="font-medium">
                                {vendor.name_en}
                              </div>
                              <div className="text-muted-foreground">
                                {vendor.name_cn || vendor.id}
                              </div>
                            </TableCell>
                            <TableCell>
                              {tenantNames.get(vendor.admin_id) ?? "Unknown"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {labelStatus(vendor.vendor_type)}
                              </Badge>
                            </TableCell>
                            <TableCell>{vendor.sector}</TableCell>
                            <TableCell>{statusBadge(vendor.status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-2">
                                <VendorDirectoryDialog
                                  locale={locale}
                                  vendor={vendor}
                                  accounts={accounts.filter(
                                    (account) =>
                                      account.vendor_company_id === vendor.id
                                  )}
                                  accountEditingEnabled={provisioningConfigured}
                                />
                                <StatusControl
                                  value={vendor.status}
                                  options={["active", "suspended", "archived"]}
                                  pending={pending}
                                  onApply={(status) =>
                                    runAction(
                                      () =>
                                        setVendorStatusAction({
                                          locale,
                                          vendorId: vendor.id,
                                          status: status as VendorStatus,
                                        }),
                                      "Vendor status updated."
                                    )
                                  }
                                />
                                <TransferControl
                                  vendor={vendor}
                                  tenants={tenants}
                                  pending={pending || !provisioningConfigured}
                                  onTransfer={(destinationAdminId) =>
                                    runAction(
                                      () =>
                                        transferVendorAction({
                                          locale,
                                          vendorId: vendor.id,
                                          destinationAdminId,
                                        }),
                                      "Vendor transferred to the selected Admin."
                                    )
                                  }
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="grid gap-3">
                    {filteredVendors.map((vendor) => (
                      <MobileRecord
                        key={vendor.id}
                        title={vendor.name_en}
                        subtitle={`${tenantNames.get(vendor.admin_id) ?? "Unknown Admin"} · ${labelStatus(vendor.vendor_type)} · ${vendor.sector}`}
                        status={vendor.status}
                      >
                        <VendorDirectoryDialog
                          locale={locale}
                          vendor={vendor}
                          accounts={accounts.filter(
                            (account) => account.vendor_company_id === vendor.id
                          )}
                          accountEditingEnabled={provisioningConfigured}
                        />
                        <StatusControl
                          value={vendor.status}
                          options={["active", "suspended", "archived"]}
                          pending={pending}
                          onApply={(status) =>
                            runAction(
                              () =>
                                setVendorStatusAction({
                                  locale,
                                  vendorId: vendor.id,
                                  status: status as VendorStatus,
                                }),
                              "Vendor status updated."
                            )
                          }
                        />
                        <TransferControl
                          vendor={vendor}
                          tenants={tenants}
                          pending={pending || !provisioningConfigured}
                          onTransfer={(destinationAdminId) =>
                            runAction(
                              () =>
                                transferVendorAction({
                                  locale,
                                  vendorId: vendor.id,
                                  destinationAdminId,
                                }),
                              "Vendor transferred to the selected Admin."
                            )
                          }
                        />
                      </MobileRecord>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="accounts"
              className="min-w-0 lg:col-start-2 lg:row-start-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Account and role bindings</CardTitle>
                  <CardDescription>
                    Trusted Auth claims must match these active database
                    bindings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Admin tenant</TableHead>
                          <TableHead>Vendor binding</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Control</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accounts.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell>
                              <div className="font-medium">
                                {account.display_name}
                              </div>
                              <div className="text-muted-foreground">
                                {account.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {labelStatus(account.role)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {account.admin_id
                                ? (tenantNames.get(account.admin_id) ??
                                  "Unknown")
                                : "Platform-wide"}
                            </TableCell>
                            <TableCell>
                              {account.vendor_company_id
                                ? (vendors.find(
                                    (vendor) =>
                                      vendor.id === account.vendor_company_id
                                  )?.name_en ?? account.vendor_company_id)
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {statusBadge(
                                account.active ? "active" : "suspended"
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  disabled={pending || !provisioningConfigured}
                                  onClick={() =>
                                    runAction(
                                      () =>
                                        syncAccountClaimsAction({
                                          locale,
                                          userId: account.id,
                                        }),
                                      "Trusted Auth claims synchronized."
                                    )
                                  }
                                >
                                  Sync claims
                                </Button>
                                <Button
                                  variant={
                                    account.active ? "destructive" : "outline"
                                  }
                                  disabled={
                                    pending ||
                                    !provisioningConfigured ||
                                    account.id === session.userId
                                  }
                                  onClick={() =>
                                    runAction(
                                      () =>
                                        setAccountActiveAction({
                                          locale,
                                          userId: account.id,
                                          active: !account.active,
                                        }),
                                      account.active
                                        ? "Account suspended."
                                        : "Account restored."
                                    )
                                  }
                                >
                                  {account.active ? "Suspend" : "Restore"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="grid gap-3">
                    {accounts.map((account) => (
                      <MobileRecord
                        key={account.id}
                        title={account.display_name}
                        subtitle={`${account.email} · ${labelStatus(account.role)}`}
                        status={account.active ? "active" : "suspended"}
                      >
                        <p className="text-xs text-muted-foreground">
                          {account.admin_id
                            ? (tenantNames.get(account.admin_id) ??
                              "Unknown Admin")
                            : "Platform-wide account"}
                        </p>
                        <Button
                          className="w-full"
                          variant="outline"
                          disabled={pending || !provisioningConfigured}
                          onClick={() =>
                            runAction(
                              () =>
                                syncAccountClaimsAction({
                                  locale,
                                  userId: account.id,
                                }),
                              "Trusted Auth claims synchronized."
                            )
                          }
                        >
                          Sync trusted claims
                        </Button>
                        <Button
                          className="w-full"
                          variant={account.active ? "destructive" : "outline"}
                          disabled={
                            pending ||
                            !provisioningConfigured ||
                            account.id === session.userId
                          }
                          onClick={() =>
                            runAction(
                              () =>
                                setAccountActiveAction({
                                  locale,
                                  userId: account.id,
                                  active: !account.active,
                                }),
                              account.active
                                ? "Account suspended."
                                : "Account restored."
                            )
                          }
                        >
                          {account.active ? "Suspend" : "Restore"}
                        </Button>
                      </MobileRecord>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="reporting"
              className="min-w-0 lg:col-start-2 lg:row-start-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Cross-tenant operations</CardTitle>
                  <CardDescription>
                    Platform-wide totals broken down by Admin tenant.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {tenants.map((tenant) => {
                    const tenantVendors = vendors.filter(
                      (vendor) => vendor.admin_id === tenant.id
                    ).length
                    const matches = operations.matches.filter(
                      (row) => row.admin_id === tenant.id
                    ).length
                    const meetings = operations.meetings.filter(
                      (row) => row.admin_id === tenant.id
                    ).length
                    const deals = operations.deals.filter(
                      (row) => row.admin_id === tenant.id
                    ).length

                    return (
                      <Card key={tenant.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <CardTitle className="text-sm">
                                {tenant.name}
                              </CardTitle>
                              <CardDescription>{tenant.slug}</CardDescription>
                            </div>
                            {statusBadge(tenant.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground">Vendors</p>
                            <p className="text-lg font-semibold">
                              {tenantVendors}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Matches</p>
                            <p className="text-lg font-semibold">{matches}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Meetings</p>
                            <p className="text-lg font-semibold">{meetings}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Deals</p>
                            <p className="text-lg font-semibold">{deals}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="incidents"
              className="min-w-0 lg:col-start-2 lg:row-start-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Critical meeting incidents</CardTitle>
                  <CardDescription>
                    Automatic meeting creation failures requiring Superadmin
                    attention. Provider credentials, tokens, and raw responses
                    are never shown here.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {meetingCreationIncidents.length ? (
                    meetingCreationIncidents.map((incident) => (
                      <div
                        key={incident.id}
                        className="grid gap-3 rounded-md border border-destructive/35 bg-destructive/5 p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="destructive">Critical</Badge>
                              <Badge variant="outline">
                                {incident.provider.toUpperCase()}
                              </Badge>
                              <span className="text-sm font-medium">
                                {tenantNames.get(incident.admin_id) ??
                                  "Unknown tenant"}
                              </span>
                            </div>
                            <p className="mt-2 text-sm">
                              {incident.failure_summary}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {labelStatus(incident.failure_code)} · Attempt{" "}
                              {incident.attempt_count} ·{" "}
                              {formatDate(incident.last_attempt_at)}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            disabled={pending || incident.attempt_count >= 20}
                            onClick={() => retryMeetingCreation(incident)}
                          >
                            Retry meeting creation
                          </Button>
                        </div>
                        <p className="text-xs break-all text-muted-foreground">
                          Match: {incident.match_id}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-md border border-dashed p-6 text-center">
                      <p className="font-medium">
                        No critical meeting incidents
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Automatic provider creation is operating without
                        unresolved failures.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="email"
              className="grid min-w-0 gap-4 lg:col-start-2 lg:row-start-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Email provider readiness</CardTitle>
                  <CardDescription>
                    Business emails use the Resend API. Password recovery and
                    setup links remain generated by Supabase Auth and require
                    Resend to be connected as the Auth SMTP provider.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: "Resend API key",
                      configured: emailProviderReadiness.resendApiConfigured,
                      detail: "Sends business and broadcast email.",
                    },
                    {
                      label: "Verified From address",
                      configured: emailProviderReadiness.resendFromConfigured,
                      detail: "Must use the verified Resend domain.",
                    },
                    {
                      label: "Delivery webhook",
                      configured:
                        emailProviderReadiness.resendWebhookConfigured,
                      detail: "Updates delivered, bounced, and failed states.",
                    },
                  ].map((item) => (
                    <div key={item.label} className="rounded-md border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{item.label}</p>
                        <Badge
                          variant={
                            item.configured ? "secondary" : "destructive"
                          }
                        >
                          {item.configured ? "Configured" : "Required"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Tracked recipients"
                  value={emailDeliveries.length}
                  detail="One record per intended recipient"
                  icon={Mail01Icon}
                />
                <MetricCard
                  label="Delivered"
                  value={deliveredEmails}
                  detail="Confirmed by the Resend webhook"
                  icon={Mail01Icon}
                />
                <MetricCard
                  label="Needs attention"
                  value={failedEmails}
                  detail="Failed, bounced, suppressed, or complained"
                  icon={Alert02Icon}
                />
                <MetricCard
                  label="Auth requests"
                  value={requestedAuthEmails}
                  detail="Accepted by Supabase; SMTP delivery is separate"
                  icon={ResetPasswordIcon}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Sending activity by sender</CardTitle>
                  <CardDescription>
                    Counts are grouped by the person or system that initiated
                    each recipient delivery.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {emailSenderGroups.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {emailSenderGroups.map((group) => (
                        <div key={group.key} className="rounded-md border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">
                                {group.label}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {emailSenderLabel(group.senderType)}
                              </p>
                            </div>
                            <Badge variant="outline">{group.total} total</Badge>
                          </div>
                          <p className="mt-3 text-xs text-muted-foreground">
                            {group.delivered} delivered · {group.failed} needs
                            attention
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed p-6 text-center">
                      <p className="font-medium">No email activity yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        New Auth requests and Resend messages will appear here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Delivery log</CardTitle>
                  <CardDescription>
                    Search recipients and filter the latest 500 delivery
                    records. “Requested” is not the same as delivered.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
                    <Input
                      placeholder="Search sender, recipient, subject, or trigger"
                      value={emailSearch}
                      onChange={(event) => setEmailSearch(event.target.value)}
                    />
                    <NativeSelect
                      aria-label="Filter email status"
                      value={emailStatusFilter}
                      onChange={(event) =>
                        setEmailStatusFilter(event.target.value)
                      }
                    >
                      <option value="all">All statuses</option>
                      <option value="requested">Requested</option>
                      <option value="queued">Queued</option>
                      <option value="sent">Sent</option>
                      <option value="delivered">Delivered</option>
                      <option value="delivery_delayed">Delayed</option>
                      <option value="failed">Failed</option>
                      <option value="bounced">Bounced</option>
                      <option value="complained">Complained</option>
                      <option value="suppressed">Suppressed</option>
                    </NativeSelect>
                    <NativeSelect
                      aria-label="Filter email sender"
                      value={emailSenderFilter}
                      onChange={(event) =>
                        setEmailSenderFilter(event.target.value)
                      }
                    >
                      <option value="all">All senders</option>
                      <option value="supabase_auth">Supabase Auth</option>
                      <option value="plexus_system">Plexus system</option>
                      <option value="superadmin">Superadmin</option>
                      <option value="admin">Admin</option>
                      <option value="vendor">Vendor</option>
                    </NativeSelect>
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sender</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Provider</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Requested</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmailDeliveries.map((delivery) => (
                          <TableRow key={delivery.id}>
                            <TableCell>
                              <div className="font-medium">
                                {delivery.sender_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {emailSenderLabel(delivery.sender_type)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>{delivery.recipient_name || "—"}</div>
                              <div className="text-xs text-muted-foreground">
                                {delivery.recipient_email}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-64">
                              <div className="truncate font-medium">
                                {delivery.subject}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {labelStatus(delivery.trigger_key)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {delivery.provider === "supabase_auth"
                                  ? "Supabase Auth"
                                  : "Resend"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="grid gap-1">
                                {emailStatusBadge(delivery.status)}
                                {delivery.status_detail ? (
                                  <span className="max-w-56 text-xs text-muted-foreground">
                                    {delivery.status_detail}
                                  </span>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDate(delivery.requested_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid gap-3 md:hidden">
                    {filteredEmailDeliveries.map((delivery) => (
                      <div key={delivery.id} className="rounded-md border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {delivery.subject}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {delivery.recipient_email}
                            </p>
                          </div>
                          {emailStatusBadge(delivery.status)}
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                          {delivery.sender_name} ·{" "}
                          {emailSenderLabel(delivery.sender_type)} ·{" "}
                          {formatDate(delivery.requested_at)}
                        </p>
                        {delivery.status_detail ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {delivery.status_detail}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {!filteredEmailDeliveries.length ? (
                    <p className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">
                      No delivery records match these filters.
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email action coverage</CardTitle>
                  <CardDescription>
                    The expected sender, recipient, and delivery owner for every
                    email-capable Plexus action.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="hidden overflow-x-auto md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>Sender</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Delivery owner</TableHead>
                          <TableHead>After setup</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emailTriggerCatalog.map((trigger) => (
                          <TableRow key={trigger.key}>
                            <TableCell className="font-medium">
                              {trigger.label}
                            </TableCell>
                            <TableCell>{trigger.sender}</TableCell>
                            <TableCell>{trigger.recipient}</TableCell>
                            <TableCell>{trigger.provider}</TableCell>
                            <TableCell className="max-w-80 text-muted-foreground">
                              {trigger.behavior}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="grid gap-3 md:hidden">
                    {emailTriggerCatalog.map((trigger) => (
                      <div key={trigger.key} className="rounded-md border p-3">
                        <p className="text-sm font-medium">{trigger.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {trigger.sender} → {trigger.recipient}
                        </p>
                        <Badge className="mt-3" variant="outline">
                          {trigger.provider}
                        </Badge>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {trigger.behavior}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="tchina"
              className="min-w-0 lg:col-start-2 lg:row-start-2"
            >
              <TChinaExpoSuperadminPanel
                locale={locale}
                event={tchinaEvent}
                registrations={tchinaRegistrations}
              />
            </TabsContent>

            <TabsContent
              value="settings"
              className="min-w-0 lg:col-start-2 lg:row-start-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Platform settings</CardTitle>
                  <CardDescription>
                    Audited platform-wide plans, permissions, reference data,
                    and operational controls. These values are not
                    tenant-editable.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {platformSettings.map((setting) => (
                    <PlatformSettingEditor
                      key={setting.id}
                      locale={locale}
                      setting={setting}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="audit"
              className="min-w-0 lg:col-start-2 lg:row-start-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Audit events</CardTitle>
                  <CardDescription>
                    Append-only history for tenant, Vendor, account, and
                    transfer changes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Input
                    placeholder="Search action, table, role, or target ID"
                    value={auditSearch}
                    onChange={(event) => setAuditSearch(event.target.value)}
                  />
                  <div className="grid gap-2">
                    {filteredAudit.map((event) => (
                      <details
                        key={event.id}
                        className="rounded-md border bg-background p-3 text-xs"
                      >
                        <summary className="cursor-pointer list-none">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">
                                {event.action.toUpperCase()}
                              </Badge>
                              <span className="font-medium">
                                {event.target_table}
                              </span>
                              <span className="text-muted-foreground">
                                {event.actor_role ?? "system"}
                              </span>
                            </div>
                            <span className="text-muted-foreground">
                              {formatDate(event.created_at)}
                            </span>
                          </div>
                        </summary>
                        <div className="mt-3 grid gap-2 border-t pt-3">
                          <p className="break-all">
                            Target: {event.target_id ?? "—"} · Tenant:{" "}
                            {event.admin_id
                              ? (tenantNames.get(event.admin_id) ??
                                event.admin_id)
                              : "Platform"}
                          </p>
                          <pre className="max-h-72 overflow-auto rounded bg-muted p-3 text-[11px]">
                            {JSON.stringify(
                              {
                                before: event.before_values,
                                after: event.after_values,
                                requestId: event.request_id,
                              },
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </details>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>
  )
}
