"use client"

import { type FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { updatePlatformSettingAction } from "@/app/actions/management"
import type { Locale } from "@/lib/i18n"
import type { PlatformSetting } from "@/lib/management-data"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

function serializeSettingValue(value: unknown) {
  return typeof value === "string"
    ? value
    : JSON.stringify(value, null, 2)
}

export function PlatformSettingEditor({
  locale,
  setting,
}: {
  locale: Locale
  setting: PlatformSetting
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await updatePlatformSettingAction({
        locale,
        settingId: setting.id,
        value: form.get("value"),
      })

      if (result.ok) {
        toast.success("Platform setting updated and audited.")
        setEditing(false)
        router.refresh()
      } else {
        toast.error(result.error ?? "Unable to update the setting.")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="break-all text-sm">
              {setting.setting_key}
            </CardTitle>
            <CardDescription className="mt-1">
              {setting.description}
            </CardDescription>
          </div>
          <Badge variant="outline">{setting.category}</Badge>
        </div>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent>
          {editing ? (
            <div className="grid gap-1.5">
              <Label htmlFor={`setting-${setting.id}`}>
                JSON or plain text value
              </Label>
              <Textarea
                id={`setting-${setting.id}`}
                name="value"
                defaultValue={serializeSettingValue(setting.value)}
                rows={5}
                required
              />
            </div>
          ) : (
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs">
              {serializeSettingValue(setting.value)}
            </pre>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          {editing ? (
            <>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save setting"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              Edit setting
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
