import { describe, it, expect } from "vitest"
import { formatDeadline, formatTimeLeft } from "@/lib/time"

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
