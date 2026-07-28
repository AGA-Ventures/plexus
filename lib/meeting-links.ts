// A stored meeting link freezes whichever origin created it, so a meeting
// created on a development server would otherwise hand out a localhost URL
// forever — including to Vendors. The slug is the identity of a protected
// link, so it is resolved against the origin the viewer is actually on.
// Legacy external links (seeded Zoom/VooV rows) are returned untouched.

const PROTECTED_PATH_PATTERN = /^\/m\/[^/]+$/
const PARSE_BASE = "http://protected.invalid"

export function getProtectedMeetingPath(link?: string) {
  if (!link) {
    return null
  }

  try {
    const { pathname } = new URL(link, PARSE_BASE)

    return PROTECTED_PATH_PATTERN.test(pathname) ? pathname : null
  } catch {
    return null
  }
}

/**
 * Safe during server rendering: a protected link becomes a relative path, which
 * the browser resolves against whichever host is serving the page.
 */
export function toMeetingHref(link?: string) {
  return getProtectedMeetingPath(link) ?? link
}

/**
 * Absolute link for copying and calendar exports. Pass the live origin —
 * `window.location.origin` in the browser.
 */
export function toShareableMeetingLink(
  link: string | undefined,
  origin: string
) {
  const path = getProtectedMeetingPath(link)

  if (!path) {
    return link
  }

  try {
    return new URL(path, origin).toString()
  } catch {
    return link
  }
}
