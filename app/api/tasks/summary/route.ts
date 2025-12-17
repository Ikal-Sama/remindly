import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all tasks for the user
    const tasks = await prisma.task.findMany({
      where: { userId },
      include: {
        category: true,
      },
    });

    // Calculate basic metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.isCompleted).length;
    const incompleteTasks = totalTasks - completedTasks;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate tasks due this week
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
      return (
        dueDate >= startOfWeek && dueDate <= endOfWeek && !task.isCompleted
      );
    }).length;

    // Calculate overdue tasks
    const overdueTasks = tasks.filter((task) => {
      if (!task.dueDate || task.isCompleted) return false;
      return new Date(task.dueDate) < now;
    }).length;

    return NextResponse.json({
      totalTasks,
      completedTasks,
      incompleteTasks,
      completionRate,
      tasksDueThisWeek,
      overdueTasks,
    });
  } catch (error) {
    console.error("Error fetching task summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch task summary" },
      { status: 500 }
    );
  }
}
