import { describe, it, expect } from "vitest"
import {
  formatDeadline,
  formatFullDeadline,
  formatTimeLeft,
  formatTimeRemaining,
} from "@/lib/time"

const now = new Date("2025-12-05T12:00:00Z")
const inMs = (ms: number) => new Date(now.getTime() + ms)
const MINUTE = 60_000
const HOUR = 60 * MINUTE

describe("formatTimeLeft", () => {
  it("returns Overdue for a past deadline", () => {
    expect(formatTimeLeft(inMs(-HOUR), now)).toBe("Overdue")
  })

  it("returns Overdue when the deadline is exactly now", () => {
    expect(formatTimeLeft(now, now)).toBe("Overdue")
  })

  it("shows 0h and the minutes when under an hour", () => {
    expect(formatTimeLeft(inMs(42 * MINUTE), now)).toBe("0h 42m")
  })

  it("shows hours and minutes when under a day", () => {
    expect(formatTimeLeft(inMs(4 * HOUR + 42 * MINUTE), now)).toBe("4h 42m")
  })

  it("shows days and hours from a day up", () => {
    expect(formatTimeLeft(inMs(24 * HOUR), now)).toBe("1d 0h")
    expect(formatTimeLeft(inMs(50 * HOUR + 30 * MINUTE), now)).toBe("2d 2h")
  })
})

describe("formatDeadline", () => {
  it("formats a short date and time in en-US", () => {
    const date = new Date(2025, 11, 5, 17, 0)

    expect(formatDeadline(date)).toBe("Dec 5, 05:00 PM")
  })
})

describe("formatTimeRemaining", () => {
  const DAY = 24 * HOUR

  it("returns Overdue once the deadline has passed", () => {
    expect(formatTimeRemaining(inMs(-HOUR), now)).toBe("Overdue")
    expect(formatTimeRemaining(now, now)).toBe("Overdue")
  })

  it("uses minutes when under an hour", () => {
    expect(formatTimeRemaining(inMs(42 * MINUTE), now)).toBe(
      "42 minutes remaining",
    )
    expect(formatTimeRemaining(inMs(MINUTE), now)).toBe("1 minute remaining")
  })

  it("uses whole hours when under a day", () => {
    expect(formatTimeRemaining(inMs(17 * HOUR + 40 * MINUTE), now)).toBe(
      "17 hours remaining",
    )
    expect(formatTimeRemaining(inMs(HOUR), now)).toBe("1 hour remaining")
  })

  it("uses whole days from a day up", () => {
    expect(formatTimeRemaining(inMs(DAY + 5 * HOUR), now)).toBe(
      "1 day remaining",
    )
    expect(formatTimeRemaining(inMs(2 * DAY), now)).toBe("2 days remaining")
  })
})

describe("formatFullDeadline", () => {
  it("includes the weekday and year", () => {
    expect(formatFullDeadline(new Date(2026, 0, 31, 9, 27))).toBe(
      "Sat, Jan 31, 2026, 09:27 AM",
    )
  })
})
