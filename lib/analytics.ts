import type { TimeRange } from "@/lib/types";
import { TIME_RANGE_DAYS } from "@/lib/utils";

/** The task fields the analytics are computed from. */
export interface AnalyticsTask {
  createdAt: string;
  updatedAt: string;
  isCompleted: boolean;
}

/** Range dependent metrics returned by `GET /api/analytics`. */
export interface AnalyticsRangeSummary {
  /** Tasks created inside the selected range. */
  tasksCreatedInRange: number;
  /** Tasks completed inside the selected range. */
  tasksCompletedInRange: number;
  /** Tasks created in the window right before the selected range. */
  tasksCreatedPreviousPeriod: number;
  /** Weekday with the most completions in the selected range. */
  mostProductiveDay?: string;
  /** Average number of tasks created per day in the selected range. */
  averageTasksPerDay: number;
  /** Consecutive days (ending today) with at least one completion. */
  currentStreak: number;
}

/** The metrics computed for the selected range. */
export interface AnalyticsRangeResult {
  summary: AnalyticsRangeSummary;
  completionTrend: Array<{ date: string; completed: number }>;
}

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** A slice of the timeline the completion trend is drawn from. */
interface TrendBucket {
  start: Date;
  end: Date;
}

/** Local calendar day key (`YYYY-MM-DD`) for a date. */
function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Split the selected range into the buckets the completion trend is drawn from.
 *
 * Days and weeks are drawn one bar per day / week, a year is drawn one bar
 * per calendar month - 365 daily bars would be unreadable.
 */
function buildTrendBuckets(
  range: TimeRange,
  windowStart: Date,
  todayStart: Date
): TrendBucket[] {
  const buckets: TrendBucket[] = [];

  if (range === "1y") {
    // Twelve calendar months, the current one included.
    for (let offset = 11; offset >= 0; offset -= 1) {
      const start = new Date(
        todayStart.getFullYear(),
        todayStart.getMonth() - offset,
        1
      );
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      buckets.push({ start, end });
    }
    return buckets;
  }

  const chunkDays = range === "90d" ? 7 : 1;
  for (let offset = 0; offset < TIME_RANGE_DAYS[range]; offset += chunkDays) {
    const start = new Date(windowStart);
    start.setDate(start.getDate() + offset);
    const end = new Date(start);
    end.setDate(end.getDate() + chunkDays);
    buckets.push({ start, end });
  }

  return buckets;
}

/**
 * Compute the metrics that depend on the selected time range.
 *
 * A completion is dated by the task's `updatedAt` - the schema has no
 * `completedAt` column, so that is the closest thing to a completion
 * timestamp.
 *
 * @param tasks The user's tasks.
 * @param range The selected time range.
 * @param now The moment the window is anchored to, defaults to the current time.
 */
export function computeRangeAnalytics(
  tasks: AnalyticsTask[],
  range: TimeRange,
  now: Date = new Date()
): AnalyticsRangeResult {
  const rangeDays = TIME_RANGE_DAYS[range];

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // The window covers the last `rangeDays` calendar days, today included.
  const windowStart = new Date(todayStart);
  windowStart.setDate(windowStart.getDate() - (rangeDays - 1));

  // The window right before it, used for the period-over-period change.
  const previousStart = new Date(windowStart);
  previousStart.setDate(previousStart.getDate() - rangeDays);

  // Completions per calendar day.
  const completionsByDay = new Map<string, number>();
  for (const task of tasks) {
    if (!task.isCompleted) continue;
    const key = dayKey(new Date(task.updatedAt));
    completionsByDay.set(key, (completionsByDay.get(key) ?? 0) + 1);
  }

  const tasksCreatedInRange = tasks.filter(
    (task) => new Date(task.createdAt) >= windowStart
  ).length;

  const tasksCompletedInRange = tasks.filter(
    (task) => task.isCompleted && new Date(task.updatedAt) >= windowStart
  ).length;

  const tasksCreatedPreviousPeriod = tasks.filter((task) => {
    const createdAt = new Date(task.createdAt);
    return createdAt >= previousStart && createdAt < windowStart;
  }).length;

  // Weekday with the most completions inside the selected range.
  const weekdayTotals = new Array(7).fill(0);
  const weekdayCursor = new Date(windowStart);
  while (weekdayCursor <= todayStart) {
    weekdayTotals[weekdayCursor.getDay()] +=
      completionsByDay.get(dayKey(weekdayCursor)) ?? 0;
    weekdayCursor.setDate(weekdayCursor.getDate() + 1);
  }

  let mostProductiveDay: string | undefined;
  let bestWeekdayTotal = 0;
  weekdayTotals.forEach((total, day) => {
    if (total > bestWeekdayTotal) {
      bestWeekdayTotal = total;
      mostProductiveDay = WEEKDAY_NAMES[day];
    }
  });

  // Consecutive days with at least one completion, counting back from today.
  let currentStreak = 0;
  const streakCursor = new Date(todayStart);
  // A streak survives a day that has not produced a completion yet.
  if ((completionsByDay.get(dayKey(streakCursor)) ?? 0) === 0) {
    streakCursor.setDate(streakCursor.getDate() - 1);
  }
  while ((completionsByDay.get(dayKey(streakCursor)) ?? 0) > 0) {
    currentStreak += 1;
    streakCursor.setDate(streakCursor.getDate() - 1);
  }

  // Completion trend for the selected range.
  const completionTrend = buildTrendBuckets(
    range,
    windowStart,
    todayStart
  ).map((bucket) => {
    let completed = 0;
    const cursor = new Date(bucket.start);
    while (cursor < bucket.end) {
      completed += completionsByDay.get(dayKey(cursor)) ?? 0;
      cursor.setDate(cursor.getDate() + 1);
    }
    return {
      date: bucket.start.toISOString(),
      completed,
    };
  });

  return {
    summary: {
      tasksCreatedInRange,
      tasksCompletedInRange,
      tasksCreatedPreviousPeriod,
      mostProductiveDay,
      // Two decimals - a year long window averages well below one task a day.
      averageTasksPerDay:
        Math.round((tasksCreatedInRange / rangeDays) * 100) / 100,
      currentStreak,
    },
    completionTrend,
  };
}
