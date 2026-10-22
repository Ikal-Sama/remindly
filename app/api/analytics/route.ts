import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import type { Analytics } from "@/lib/types";
import { computeRangeAnalytics } from "@/lib/analytics";
import { parseTimeRange } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's subscription to check if PRO
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId,
        status: "active",
      },
      include: {
        plan: true,
      },
    });

    const isPro = subscription?.plan?.name === "PRO";

    if (!isPro) {
      return NextResponse.json({ error: "PRO feature" }, { status: 403 });
    }

    const range = parseTimeRange(request.nextUrl.searchParams.get("range"));

    // Get all tasks with related data
    const tasks = await prisma.task.findMany({
      where: {
        userId,
      },
      include: {
        category: true,
        taskLabels: {
          include: {
            label: true,
          },
        },
      },
    });

    // Convert to plain objects to avoid serialization issues
    const plainTasks = tasks.map((task) => ({
      ...task,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      reminderDate: task.reminderDate ? task.reminderDate.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      category: task.category
        ? {
            ...task.category,
            createdAt: task.category.createdAt.toISOString(),
            updatedAt: task.category.updatedAt.toISOString(),
          }
        : null,
      taskLabels: task.taskLabels.map((taskLabel) => ({
        ...taskLabel,
        createdAt: taskLabel.createdAt.toISOString(),
        label: taskLabel.label
          ? {
              ...taskLabel.label,
              createdAt: taskLabel.label.createdAt.toISOString(),
              updatedAt: taskLabel.label.updatedAt.toISOString(),
            }
          : null,
      })),
    }));

    // Calculate basic metrics
    const totalTasks = plainTasks.length;
    const completedTasks = plainTasks.filter((task) => task.isCompleted).length;
    const incompleteTasks = totalTasks - completedTasks;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Category analytics
    const categoryAnalytics = plainTasks.reduce((acc, task) => {
      const categoryName = task.category?.name || "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          color: task.category?.color || "#9CA3AF",
          total: 0,
          completed: 0,
        };
      }
      acc[categoryName].total++;
      if (task.isCompleted) {
        acc[categoryName].completed++;
      }
      return acc;
    }, {} as Record<string, Analytics["categories"][number]>);

    const categoryData = Object.values(categoryAnalytics);

    // Label analytics
    const labelAnalytics = plainTasks.reduce((acc, task) => {
      task.taskLabels.forEach((taskLabel) => {
        // `label` is nullable in the serialised shape; skip orphaned joins.
        const label = taskLabel.label;
        if (!label) return;
        const labelName = label.name;
        if (!acc[labelName]) {
          acc[labelName] = {
            name: labelName,
            color: label.color,
            count: 0,
          };
        }
        acc[labelName].count++;
      });
      return acc;
    }, {} as Record<string, Analytics["labels"][number]>);

    const labelData = Object.values(labelAnalytics);

    // Tasks due this week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const tasksDueThisWeek = plainTasks.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= startOfWeek && dueDate <= endOfWeek;
    }).length;

    // Overdue tasks
    const overdueTasks = plainTasks.filter((task) => {
      if (!task.dueDate || task.isCompleted) return false;
      return new Date(task.dueDate) < now;
    }).length;

    // Metrics that depend on the selected time range
    const { summary: rangeSummary, completionTrend } = computeRangeAnalytics(
      plainTasks,
      range
    );

    return NextResponse.json({
      analytics: {
        summary: {
          totalTasks,
          completedTasks,
          incompleteTasks,
          completionRate,
          tasksDueThisWeek,
          overdueTasks,
          ...rangeSummary,
        },
        categories: categoryData,
        labels: labelData,
        completionTrend,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
