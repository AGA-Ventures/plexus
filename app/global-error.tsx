"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          margin: 0,
          background: "#08090a",
          color: "#fff",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Something went wrong</h1>
          <p style={{ color: "#a1a1aa", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            The Plexus Connect portal hit an unexpected error. Your data is safe. Try again, or
            contact the event administration team if this keeps happening.
          </p>
          {error.digest ? (
            <p style={{ color: "#52525b", fontSize: "0.75rem", marginBottom: "1.5rem" }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              background: "#00859a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
