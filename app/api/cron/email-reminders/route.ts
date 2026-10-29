import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/emails/sendEmail";
import { taskReminderEmail } from "@/lib/emails/taskReminderEmail";
import { taskReminderSms } from "@/lib/sms/messages";
import { getSmsProvider, sendSms } from "@/lib/sms/sendSms";
import { SMS_DAILY_LIMIT } from "@/lib/sms/constants";
import { headers } from "next/headers";
import {
  formatRecurrence,
  getNextOccurrence,
  isRecurrenceFrequency,
} from "@/lib/recurrence";

export async function GET() {
  try {
    // Verify cron secret to prevent unauthorized access
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current date in UTC
    const today = new Date();
    const todayUTC = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );

    // Get all tasks with reminders due today
    const tasksNeedingReminders = await prisma.task.findMany({
      where: {
        isCompleted: false,
        OR: [
          // PRO plan: Custom reminder dates that match today
          {
            reminderDate: {
              gte: todayUTC,
              lt: new Date(todayUTC.getTime() + 24 * 60 * 60 * 1000), // Before tomorrow
            },
            user: {
              emailVerified: true,
              subscriptions: {
                some: {
                  status: "active",
                  plan: {
                    name: "PRO",
                  },
                },
              },
            },
          },
          // FREE plan: Due date is exactly 1 day from now (tomorrow)
          {
            dueDate: {
              gte: new Date(todayUTC.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now start
              lt: new Date(todayUTC.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now start
            },
            user: {
              emailVerified: true,
              subscriptions: {
                some: {
                  status: "active",
                  plan: {
                    name: "FREE",
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        user: {
          include: {
            subscriptions: {
              include: {
                plan: true,
              },
            },
          },
        },
        notifications: true,
      },
    });

    // The database query already filtered tasks correctly, no need for additional filtering
    const tasksToSendToday = tasksNeedingReminders;

    // SMS budget per user for today. The email log already dedupes reminders,
    // but a PRO user can have many tasks due on the same day; this caps how
    // many free-gateway messages one account can trigger in a run.
    const smsUsage = new Map<string, number>();
    if (tasksToSendToday.length > 0) {
      const sentToday = await prisma.smsNotification.groupBy({
        by: ["userId"],
        where: {
          sentAt: { gte: todayUTC },
          status: { in: ["SENT", "LOGGED"] },
          type: { in: ["CUSTOM_REMINDER", "DUE_DATE_REMINDER"] },
        },
        _count: { _all: true },
      });

      for (const row of sentToday) {
        smsUsage.set(row.userId, row._count._all);
      }
    }

    const emailPromises = tasksToSendToday.map(async (task) => {
      // Find the active subscription, not just the first one
      const activeSubscription = task.user.subscriptions.find(
        (sub) => sub.status === "active"
      );
      const isPro = activeSubscription?.plan?.name === "PRO";

      let notificationType: string;
      let scheduledFor: Date;

      if (isPro && task.reminderDate) {
        // PRO plan: Use todayUTC + 9 hours (9:00 AM UTC)
        notificationType = "CUSTOM_REMINDER";
        scheduledFor = new Date(todayUTC.getTime() + 9 * 60 * 60 * 1000);
      } else if (!isPro && task.dueDate) {
        // FREE plan: Use todayUTC + 9 hours (9:00 AM UTC) - 2-day logic already handled by Prisma query
        notificationType = "DUE_DATE_REMINDER";
        scheduledFor = new Date(todayUTC.getTime() + 9 * 60 * 60 * 1000);
      } else {
        return; // Skip if conditions aren't met
      }

      // Skip if this occurrence was already reminded today. The check is
      // scoped to the day so a recurring task can fire again on its next
      // occurrence without growing an unbounded notification log.
      const endOfTodayUTC = new Date(
        todayUTC.getTime() + 24 * 60 * 60 * 1000
      );
      const alreadySentToday = task.notifications.some(
        (notif) =>
          notif.type === notificationType &&
          notif.scheduledFor >= todayUTC &&
          notif.scheduledFor < endOfTodayUTC
      );

      if (alreadySentToday) {
        return; // Already sent for this occurrence
      }

      try {
        // Send email
        await sendEmail({
          to: task.user.email,
          subject: `Task Reminder: ${task.title}`,
          html: taskReminderEmail({
            userName: task.user.name,
            taskTitle: task.title,
            taskDescription: task.description,
            dueDate: task.dueDate,
            reminderDate: task.reminderDate || undefined,
            isPro,
            recurrenceLabel: formatRecurrence(
              task.recurrenceFrequency,
              task.recurrenceInterval
            ),
          }),
        });

        // Log the notification
        await prisma.emailNotification.create({
          data: {
            taskId: task.id,
            type: notificationType,
            scheduledFor,
          },
        });

        // Recurring task: advance to the next occurrence so the next reminder
        // fires on schedule. Clears the rule once the end date is reached.
        if (isRecurrenceFrequency(task.recurrenceFrequency)) {
          const nextDue = getNextOccurrence(
            task.recurrenceFrequency,
            task.recurrenceInterval,
            task.dueDate
          );
          const reachedEnd =
            task.recurrenceEndDate && nextDue > task.recurrenceEndDate;

          if (reachedEnd) {
            await prisma.task.update({
              where: { id: task.id },
              data: { recurrenceFrequency: null, recurrenceEndDate: null },
            });
          } else {
            const delta = nextDue.getTime() - task.dueDate.getTime();
            await prisma.task.update({
              where: { id: task.id },
              data: {
                dueDate: nextDue,
                reminderDate: task.reminderDate
                  ? new Date(task.reminderDate.getTime() + delta)
                  : null,
              },
            });
          }
        }

        console.log(
          `Email reminder sent for task: ${task.title} to ${task.user.email}`
        );
      } catch (emailError) {
        console.error(`Failed to send email for task ${task.id}:`, emailError);
      }

      // SMS is an independent second channel: a failed email must not suppress
      // it, and a failed SMS must not fail the rest of the run.
      if (
        task.user.smsReminders &&
        task.user.phoneNumber &&
        (task.user.phoneCarrier || getSmsProvider() === "console")
      ) {
        const used = smsUsage.get(task.userId) ?? 0;

        if (used >= SMS_DAILY_LIMIT) {
          console.warn(
            `SMS daily limit reached for user ${task.userId}; skipping task ${task.id}`
          );
        } else {
          smsUsage.set(task.userId, used + 1);

          const result = await sendSms({
            phoneNumber: task.user.phoneNumber,
            carrierId: task.user.phoneCarrier,
            message: taskReminderSms({
              taskTitle: task.title,
              dueDate: task.dueDate,
              reminderDate: task.reminderDate,
            }),
          });

          try {
            await prisma.smsNotification.create({
              data: {
                userId: task.userId,
                taskId: task.id,
                type: notificationType,
                status: result.status,
                provider: result.provider,
                error: result.error ?? null,
                scheduledFor,
              },
            });
          } catch (logError) {
            console.error(
              `Failed to log SMS notification for task ${task.id}:`,
              logError
            );
          }

          if (result.status === "FAILED") {
            console.error(
              `Failed to send SMS for task ${task.id}: ${result.error}`
            );
          }
        }
      }
    });

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      processed: tasksToSendToday.length,
      message: "Reminders processed successfully",
    });
  } catch (error) {
    console.error("Email reminder cron error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
