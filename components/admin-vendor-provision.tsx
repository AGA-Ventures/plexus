"use client"

import { type FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { AddIcon } from "@hugeicons/core-free-icons"
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

const selectClass =
  "h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"

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
  const [pending, startTransition] = useTransition()

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
    <Dialog open={open} onOpenChange={setOpen}>
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
            <div className="grid gap-1.5">
              <Label htmlFor="adminVendorType">Vendor subtype</Label>
              <select
                id="adminVendorType"
                name="vendorType"
                className={selectClass}
                required
              >
                <option value="delegation">Delegation</option>
                <option value="partner">Partner</option>
              </select>
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
