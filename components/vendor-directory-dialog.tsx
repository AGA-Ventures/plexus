"use client"

import { type FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { updateVendorDirectoryAction } from "@/app/actions/management"
import type { Locale } from "@/lib/i18n"
import type { ManagedAccount, ManagedVendor } from "@/lib/management-data"
import type { PartnerType } from "@/lib/vendor-directory"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IndustrySectorCombobox } from "@/components/industry-sector-combobox"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function VendorDirectoryDialog({
  locale,
  vendor,
  accounts,
  accountEditingEnabled,
}: {
  locale: Locale
  vendor: ManagedVendor
  accounts: ManagedAccount[]
  accountEditingEnabled: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts[0]?.id ?? ""
  )
  const [partnerType, setPartnerType] = useState(vendor.partner_type)
  const [pending, startTransition] = useTransition()
  const selectedAccount =
    accounts.find((account) => account.id === selectedAccountId) ?? accounts[0]

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await updateVendorDirectoryAction({
        locale,
        vendorId: vendor.id,
        vendorType: vendor.vendor_type,
        nameEn: form.get("nameEn"),
        nameCn: form.get("nameCn"),
        sector: form.get("sector"),
        companySize: form.get("companySize"),
        contactName: form.get("contactName"),
        contactDetails: form.get("contactDetails"),
        origin: form.get("origin") ?? "",
        partnerType: form.get("partnerType") ?? "Enterprise",
        description: form.get("description"),
        coordinator: form.get("coordinator") ?? "",
        accountId:
          accountEditingEnabled && selectedAccount ? selectedAccount.id : null,
        accountDisplayName:
          accountEditingEnabled && selectedAccount
            ? form.get("accountDisplayName")
            : "",
        accountEmail:
          accountEditingEnabled && selectedAccount
            ? form.get("accountEmail")
            : "",
      })

      if (result.ok) {
        toast.success(
          selectedAccount && accountEditingEnabled
            ? "Vendor profile and login account updated."
            : "Vendor profile updated."
        )
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error ?? "Unable to update the Vendor.")
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          setSelectedAccountId(accounts[0]?.id ?? "")
          setPartnerType(vendor.partner_type)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Edit profile</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Vendor profile</DialogTitle>
          <DialogDescription>
            Update company, contact, and linked login details. Vendor subtype
            and tenant binding remain protected by separate privileged
            workflows.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <section className="grid gap-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-medium">Company details</h3>
                <p className="text-xs text-muted-foreground">
                  Information shown across the tenant directory and Vendor
                  workspace.
                </p>
              </div>
              <Badge variant="outline">
                {vendor.vendor_type === "delegation" ? "Delegation" : "Partner"}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor={`vendorNameEn-${vendor.id}`}>
                  Company name
                </Label>
                <Input
                  id={`vendorNameEn-${vendor.id}`}
                  name="nameEn"
                  defaultValue={vendor.name_en}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`vendorNameCn-${vendor.id}`}>
                  Chinese name
                </Label>
                <Input
                  id={`vendorNameCn-${vendor.id}`}
                  name="nameCn"
                  defaultValue={vendor.name_cn}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`vendorSector-${vendor.id}`}>Sector</Label>
                <IndustrySectorCombobox
                  id={`vendorSector-${vendor.id}`}
                  name="sector"
                  defaultValue={vendor.sector}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`vendorSize-${vendor.id}`}>Company size</Label>
                <Input
                  id={`vendorSize-${vendor.id}`}
                  name="companySize"
                  defaultValue={vendor.company_size}
                  required
                />
              </div>
            </div>

            {vendor.vendor_type === "delegation" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor={`vendorOrigin-${vendor.id}`}>Origin</Label>
                  <Input
                    id={`vendorOrigin-${vendor.id}`}
                    name="origin"
                    defaultValue={vendor.origin}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`vendorCoordinator-${vendor.id}`}>
                    AGA coordinator
                  </Label>
                  <Input
                    id={`vendorCoordinator-${vendor.id}`}
                    name="coordinator"
                    defaultValue={vendor.coordinator}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-1.5">
                <Label htmlFor={`vendorPartnerType-${vendor.id}`}>
                  Partner type
                </Label>
                <Select
                  value={partnerType}
                  onValueChange={(value) =>
                    setPartnerType(value as PartnerType)
                  }
                >
                  <SelectTrigger
                    id={`vendorPartnerType-${vendor.id}`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Government">Government</SelectItem>
                    <SelectItem value="Association">Association</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="partnerType" value={partnerType} />
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor={`vendorDescription-${vendor.id}`}>
                {vendor.vendor_type === "delegation"
                  ? "Cooperation needs"
                  : "Key offerings"}
              </Label>
              <Textarea
                id={`vendorDescription-${vendor.id}`}
                name="description"
                defaultValue={
                  vendor.vendor_type === "delegation"
                    ? vendor.needs
                    : vendor.offerings
                }
                rows={4}
              />
            </div>
          </section>

          <section className="grid gap-3 rounded-lg border p-4">
            <div>
              <h3 className="text-sm font-medium">Primary contact</h3>
              <p className="text-xs text-muted-foreground">
                Business contact information; this can differ from the login
                account.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor={`vendorContact-${vendor.id}`}>
                  Contact name
                </Label>
                <Input
                  id={`vendorContact-${vendor.id}`}
                  name="contactName"
                  defaultValue={vendor.contact}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`vendorContactDetails-${vendor.id}`}>
                  Contact details
                </Label>
                <Input
                  id={`vendorContactDetails-${vendor.id}`}
                  name="contactDetails"
                  defaultValue={vendor.contact_meta}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-3 rounded-lg border p-4">
            <div>
              <h3 className="text-sm font-medium">Login account</h3>
              <p className="text-xs text-muted-foreground">
                Update the person who signs in for this Vendor. Changing the
                email changes their next login but does not change the password.
              </p>
            </div>

            {accounts.length > 1 ? (
              <div className="grid gap-1.5">
                <Label htmlFor={`vendorAccount-${vendor.id}`}>
                  Account to edit
                </Label>
                <Select
                  value={selectedAccount?.id}
                  onValueChange={setSelectedAccountId}
                >
                  <SelectTrigger
                    id={`vendorAccount-${vendor.id}`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.display_name} · {account.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {selectedAccount ? (
              <div
                key={selectedAccount.id}
                className="grid gap-3 sm:grid-cols-2"
              >
                <div className="grid gap-1.5">
                  <Label htmlFor={`vendorAccountName-${vendor.id}`}>
                    Account holder
                  </Label>
                  <Input
                    id={`vendorAccountName-${vendor.id}`}
                    name="accountDisplayName"
                    defaultValue={selectedAccount.display_name}
                    disabled={!accountEditingEnabled}
                    required={accountEditingEnabled}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`vendorAccountEmail-${vendor.id}`}>
                    Login email
                  </Label>
                  <Input
                    id={`vendorAccountEmail-${vendor.id}`}
                    name="accountEmail"
                    type="email"
                    defaultValue={selectedAccount.email}
                    disabled={!accountEditingEnabled}
                    required={accountEditingEnabled}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                No login account is linked to this company. Saving will update
                the company only; use Provision Vendor account to create
                authenticated access.
              </div>
            )}

            {selectedAccount && !accountEditingEnabled ? (
              <p className="text-xs text-amber-600">
                Login editing is unavailable until trusted Auth administration
                is configured.
              </p>
            ) : null}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Profile completion</span>
            <Badge variant="secondary">{vendor.profile_complete}%</Badge>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save Vendor and account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
