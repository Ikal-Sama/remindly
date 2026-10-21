// lib/validation/task.ts
import { z } from "zod";
import { MAX_RECURRENCE_INTERVAL } from "@/lib/recurrence";

export const createTaskFormSchema = z
  .object({
    title: z.string().min(2).max(50),
    description: z.string().min(2).max(200),
    dueDate: z.date(),
    reminderDate: z.date().optional(),
    categoryId: z.string().optional(),
    labelIds: z.array(z.string()).optional(),
    // Recurrence. `null` / undefined means a one-off task.
    recurrenceFrequency: z
      .enum(["DAILY", "WEEKLY", "MONTHLY"])
      .nullable()
      .optional(),
    recurrenceInterval: z
      .number()
      .int()
      .min(1)
      .max(MAX_RECURRENCE_INTERVAL)
      .optional(),
    recurrenceEndDate: z.date().optional(),
  })
  .refine(
    (data) => {
      // A task cannot be due today or in the past. Compare against the start of
      // tomorrow so a time later today does not slip through.
      const startOfTomorrow = new Date();
      startOfTomorrow.setHours(24, 0, 0, 0);
      return data.dueDate >= startOfTomorrow;
    },
    {
      message: "Due date must be tomorrow or later",
      path: ["dueDate"],
    }
  )
  .refine(
    (data) => {
      if (!data.reminderDate) return true;

      // Ensure reminder date is not equivalent to due date
      const reminderTime = data.reminderDate.getTime();
      const dueTime = data.dueDate.getTime();

      if (reminderTime === dueTime) return false;

      // Ensure reminder date is reasonably close to due date (within 30 days before)
      const daysDifference = Math.abs(
        (dueTime - reminderTime) / (1000 * 60 * 60 * 24)
      );

      return daysDifference <= 30 && reminderTime < dueTime;
    },
    {
      message:
        "Reminder date must be before due date, not equivalent, and within 30 days of due date",
      path: ["reminderDate"],
    }
  )
  .refine(
    (data) => {
      // A recurrence interval only makes sense when a frequency is set, and
      // must stay within the supported range.
      if (!data.recurrenceFrequency) return true;
      const interval = data.recurrenceInterval ?? 1;
      return interval >= 1 && interval <= MAX_RECURRENCE_INTERVAL;
    },
    {
      message: `Interval must be between 1 and ${MAX_RECURRENCE_INTERVAL}`,
      path: ["recurrenceInterval"],
    }
  )
  .refine(
    (data) => {
      // An end date is only meaningful for a recurring task, and must fall
      // after the first occurrence.
      if (!data.recurrenceFrequency || !data.recurrenceEndDate) return true;
      return data.recurrenceEndDate > data.dueDate;
    },
    {
      message: "End date must be after the due date",
      path: ["recurrenceEndDate"],
    }
  );

export type CreateTaskFormValues = z.infer<typeof createTaskFormSchema>;
