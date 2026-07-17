import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

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

export function ShowcaseVideo({
  src,
  poster,
}: {
  src: string
  poster: string
}) {
  return (
    <div className={styles.videoFrame}>
      <video
        className={styles.videoPlayer}
        controls
        playsInline
        preload="metadata"
        poster={poster}
        aria-label="PLEXUS introduction video"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support MP4 video playback.
      </video>
    </div>
  )
}
