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

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of current day
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999); // End of current day

    // Get all tasks with upcoming reminders
    const tasksNeedingReminders = await prisma.task.findMany({
      where: {
        isCompleted: false,
        OR: [
          // PRO plan: Custom reminder dates that are today
          {
            reminderDate: {
              gte: now,
              lte: endOfDay,
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
              gte: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now start
              lte: new Date(endOfDay.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now end
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

    const emailPromises = tasksNeedingReminders.map(async (task: any) => {
      const subscription = task.user.subscriptions[0];
      const isPro = subscription?.plan?.name === "PRO";

      let notificationType: string;
      let scheduledFor: Date;

      if (isPro && task.reminderDate) {
        // PRO plan: Use custom reminder date
        notificationType = "CUSTOM_REMINDER";
        scheduledFor = task.reminderDate;
      } else if (!isPro && task.dueDate) {
        // FREE plan: Use 2-day before due date logic
        notificationType = "DUE_DATE_REMINDER";
        scheduledFor = new Date(
          task.dueDate.getTime() - 2 * 24 * 60 * 60 * 1000
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
      processed: tasksNeedingReminders.length,
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
