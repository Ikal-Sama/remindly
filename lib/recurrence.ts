/**
 * Recurrence rules for tasks.
 *
 * A task is either one-off (`recurrenceFrequency === null`) or repeats on a
 * schedule. The reminder cron advances a recurring task to its next occurrence
 * after each send, so the same row represents the "current" occurrence and the
 * schedule never needs a separate series/instance table.
 *
 * Dates in this app are stored at UTC midnight, so all arithmetic here is UTC
 * to stay consistent.
 */

export const RECURRENCE_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY"] as const;

export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

/** Widest allowed gap between occurrences (52 weeks/months). */
export const MAX_RECURRENCE_INTERVAL = 52;

export function isRecurrenceFrequency(
  value: string | null | undefined
): value is RecurrenceFrequency {
  return (
    value === "DAILY" || value === "WEEKLY" || value === "MONTHLY"
  );
}

/** Options for the "Repeat" select, including the one-off choice. */
export const RECURRENCE_OPTIONS: Array<{
  value: RecurrenceFrequency | "";
  label: string;
}> = [
  { value: "", label: "Does not repeat" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
];

const UNIT_LABEL: Record<RecurrenceFrequency, string> = {
  DAILY: "day",
  WEEKLY: "week",
  MONTHLY: "month",
};

/**
 * The date after `from` for a recurrence rule.
 *
 * `MONTHLY` clamps to the last day of the target month (Jan 31 + 1 month ->
 * Feb 28/29) rather than overflowing into March.
 */
export function getNextOccurrence(
  frequency: RecurrenceFrequency,
  interval: number,
  from: Date
): Date {
  const next = new Date(from.getTime());

  switch (frequency) {
    case "DAILY":
      next.setUTCDate(next.getUTCDate() + interval);
      break;
    case "WEEKLY":
      next.setUTCDate(next.getUTCDate() + interval * 7);
      break;
    case "MONTHLY": {
      const day = next.getUTCDate();
      next.setUTCDate(1);
      next.setUTCMonth(next.getUTCMonth() + interval);
      const lastDayOfMonth = new Date(
        Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)
      ).getUTCDate();
      next.setUTCDate(Math.min(day, lastDayOfMonth));
      break;
    }
  }

  return next;
}

/** Short label for display, e.g. "Repeats weekly" / "Repeats every 2 weeks". */
export function formatRecurrence(
  frequency: string | null | undefined,
  interval: number
): string | null {
  if (!isRecurrenceFrequency(frequency)) return null;

  const unit = UNIT_LABEL[frequency];
  const everyN = interval > 1 ? `every ${interval} ${unit}s` : unit;
  const label = everyN === "day" ? "daily" : everyN === "week" ? "weekly" : everyN === "month" ? "monthly" : everyN;

  return `Repeats ${label}`;
}
