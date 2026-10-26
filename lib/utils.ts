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
 * Routes that make up the signed-in app.
 *
 * These are the destinations of the mobile bottom tab bar. On phones the top
 * navigation also drops its hamburger menu here, because the tab bar replaces
 * it.
 */
export const APP_NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/task", label: "Tasks" },
  { href: "/subscription", label: "Subscription" },
  { href: "/settings", label: "Profile" },
] as const

export type AppNavHref = (typeof APP_NAV_ITEMS)[number]["href"]

/** True for an app route, including anything nested under it. */
export function isAppRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return APP_NAV_ITEMS.some(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  )
}

/**
 * Public marketing pages.
 *
 * These keep the website chrome (navbar links and footer). Auth screens and
 * the signed-in app are app-like, and the native shell never shows these
 * routes at all - the proxy boots it into onboarding or the dashboard.
 */
export const WEBSITE_ROUTES = ["/", "/about", "/pricing", "/contact"] as const

/** True for a public marketing page, as opposed to an auth or app screen. */
export function isWebsiteRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return (WEBSITE_ROUTES as readonly string[]).includes(pathname)
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
