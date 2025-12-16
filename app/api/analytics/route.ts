import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
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

    // Calculate basic metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.isCompleted).length;
    const incompleteTasks = totalTasks - completedTasks;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Category analytics
    const categoryAnalytics = tasks.reduce((acc, task) => {
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
    }, {} as Record<string, any>);

    const categoryData = Object.values(categoryAnalytics);

    // Label analytics
    const labelAnalytics = tasks.reduce((acc, task) => {
      task.taskLabels.forEach((taskLabel: any) => {
        const labelName = taskLabel.label.name;
        if (!acc[labelName]) {
          acc[labelName] = {
            name: labelName,
            color: taskLabel.label.color,
            count: 0,
          };
        }
        acc[labelName].count++;
      });
      return acc;
    }, {} as Record<string, any>);

    const labelData = Object.values(labelAnalytics);

    // Tasks due this week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const tasksDueThisWeek = tasks.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= startOfWeek && dueDate <= endOfWeek;
    }).length;

    // Overdue tasks
    const overdueTasks = tasks.filter((task) => {
      if (!task.dueDate || task.isCompleted) return false;
      return new Date(task.dueDate) < now;
    }).length;

    // Tasks created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const tasksCreatedLast30Days = tasks.filter(
      (task) => new Date(task.createdAt) >= thirtyDaysAgo
    ).length;

    // Tasks completed in last 30 days
    const tasksCompletedLast30Days = tasks.filter(
      (task) => task.isCompleted && new Date(task.updatedAt) >= thirtyDaysAgo
    ).length;

    // Get completion data for the last 7 days
    const completionTrend = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const completedTasksForDay = await prisma.task.count({
        where: {
          userId,
          isCompleted: true,
          updatedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      completionTrend.push({
        date: date.toISOString().split("T")[0],
        completed: completedTasksForDay,
      });
    }

    return NextResponse.json({
      analytics: {
        summary: {
          totalTasks,
          completedTasks,
          incompleteTasks,
          completionRate,
          tasksDueThisWeek,
          overdueTasks,
          tasksCreatedLast30Days,
          tasksCompletedLast30Days,
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
