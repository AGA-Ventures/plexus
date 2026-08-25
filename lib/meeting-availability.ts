const KUALA_LUMPUR_OFFSET = "+08:00"
const DEFAULT_OPEN_DATE_COUNT = 5
const MAX_DATE_SEARCH_DAYS = 90

export const meetingWeekdays = ["1", "2", "3", "4", "5"] as const
export const meetingTimeOptions = [
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
] as const

export type MeetingWeekday = (typeof meetingWeekdays)[number]
export type MeetingTimeOption = (typeof meetingTimeOptions)[number]
export type MeetingAvailability = Record<MeetingWeekday, MeetingTimeOption[]>

export const defaultMeetingAvailability: MeetingAvailability = {
  "1": ["10:00", "11:00", "14:00", "15:00"],
  "2": ["10:00", "11:00", "14:00", "15:00"],
  "3": ["10:00", "11:00", "14:00", "15:00"],
  "4": ["10:00", "11:00", "14:00", "15:00"],
  "5": ["10:00", "11:00", "14:00", "15:00"],
}

function cloneDefaultMeetingAvailability(): MeetingAvailability {
  return Object.fromEntries(
    meetingWeekdays.map((weekday) => [
      weekday,
      [...defaultMeetingAvailability[weekday]],
    ])
  ) as MeetingAvailability
}

export function normalizeMeetingAvailability(
  value: unknown
): MeetingAvailability {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return cloneDefaultMeetingAvailability()
  }

  const source = value as Record<string, unknown>

  return Object.fromEntries(
    meetingWeekdays.map((weekday) => {
      const rawTimes = source[weekday]
      const times = Array.isArray(rawTimes)
        ? rawTimes.filter(
            (time): time is MeetingTimeOption =>
              typeof time === "string" &&
              meetingTimeOptions.includes(time as MeetingTimeOption)
          )
        : []

      return [
        weekday,
        [...new Set(times)].sort((left, right) => left.localeCompare(right)),
      ]
    })
  ) as MeetingAvailability
}

function kualaLumpurDateParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kuala_Lumpur",
  }).formatToParts(now)

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  }
}

function isoDate(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-")
}

function weekdayForIsoDate(date: string): MeetingWeekday | undefined {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay().toString()

  return meetingWeekdays.includes(weekday as MeetingWeekday)
    ? (weekday as MeetingWeekday)
    : undefined
}

export function getMeetingDateOptions(
  availability: MeetingAvailability,
  now = new Date(),
  dateCount = DEFAULT_OPEN_DATE_COUNT
) {
  const { year, month, day } = kualaLumpurDateParts(now)
  const cursor = new Date(Date.UTC(year, month - 1, day))
  const dates: string[] = []
  let searchedDays = 0

  while (dates.length < dateCount && searchedDays < MAX_DATE_SEARCH_DAYS) {
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    searchedDays += 1
    const date = isoDate(cursor)
    const weekday = weekdayForIsoDate(date)

    if (weekday && availability[weekday].length > 0) {
      dates.push(date)
    }
  }

  return dates
}

export function getMeetingTimeSlotsForDate(
  date: string,
  availability: MeetingAvailability,
  now = new Date()
) {
  const weekday = weekdayForIsoDate(date)

  if (!weekday) {
    return []
  }

  return availability[weekday]
    .map((time) => `${date}T${time}:00${KUALA_LUMPUR_OFFSET}`)
    .filter((slot) => new Date(slot).getTime() > now.getTime())
}

export function getMeetingSlotOptions(
  now = new Date(),
  openDateCount = DEFAULT_OPEN_DATE_COUNT,
  availability = defaultMeetingAvailability
) {
  return getMeetingDateOptions(availability, now, openDateCount).flatMap(
    (date) => getMeetingTimeSlotsForDate(date, availability, now)
  )
}

export function isMeetingSlotAvailable(
  value: string,
  availability: MeetingAvailability,
  now = new Date()
) {
  if (!/^\d{4}-\d{2}-\d{2}T(09|10|11|14|15|16):00:00\+08:00$/.test(value)) {
    return false
  }

  const date = value.slice(0, 10)

  return getMeetingTimeSlotsForDate(date, availability, now).includes(value)
}
