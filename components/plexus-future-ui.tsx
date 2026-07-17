import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlayIcon } from "@hugeicons/core-free-icons"

import styles from "./plexus-future-ui.module.css"

export function PlexusBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/app" className={styles.brand} aria-label="PLEXUS future app home">
      <Image
        src="/plexus-wordmark-transparent.png"
        alt="PLEXUS"
        width={2048}
        height={768}
        priority
        className={compact ? styles.brandCompact : styles.brandImage}
      />
    </Link>
  )
}

export function FutureButton({
  href,
  children,
  size = "large",
  tone = "primary",
}: {
  href: string
  children: ReactNode
  size?: "small" | "large"
  tone?: "primary" | "secondary"
}) {
  const className = `${styles.button} ${styles[size]} ${styles[tone]}`

  return href.startsWith("http") ? (
    <a href={href} className={className} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : href.startsWith("#") ? (
    <a href={href} className={className}>{children}</a>
  ) : (
    <Link href={href} className={className}>{children}</Link>
  )
}

export function UiLabel({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <span className={`${styles.label} ${muted ? styles.labelMuted : ""}`}>{children}</span>
}

export function UiSignal({ children }: { children: ReactNode }) {
  return <div className={styles.signal}>{children}</div>
}

export function ShowcaseVideoLink({
  href,
  poster,
}: {
  href: string
  poster: string
}) {
  return (
    <a className={styles.videoLink} href={href} aria-label="Play the PLEXUS app showcase video">
      <Image
        src={poster}
        alt="PLEXUS future app video preview"
        fill
        sizes="(max-width: 900px) 100vw, 58vw"
        className={styles.videoPoster}
      />
      <span className={styles.videoShade} />
      <span className={styles.playButton}>
        <HugeiconsIcon icon={PlayIcon} size={25} strokeWidth={1.8} />
      </span>
      <span className={styles.videoCaption}>
        <strong>PLEXUS app showcase</strong>
        <small>Video coming soon</small>
      </span>
    </a>
  )
}
