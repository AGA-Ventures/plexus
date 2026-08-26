"use client"

import { useState, type ReactNode } from "react"
import { Menu01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export type WorkspaceNavigationSurface = "desktop" | "mobile"

type WorkspaceNavigationShellProps = {
  desktopBrand: ReactNode
  mobileBrand: ReactNode
  sheetBrand: ReactNode
  navigationLabel: string
  menuLabel: string
  activeLabel: string
  sheetTitle: string
  desktopClassName?: string
  renderNavigation: (
    surface: WorkspaceNavigationSurface,
    closeMobile: () => void
  ) => ReactNode
  desktopFooter?: ReactNode
  mobileFooter?: ReactNode
}

export function WorkspaceNavigationShell({
  desktopBrand,
  mobileBrand,
  sheetBrand,
  navigationLabel,
  menuLabel,
  activeLabel,
  sheetTitle,
  desktopClassName,
  renderNavigation,
  desktopFooter,
  mobileFooter,
}: WorkspaceNavigationShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <>
      <aside
        data-testid="workspace-navigation-shell"
        className={`hidden self-stretch lg:block ${desktopClassName ?? ""}`}
      >
        <div className="sticky top-4 flex min-h-[calc(100svh-12rem)] flex-col rounded-xl border border-sidebar-border bg-sidebar p-3 text-sidebar-foreground shadow-[0_18px_42px_rgba(7,19,38,0.12)]">
          <div className="mb-3 rounded-lg border border-white/10 bg-white/6 px-3 py-3">
            {desktopBrand}
          </div>
          {renderNavigation("desktop", () => undefined)}
          {desktopFooter}
        </div>
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <div
          data-testid="workspace-mobile-header"
          className="sticky top-3 z-30 flex min-h-16 items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar/95 p-2.5 text-sidebar-foreground shadow-sm backdrop-blur-sm lg:hidden"
        >
          <div className="min-w-0 flex-1 px-1.5">{mobileBrand}</div>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 shrink-0 gap-2 border-white/14 bg-[#0758c8] px-3.5 text-sm text-white hover:bg-[#064caf] hover:text-white"
              aria-label={`${menuLabel}: ${activeLabel}`}
            >
              <HugeiconsIcon
                icon={Menu01Icon}
                strokeWidth={1.8}
                className="size-4"
              />
              {menuLabel}
            </Button>
          </SheetTrigger>
        </div>

        <SheetContent
          side="left"
          className="border-sidebar-border bg-sidebar p-0 text-sidebar-foreground data-[side=left]:w-[calc(100vw-1.5rem)] data-[side=left]:max-w-[24rem]"
        >
          <SheetHeader className="border-b border-sidebar-border px-5 py-5">
            <SheetTitle className="sr-only">{sheetTitle}</SheetTitle>
            <SheetDescription asChild>{sheetBrand}</SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              <p className="mb-2.5 px-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {navigationLabel}
              </p>
              {renderNavigation("mobile", () => setMobileNavOpen(false))}
            </div>
            {mobileFooter ? (
              <div className="border-t border-sidebar-border p-3 pt-0">
                {mobileFooter}
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
