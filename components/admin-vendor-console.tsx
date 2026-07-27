"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building01Icon,
  ShieldUserIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import {
  setAccountActiveAction,
  setVendorStatusAction,
  syncAccountClaimsAction,
  type ManagementActionResult,
} from "@/app/actions/management"
import type { AuthenticatedIdentity } from "@/lib/authorization"
import type { Locale } from "@/lib/i18n"
import type {
  AdminTenant,
  AuditEvent,
  ManagedAccount,
  ManagedVendor,
  VendorStatus,
} from "@/lib/management-data"
import { AdminVendorProvision } from "@/components/admin-vendor-provision"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

type Props = {
  locale: Locale
  session: AuthenticatedIdentity
  provisioningConfigured: boolean
  vendorProvisioningEnabled: boolean
  tenant: AdminTenant
  vendors: ManagedVendor[]
  accounts: ManagedAccount[]
  auditEvents: AuditEvent[]
}

const selectClass =
  "h-8 min-w-32 rounded-md border border-input bg-transparent px-2 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"

function statusBadge(status: string) {
  return (
    <Badge
      variant={
        status === "active"
          ? "secondary"
          : status === "archived"
            ? "outline"
            : "destructive"
      }
    >
      {status[0]?.toUpperCase()}
      {status.slice(1)}
    </Badge>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function VendorStatusControl({
  vendor,
  pending,
  onApply,
}: {
  vendor: ManagedVendor
  pending: boolean
  onApply: (status: VendorStatus) => void
}) {
  const [status, setStatus] = useState<VendorStatus>(vendor.status)

  return (
    <div className="flex gap-2">
      <select
        className={selectClass}
        value={status}
        aria-label={`Status for ${vendor.name_en}`}
        onChange={(event) => setStatus(event.target.value as VendorStatus)}
      >
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="archived">Archived</option>
      </select>
      <Button
        variant="outline"
        disabled={pending || status === vendor.status}
        onClick={() => onApply(status)}
      >
        Apply
      </Button>
    </div>
  )
}

export function AdminVendorConsole({
  locale,
  session,
  provisioningConfigured,
  vendorProvisioningEnabled,
  tenant,
  vendors,
  accounts,
  auditEvents,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const normalizedSearch = search.trim().toLowerCase()
  const filteredVendors = vendors.filter((vendor) =>
    `${vendor.name_en} ${vendor.name_cn} ${vendor.sector} ${vendor.vendor_type}`
      .toLowerCase()
      .includes(normalizedSearch)
  )
  const activeAccounts = accounts.filter((account) => account.active).length

  function runAction(
    action: () => Promise<ManagementActionResult>,
    message: string
  ) {
    startTransition(async () => {
      const result = await action()

      if (result.ok) {
        toast.success(message)
        router.refresh()
      } else {
        toast.error(result.error ?? "Action failed.")
      }
    })
  }

  return (
    <main className="min-h-svh bg-muted/20">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge>Admin tenant</Badge>
              {statusBadge(tenant.status)}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {tenant.name} Vendor management
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              This directory is restricted by RLS to your tenant. Other Admins
              and their Vendors are not queryable from this workspace.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href={`/${locale}/admin`}>Back to operations</Link>
            </Button>
            <TenantProfileDialog
              locale={locale}
              tenantId={tenant.id}
              initialName={tenant.name}
              initialSupportEmail={tenant.support_email}
              initialPrimaryColor={tenant.primary_color}
              initialLogoUrl={tenant.logo_url}
              triggerLabel="Tenant settings"
            />
            <AdminVendorProvision
              locale={locale}
              adminId={tenant.id}
              disabled={
                !provisioningConfigured || !vendorProvisioningEnabled
              }
            />
          </div>
        </header>

        {!provisioningConfigured || !vendorProvisioningEnabled ? (
          <Alert>
            <HugeiconsIcon icon={ShieldUserIcon} />
            <AlertTitle>Trusted Auth administration is not configured</AlertTitle>
            <AlertDescription>
              Vendor directory updates remain available. Account creation
              requires both the server-only Supabase secret and the platform
              provisioning permission; suspension and restoration require the
              secret.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardDescription>Tenant Vendors</CardDescription>
                <CardTitle className="mt-1 text-2xl">{vendors.length}</CardTitle>
              </div>
              <HugeiconsIcon icon={Building01Icon} />
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardDescription>Delegation / Partner</CardDescription>
                <CardTitle className="mt-1 text-2xl">
                  {
                    vendors.filter(
                      (vendor) => vendor.vendor_type === "delegation"
                    ).length
                  }{" "}
                  /{" "}
                  {
                    vendors.filter(
                      (vendor) => vendor.vendor_type === "partner"
                    ).length
                  }
                </CardTitle>
              </div>
              <HugeiconsIcon icon={UserGroupIcon} />
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardDescription>Active Vendor accounts</CardDescription>
                <CardTitle className="mt-1 text-2xl">
                  {activeAccounts} / {accounts.length}
                </CardTitle>
              </div>
              <HugeiconsIcon icon={ShieldUserIcon} />
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="vendors">
          <div className="overflow-x-auto pb-1">
            <TabsList className="min-w-max">
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="audit">Tenant audit</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="vendors">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Vendor directory</CardTitle>
                <CardDescription>
                  Edit profiles and control company access within this tenant.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Input
                  placeholder="Search Vendors"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Subtype</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead>Accounts</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Controls</TableHead>
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
                            <Badge variant="outline">
                              {vendor.vendor_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{vendor.sector}</TableCell>
                          <TableCell>
                            {
                              accounts.filter(
                                (account) =>
                                  account.vendor_company_id === vendor.id
                              ).length
                            }
                          </TableCell>
                          <TableCell>{statusBadge(vendor.status)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <VendorDirectoryDialog
                                locale={locale}
                                vendor={vendor}
                              />
                              <VendorStatusControl
                                vendor={vendor}
                                pending={pending}
                                onApply={(status) =>
                                  runAction(
                                    () =>
                                      setVendorStatusAction({
                                        locale,
                                        vendorId: vendor.id,
                                        status,
                                      }),
                                    "Vendor status updated."
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
                <div className="grid gap-3 md:hidden">
                  {filteredVendors.map((vendor) => (
                    <Card key={vendor.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-sm">
                              {vendor.name_en}
                            </CardTitle>
                            <CardDescription>
                              {vendor.vendor_type} · {vendor.sector}
                            </CardDescription>
                          </div>
                          {statusBadge(vendor.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="grid gap-2">
                        <VendorDirectoryDialog
                          locale={locale}
                          vendor={vendor}
                        />
                        <VendorStatusControl
                          vendor={vendor}
                          pending={pending}
                          onApply={(status) =>
                            runAction(
                              () =>
                                setVendorStatusAction({
                                  locale,
                                  vendorId: vendor.id,
                                  status,
                                }),
                              "Vendor status updated."
                            )
                          }
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <CardTitle>Vendor accounts</CardTitle>
                <CardDescription>
                  Suspension immediately closes RLS access, including stale JWTs.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {account.display_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {account.email} ·{" "}
                        {vendors.find(
                          (vendor) =>
                            vendor.id === account.vendor_company_id
                        )?.name_en ?? "Unknown Vendor"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(account.active ? "active" : "suspended")}
                      <Button
                        className="flex-1 sm:flex-none"
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
                        className="flex-1 sm:flex-none"
                        variant={account.active ? "destructive" : "outline"}
                        disabled={pending || !provisioningConfigured}
                        onClick={() =>
                          runAction(
                            () =>
                              setAccountActiveAction({
                                locale,
                                userId: account.id,
                                active: !account.active,
                              }),
                            account.active
                              ? "Vendor account suspended."
                              : "Vendor account restored."
                          )
                        }
                      >
                        {account.active ? "Suspend" : "Restore"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Tenant audit history</CardTitle>
                <CardDescription>
                  Privileged changes visible only within this Admin tenant.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {auditEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col gap-2 rounded-md border p-3 text-xs sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {event.action.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{event.target_table}</span>
                      <span className="break-all text-muted-foreground">
                        {event.target_id ?? "—"}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {formatDate(event.created_at)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground">
          Signed in as {session.displayName} · {session.email}
        </p>
      </div>
    </main>
  )
}
