import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { TimeRange } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Number of days each dashboard time range covers. */
export const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
}

/** Human readable label for a dashboard time range. */
export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "1y": "Last year",
}

/**
 * Resolve an untrusted value to a supported time range.
 *
 * Anything unknown falls back to the default range instead of failing the
 * request - the query string is user input.
 */
export function parseTimeRange(
  value: string | null | undefined,
  fallback: TimeRange = "30d",
): TimeRange {
  if (value && value in TIME_RANGE_DAYS) return value as TimeRange
  return fallback
}

/**
 * Format a completion trend bucket as an axis label.
 *
 * A week reads best as weekday names, a year as month names - anything
 * longer needs the date so the buckets stay distinguishable.
 */
export function formatTrendLabel(date: Date, range: TimeRange): string {
  if (range === "7d") {
    return date.toLocaleDateString("en-US", { weekday: "short" })
  }
  if (range === "1y") {
    return date.toLocaleDateString("en-US", { month: "short" })
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

/**
 * Midnight at the start of tomorrow, in the viewer's local time.
 *
 * Used as the earliest selectable due date: a task cannot be due today or in
 * the past, and comparing against tomorrow's start means a time later today
 * cannot slip through the check.
 */
export function startOfTomorrow(): Date {
  const date = new Date()
  date.setHours(24, 0, 0, 0)
  return date
}

/**
 * Convert a Date to UTC midnight (start of day in UTC).
 *
 * Guarantees the returned Date has no time-zone shift when the server
 * interprets it — all `getUTC*` methods return 0 for hour/minute/second/ms.
 *
 * Used so task `dueDate` / `reminderDate` comparisons are consistent
 * regardless of the user's local time zone.
 */
export function toUtcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0
    )
  )
}
