"use client"

import { type FormEvent, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ImageUploadIcon, SaveIcon, ViewIcon } from "@hugeicons/core-free-icons"
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
  const [uploading, setUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl)

  async function uploadLogo(file: File) {
    const formData = new FormData()
    formData.set("tenantId", tenantId)
    formData.set("file", file)
    setUploading(true)

    try {
      const response = await fetch("/api/tenant-branding/logo", {
        method: "POST",
        body: formData,
      })
      const payload = (await response.json()) as {
        error?: string
        logoUrl?: string
      }

      if (!response.ok || !payload.logoUrl) {
        throw new Error(payload.error ?? "Unable to upload the logo.")
      }

      setLogoUrl(payload.logoUrl)
      toast.success("Login logo uploaded.")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to upload the logo."
      )
    } finally {
      setUploading(false)
    }
  }

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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          setLogoUrl(initialLogoUrl)
        }
      }}
    >
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
          <div className="grid gap-2">
            <Label htmlFor={`tenantLogoUpload-${tenantId}`}>
              <span className="inline-flex items-center gap-1.5">
                <HugeiconsIcon icon={ImageUploadIcon} className="size-4" />
                Login logo
              </span>
            </Label>
            <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[88px_minmax(0,1fr)] sm:items-center">
              <div className="flex h-16 w-[88px] items-center justify-center overflow-hidden rounded-md border bg-background">
                {logoUrl ? (
                  // Tenant operators control this HTTPS or public-path image URL.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Current tenant login logo"
                    className="max-h-14 max-w-20 object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">No logo</span>
                )}
              </div>
              <div className="grid gap-2">
                <Input
                  id={`tenantLogoUpload-${tenantId}`}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploading || pending}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      void uploadLogo(file)
                    }
                    event.target.value = ""
                  }}
                />
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  {uploading
                    ? "Uploading and applying logo…"
                    : "PNG, JPEG, or WebP · maximum 2 MB. Uploads apply immediately."}
                </p>
              </div>
            </div>
            <details className="rounded-md border px-3 py-2">
              <summary className="cursor-pointer text-xs font-medium">
                Use an image URL instead
              </summary>
              <div className="mt-3 grid gap-1.5">
                <Label htmlFor={`tenantLogo-${tenantId}`}>Login logo URL</Label>
                <Input
                  id={`tenantLogo-${tenantId}`}
                  type="text"
                  inputMode="url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(event) => setLogoUrl(event.target.value)}
                />
              </div>
            </details>
          </div>
          <input type="hidden" name="logoUrl" value={logoUrl} />
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
          <p className="text-xs text-muted-foreground">
            Save name, support, color, or manual URL changes before previewing
            them.
          </p>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button asChild variant="outline">
              <Link
                href={`/${locale}/login-preview?tenantId=${tenantId}`}
                target="_blank"
                rel="noreferrer"
              >
                <HugeiconsIcon icon={ViewIcon} data-icon="inline-start" />
                Preview login page
              </Link>
            </Button>
            <Button type="submit" disabled={pending || uploading}>
              <HugeiconsIcon icon={SaveIcon} data-icon="inline-start" />
              {pending ? "Saving…" : "Save tenant profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
