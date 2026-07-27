"use client"

import { type FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AddIcon,
  Building01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { createVendorAccountAction } from "@/app/actions/management"
import type { Locale } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
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

const vendorTypeOptions = [
  {
    value: "delegation",
    label: "Delegation",
    description: "Visiting business seeking Malaysian partners",
    icon: UserGroupIcon,
  },
  {
    value: "partner",
    label: "Partner",
    description: "Malaysian business receiving match opportunities",
    icon: Building01Icon,
  },
] as const

type VendorType = (typeof vendorTypeOptions)[number]["value"]

export function AdminVendorProvision({
  locale,
  adminId,
  disabled = false,
}: {
  locale: Locale
  adminId: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [vendorType, setVendorType] = useState<VendorType>("delegation")
  const [pending, startTransition] = useTransition()
  const selectedVendorType =
    vendorTypeOptions.find((option) => option.value === vendorType) ??
    vendorTypeOptions[0]

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await createVendorAccountAction({
        locale,
        adminId,
        vendorType: form.get("vendorType"),
        companyName: form.get("companyName"),
        companyNameCn: form.get("companyNameCn"),
        sector: form.get("sector"),
        displayName: form.get("displayName"),
        email: form.get("email"),
        temporaryPassword: form.get("temporaryPassword"),
      })

      if (result.ok) {
        toast.success("Vendor company and account created.")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error ?? "Unable to create the Vendor.")
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) setVendorType("delegation")
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <HugeiconsIcon icon={AddIcon} data-icon="inline-start" />
          Provision Vendor account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a Vendor in your tenant</DialogTitle>
          <DialogDescription>
            This account is permanently scoped to your Admin tenant unless a
            Superadmin performs an audited transfer.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor="adminVendorType">Vendor subtype</Label>
              <Select
                value={vendorType}
                onValueChange={(value) => setVendorType(value as VendorType)}
              >
                <SelectTrigger
                  id="adminVendorType"
                  className="h-auto min-h-12 w-full min-w-0 overflow-hidden px-3 py-2 text-left"
                >
                  <SelectValue>
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                        <HugeiconsIcon
                          icon={selectedVendorType.icon}
                          className="size-4"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-foreground">
                          {selectedVendorType.label}
                        </span>
                        <span className="block truncate text-[0.6875rem] leading-4 text-muted-foreground">
                          {selectedVendorType.description}
                        </span>
                      </span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  className="min-w-[min(22rem,calc(100vw-2rem))] p-1"
                >
                  {vendorTypeOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="min-h-14 py-2.5 pr-8"
                    >
                      <span className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/70 text-muted-foreground">
                          <HugeiconsIcon
                            icon={option.icon}
                            className="size-4"
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-medium text-foreground">
                            {option.label}
                          </span>
                          <span className="block text-[0.6875rem] leading-4 text-muted-foreground">
                            {option.description}
                          </span>
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="vendorType" value={vendorType} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="adminVendorSector">Sector</Label>
              <Input id="adminVendorSector" name="sector" required />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="adminCompanyName">Company name</Label>
              <Input id="adminCompanyName" name="companyName" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="adminCompanyNameCn">Chinese name</Label>
              <Input id="adminCompanyNameCn" name="companyNameCn" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="adminVendorName">Account holder</Label>
              <Input id="adminVendorName" name="displayName" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="adminVendorEmail">Email</Label>
              <Input id="adminVendorEmail" name="email" type="email" required />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="adminVendorPassword">Temporary password</Label>
            <Input
              id="adminVendorPassword"
              name="temporaryPassword"
              type="password"
              minLength={12}
              autoComplete="new-password"
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimum 12 characters. Share through an approved secure channel.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create Vendor and account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
