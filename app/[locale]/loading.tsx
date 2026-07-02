export default function LocaleLoading() {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="hidden h-[480px] animate-pulse rounded-md bg-muted lg:block" />
          <div className="flex flex-col gap-4">
            <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-28 animate-pulse rounded-md bg-muted" />
              <div className="h-28 animate-pulse rounded-md bg-muted" />
              <div className="h-28 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="h-64 w-full animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading workspace…</span>
    </main>
  )
}
