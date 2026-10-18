import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
