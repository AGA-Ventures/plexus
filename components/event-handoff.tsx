"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

type EventHandoffProps = {
  onlineLabel: string
  onGroundLabel: string
}

export function EventHandoff({
  onlineLabel,
  onGroundLabel,
}: EventHandoffProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const root = rootRef.current

    if (!root) {
      return
    }

    let isIntersecting = false

    const syncMotion = () => {
      setIsActive(isIntersecting && document.visibilityState === "visible")
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting
        syncMotion()
      },
      { threshold: 0.45 }
    )

    observer.observe(root)
    document.addEventListener("visibilitychange", syncMotion)

    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", syncMotion)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="event-handoff grid items-center gap-0 sm:grid-cols-[1fr_auto_1fr] sm:gap-3"
      data-motion={isActive ? "active" : "idle"}
    >
      <div className="event-handoff-source rounded-xl bg-[#071326] px-4 py-5 text-center text-sm font-semibold sm:px-5">
        {onlineLabel}
      </div>

      <div
        aria-hidden="true"
        className="event-handoff-route relative mx-auto h-12 w-8 sm:h-7 sm:w-28"
      >
        <span className="event-handoff-track absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-[#c2fcff]/35 sm:top-1/2 sm:left-0 sm:h-px sm:w-full sm:translate-x-0 sm:-translate-y-1/2" />
        <span className="event-handoff-trace absolute top-0 left-1/2 h-full w-px origin-top -translate-x-1/2 bg-[#c2fcff] sm:top-1/2 sm:left-0 sm:h-px sm:w-full sm:origin-left sm:translate-x-0 sm:-translate-y-1/2" />
        <span className="event-handoff-signal absolute top-0 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-[#c2fcff] sm:top-1/2 sm:left-0 sm:-translate-y-1/2" />
        <span className="event-handoff-arrow absolute top-1/2 left-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#c2fcff]/65 bg-[#0758c8] text-[#c2fcff]">
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            strokeWidth={2}
            className="rotate-90 sm:rotate-0"
          />
        </span>
      </div>

      <div className="event-handoff-destination rounded-xl bg-white px-4 py-5 text-center text-sm font-semibold text-[#0758c8] sm:px-5">
        {onGroundLabel}
      </div>
    </div>
  )
}
