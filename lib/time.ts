const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

const DEADLINE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

const FULL_DEADLINE_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

// e.g. "Dec 5, 05:00 PM"
export function formatDeadline(date: Date): string {
  // newer ICU versions put a narrow no-break space before AM/PM
  return DEADLINE_FORMAT.format(date).replace(/\u202f/g, " ")
}

// e.g. "1d 4h", "4h 42m", or "Overdue" once the deadline has passed
export function formatTimeLeft(deadline: Date, now: Date = new Date()): string {
  const ms = deadline.getTime() - now.getTime()

  if (ms <= 0) return "Overdue"

  if (ms >= DAY_MS) {
    const days = Math.floor(ms / DAY_MS)
    const hours = Math.floor((ms % DAY_MS) / HOUR_MS)
    return `${days}d ${hours}h`
  }

  const hours = Math.floor(ms / HOUR_MS)
  const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS)
  return `${hours}h ${minutes}m`
}

// e.g. "Fri, Dec 5, 2025, 05:00 PM"
export function formatFullDeadline(date: Date): string {
  return FULL_DEADLINE_FORMAT.format(date).replace(/ /g, " ")
}

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"}`
}

// e.g. "2 days remaining", "17 hours remaining", "42 minutes remaining", or
// "Overdue" once the deadline has passed; only the largest unit is shown
export function formatTimeRemaining(
  deadline: Date,
  now: Date = new Date(),
): string {
  const ms = deadline.getTime() - now.getTime()

  if (ms <= 0) return "Overdue"

  if (ms >= DAY_MS) return `${plural(Math.floor(ms / DAY_MS), "day")} remaining`
  if (ms >= HOUR_MS) {
    return `${plural(Math.floor(ms / HOUR_MS), "hour")} remaining`
  }
  return `${plural(Math.max(1, Math.floor(ms / MINUTE_MS)), "minute")} remaining`
}
