import { format } from "date-fns";

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://remindly-pi.vercel.app"
).replace(/\/$/, "");

/** A single SMS part. Longer bodies get split (and charged) by the carrier. */
const MAX_LENGTH = 160;

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

/**
 * Short plain-text reminder for the email-to-SMS bridge.
 *
 * The task title is capped so a long title cannot push the link out of the
 * first SMS part.
 */
export function taskReminderSms({
  taskTitle,
  dueDate,
  reminderDate,
}: {
  taskTitle: string;
  dueDate: Date;
  reminderDate: Date | null;
}): string {
  const when = format(reminderDate ?? dueDate, "MMM d");
  const message = `Remindly: "${truncate(taskTitle, 48)}" is due ${when}. Open ${APP_URL}/dashboard`;
  return truncate(message, MAX_LENGTH);
}

/** Used by the "Send test message" button in Settings. */
export function testSms(): string {
  return `Remindly: SMS reminders are working. You will get task reminders here. ${APP_URL}`;
}
