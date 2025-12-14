// lib/validation/task.ts
import { z } from "zod";

export const createTaskFormSchema = z
  .object({
    title: z.string().min(2).max(50),
    description: z.string().min(2).max(200),
    dueDate: z.date(),
    reminderDate: z.date().optional(),
  })
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
  );

export type CreateTaskFormValues = z.infer<typeof createTaskFormSchema>;
