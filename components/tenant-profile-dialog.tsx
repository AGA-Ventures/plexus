"use client"

import { type FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { updateTenantProfileAction } from "@/app/actions/management"
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

export function TenantProfileDialog({
  locale,
  tenantId,
  initialName = "",
  initialSupportEmail = "",
  initialPrimaryColor = "#16839a",
  initialLogoUrl = "",
  triggerLabel = "Edit",
}: {
  locale: Locale
  tenantId: string
  initialName?: string
  initialSupportEmail?: string
  initialPrimaryColor?: string
  initialLogoUrl?: string
  triggerLabel?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await updateTenantProfileAction({
        locale,
        tenantId,
        name: form.get("name"),
        supportEmail: form.get("supportEmail"),
        primaryColor: form.get("primaryColor"),
        logoUrl: form.get("logoUrl"),
      })

      if (result.ok) {
        toast.success("Admin tenant profile updated.")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error ?? "Unable to update the tenant.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Admin tenant profile</DialogTitle>
          <DialogDescription>
            Update the tenant-facing name, support contact, and login branding.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-1.5">
            <Label htmlFor={`tenantName-${tenantId}`}>Tenant name</Label>
            <Input
              id={`tenantName-${tenantId}`}
              name="name"
              defaultValue={initialName}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`tenantSupport-${tenantId}`}>Support email</Label>
            <Input
              id={`tenantSupport-${tenantId}`}
              name="supportEmail"
              type="email"
              defaultValue={initialSupportEmail}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`tenantLogo-${tenantId}`}>Login logo URL</Label>
            <Input
              id={`tenantLogo-${tenantId}`}
              name="logoUrl"
              type="text"
              inputMode="url"
              placeholder="https://example.com/logo.png"
              defaultValue={initialLogoUrl}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`tenantColor-${tenantId}`}>Primary color</Label>
            <Input
              id={`tenantColor-${tenantId}`}
              name="primaryColor"
              type="color"
              defaultValue={initialPrimaryColor}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save tenant profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
