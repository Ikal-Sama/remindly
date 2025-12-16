import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/emails/sendEmail";
import { taskReminderEmail } from "@/lib/emails/taskReminderEmail";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
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
          // FREE plan: Due date is exactly 2 days from now
          {
            dueDate: {
              gte: new Date(todayUTC.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now start
              lt: new Date(todayUTC.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now start
            },
            user: {
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

    // Filter tasks based on reminder date
    const tasksToSendToday = tasksNeedingReminders.filter((task: any) => {
      const subscription = task.user.subscriptions[0];
      const isPro = subscription?.plan?.name === "PRO";

      if (isPro && task.reminderDate) {
        // For PRO plan: Check if reminder date is today in UTC
        const reminderDateInUTC = new Date(
          Date.UTC(
            task.reminderDate.getUTCFullYear(),
            task.reminderDate.getUTCMonth(),
            task.reminderDate.getUTCDate(),
            9,
            0,
            0,
            0
          )
        );

        return reminderDateInUTC.toDateString() === todayUTC.toDateString();
      } else if (!isPro && task.dueDate) {
        // For FREE plan: Check if due date is 2 days from now in UTC
        const dueDateInUTC = new Date(
          Date.UTC(
            task.dueDate.getUTCFullYear(),
            task.dueDate.getUTCMonth(),
            task.dueDate.getUTCDate(),
            0,
            0,
            0,
            0
          )
        );

        return (
          dueDateInUTC.toDateString() ===
          new Date(todayUTC.getTime() + 2 * 24 * 60 * 60 * 1000).toDateString()
        );
      }

      return false;
    });

    const emailPromises = tasksToSendToday.map(async (task: any) => {
      const subscription = task.user.subscriptions[0];
      const isPro = subscription?.plan?.name === "PRO";

      let notificationType: string;
      let scheduledFor: Date;

      if (isPro && task.reminderDate) {
        // PRO plan: Use custom reminder date at 9:00 AM UTC
        notificationType = "CUSTOM_REMINDER";
        scheduledFor = new Date(
          Date.UTC(
            task.reminderDate.getUTCFullYear(),
            task.reminderDate.getUTCMonth(),
            task.reminderDate.getUTCDate(),
            9,
            0,
            0,
            0
          )
        );
      } else if (!isPro && task.dueDate) {
        // FREE plan: Use 2-day before due date at 9:00 AM UTC
        notificationType = "DUE_DATE_REMINDER";
        scheduledFor = new Date(
          Date.UTC(
            task.dueDate.getUTCFullYear(),
            task.dueDate.getUTCMonth(),
            task.dueDate.getUTCDate() - 2,
            9,
            0,
            0,
            0
          )
        );
      } else {
        return; // Skip if conditions aren't met
      }

      // Check if notification already sent for this specific type
      const existingNotification = task.notifications.find(
        (notif: any) => notif.type === notificationType
      );

      if (existingNotification) {
        return; // Already sent
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

        console.log(
          `Email reminder sent for task: ${task.title} to ${task.user.email}`
        );
      } catch (emailError) {
        console.error(`Failed to send email for task ${task.id}:`, emailError);
      }
    });

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      processed: tasksToSendToday.length,
      message: "Email reminders processed successfully",
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
