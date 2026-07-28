export type MeetingCountdownPhase = "before" | "live" | "ended"

export type MeetingCountdown = {
  phase: MeetingCountdownPhase
  /**
   * Milliseconds until the start while `before`, until the end while `live`,
   * and since the end once `ended`. Never negative.
   */
  ms: number
}

export type CountdownParts = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function getMeetingCountdown(input: {
  now: number
  startsAt: number
  durationMinutes: number
}): MeetingCountdown | null {
  if (!Number.isFinite(input.startsAt) || !Number.isFinite(input.now)) {
    return null
  }

  const durationMs =
    Math.max(
      0,
      Number.isFinite(input.durationMinutes) ? input.durationMinutes : 0
    ) *
    60 *
    1000
  const endsAt = input.startsAt + durationMs

  if (input.now < input.startsAt) {
    return { phase: "before", ms: input.startsAt - input.now }
  }

  // The end instant still counts as live so a meeting does not read as over
  // while its final second is on screen.
  if (input.now <= endsAt) {
    return { phase: "live", ms: endsAt - input.now }
  }

  return { phase: "ended", ms: input.now - endsAt }
}

export function splitCountdown(ms: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  }
}

/**
 * The two most significant units, so the value stays readable at every scale:
 * `3d 4h`, `2h 15m`, `45m 30s`, `30s`.
 */
export function formatCountdown(
  ms: number,
  units: { day: string; hour: string; minute: string; second: string }
) {
  const { days, hours, minutes, seconds } = splitCountdown(ms)

  if (days > 0) {
    return `${days}${units.day} ${hours}${units.hour}`
  }

  if (hours > 0) {
    return `${hours}${units.hour} ${minutes}${units.minute}`
  }

  if (minutes > 0) {
    return `${minutes}${units.minute} ${seconds}${units.second}`
  }

  return `${seconds}${units.second}`
}
