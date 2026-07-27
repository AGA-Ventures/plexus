"use client"

import { type FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { updateVendorDirectoryAction } from "@/app/actions/management"
import type { Locale } from "@/lib/i18n"
import type { ManagedVendor } from "@/lib/management-data"
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

export function VendorDirectoryDialog({
  locale,
  vendor,
}: {
  locale: Locale
  vendor: ManagedVendor
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

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
      })

      if (result.ok) {
        toast.success("Vendor profile updated.")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error ?? "Unable to update the Vendor.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Vendor profile</DialogTitle>
          <DialogDescription>
            The Vendor subtype and tenant binding use separate privileged
            workflows and cannot be changed here.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-1.5">
            <Label htmlFor={`vendorNameEn-${vendor.id}`}>Company name</Label>
            <Input
              id={`vendorNameEn-${vendor.id}`}
              name="nameEn"
              defaultValue={vendor.name_en}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`vendorNameCn-${vendor.id}`}>Chinese name</Label>
            <Input
              id={`vendorNameCn-${vendor.id}`}
              name="nameCn"
              defaultValue={vendor.name_cn}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`vendorSector-${vendor.id}`}>Sector</Label>
            <Input
              id={`vendorSector-${vendor.id}`}
              name="sector"
              defaultValue={vendor.sector}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save Vendor profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
