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
  Building01Icon,
  Logout03Icon,
  ShieldUserIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { logoutAction } from "@/app/actions/auth"
import {
  createAdminAccountAction,
  createVendorAccountAction,
  setAccountActiveAction,
  setTenantStatusAction,
  setVendorStatusAction,
  syncAccountClaimsAction,
  transferVendorAction,
  type ManagementActionResult,
} from "@/app/actions/management"
import type { AuthenticatedIdentity } from "@/lib/authorization"
import type { Locale } from "@/lib/i18n"
import type {
  AdminTenant,
  AuditEvent,
  ManagedAccount,
  ManagedVendor,
  PlatformSetting,
  TenantOperationalCount,
  TenantStatus,
  VendorStatus,
} from "@/lib/management-data"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { VendorDirectoryDialog } from "@/components/vendor-directory-dialog"
import { PlatformSettingEditor } from "@/components/platform-setting-editor"

type Props = {
  locale: Locale
  session: AuthenticatedIdentity
  provisioningConfigured: boolean
  tenants: AdminTenant[]
  vendors: ManagedVendor[]
  accounts: ManagedAccount[]
  auditEvents: AuditEvent[]
  operations: {
    matches: TenantOperationalCount[]
    meetings: TenantOperationalCount[]
    deals: TenantOperationalCount[]
  }
  platformSettings: PlatformSetting[]
}

const fieldClass =
  "h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function labelStatus(status: string) {
  return status.replaceAll("_", " ").replace(/^\w/, (letter) =>
    letter.toUpperCase()
  )
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
      <CardFooter className="text-xs text-muted-foreground">{detail}</CardFooter>
    </Card>
  )
}

function NativeSelect({
  children,
  ...props
}: React.ComponentProps<"select">) {
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(new FormData(event.currentTarget))
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            Creates the tenant, trusted Auth claims, and its first Admin profile.
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
            <Label htmlFor="supportEmail">Support email</Label>
            <Input id="supportEmail" name="supportEmail" type="email" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="adminName">Admin name</Label>
              <Input id="adminName" name="displayName" required minLength={2} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="adminEmail">Admin email</Label>
              <Input id="adminEmail" name="email" type="email" required />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="adminPassword">Temporary password</Label>
            <Input
              id="adminPassword"
              name="temporaryPassword"
              type="password"
              minLength={12}
              autoComplete="new-password"
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimum 12 characters. Share it through an approved secure channel.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit">Create tenant and Admin</Button>
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
            <Input id="vendorSector" name="sector" required />
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
      {children ? <CardContent className="grid gap-3">{children}</CardContent> : null}
    </Card>
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
    operations,
    platformSettings,
  } = props
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [vendorSearch, setVendorSearch] = useState("")
  const [tenantFilter, setTenantFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [auditSearch, setAuditSearch] = useState("")

  const tenantNames = useMemo(
    () => new Map(tenants.map((tenant) => [tenant.id, tenant.name])),
    [tenants]
  )
  const filteredVendors = vendors.filter((vendor) => {
    const text = `${vendor.name_en} ${vendor.name_cn} ${vendor.sector}`.toLowerCase()
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
  const activeTenants = tenants.filter((tenant) => tenant.status === "active")
  const activeVendors = vendors.filter((vendor) => vendor.status === "active")
  const suspendedAccounts = accounts.filter((account) => !account.active)

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

  return (
    <main className="min-h-svh bg-muted/20">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge>Superadmin</Badge>
              <Badge variant="outline">All tenants</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Plexus platform control center
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
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
              account creation, suspension, restoration, and Vendor transfers.
              Directory and reporting access remain available.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

        <Tabs defaultValue="admins" className="min-w-0">
          <div className="overflow-x-auto pb-1">
            <TabsList className="min-w-max">
              <TabsTrigger value="admins">Admin tenants</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="reporting">Reporting</TabsTrigger>
              <TabsTrigger value="settings">Platform settings</TabsTrigger>
              <TabsTrigger value="audit">Audit events</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="admins" className="grid gap-4">
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
                          <TableCell>{formatDate(tenant.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <TenantProfileDialog
                                locale={locale}
                                tenantId={tenant.id}
                                initialName={tenant.name}
                                initialSupportEmail={tenant.support_email}
                                initialPrimaryColor={tenant.primary_color}
                                initialLogoUrl={tenant.logo_url}
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

          <TabsContent value="vendors" className="grid gap-4">
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
                            <div className="font-medium">{vendor.name_en}</div>
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

          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <CardTitle>Account and role bindings</CardTitle>
                <CardDescription>
                  Trusted Auth claims must match these active database bindings.
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
                              ? tenantNames.get(account.admin_id) ?? "Unknown"
                              : "Platform-wide"}
                          </TableCell>
                          <TableCell>
                            {account.vendor_company_id
                              ? vendors.find(
                                  (vendor) =>
                                    vendor.id === account.vendor_company_id
                                )?.name_en ?? account.vendor_company_id
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {statusBadge(account.active ? "active" : "suspended")}
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
                          ? tenantNames.get(account.admin_id) ?? "Unknown Admin"
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

          <TabsContent value="reporting">
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
                          <p className="text-lg font-semibold">{tenantVendors}</p>
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

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Platform settings</CardTitle>
                <CardDescription>
                  Audited platform-wide plans, permissions, reference data, and
                  operational controls. These values are not tenant-editable.
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

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit events</CardTitle>
                <CardDescription>
                  Append-only history for tenant, Vendor, account, and transfer changes.
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
                            ? tenantNames.get(event.admin_id) ?? event.admin_id
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
        </Tabs>
      </div>
    </main>
  )
}
