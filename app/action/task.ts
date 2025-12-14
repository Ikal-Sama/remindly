"use server";

import prisma from "@/lib/prisma";
import {
  createTaskFormSchema,
  CreateTaskFormValues,
} from "@/lib/validation/task";

export const createTaskAction = async (
  values: CreateTaskFormValues,
  userId: string
) => {
  try {
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Check user's active subscription and enforce task limits
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId,
        status: "active",
      },
      include: {
        plan: true,
      },
    });

    if (!subscription || !subscription.plan) {
      return { success: false, error: "NO_SUBSCRIPTION" };
    }

    const maxTasks = subscription.plan.maxTasks;

    if (typeof maxTasks === "number" && maxTasks !== -1) {
      const currentTaskCount = await prisma.task.count({
        where: { userId },
      });

      if (currentTaskCount >= maxTasks) {
        return { success: false, error: "TASK_LIMIT_REACHED" };
      }
    }

    const fieldData = createTaskFormSchema.parse(values);
    const { title, description, dueDate, reminderDate } = fieldData;

    // Additional validation: ensure reminder date logic is enforced
    if (reminderDate && dueDate) {
      const reminderTime = reminderDate.getTime();
      const dueTime = dueDate.getTime();

      // Double-check that reminder is not equivalent to due date
      if (reminderTime === dueTime) {
        return {
          success: false,
          error: "Reminder date cannot be equivalent to due date",
        };
      }

      // Ensure reminder is before due date
      if (reminderTime >= dueTime) {
        return {
          success: false,
          error: "Reminder date must be before due date",
        };
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate,
        // Only allow custom reminder dates for PRO plan users
        reminderDate:
          subscription.plan.name === "PRO" && reminderDate
            ? reminderDate
            : null,
        userId,
      },
    });

    return { success: true, task };
  } catch (error) {
    console.error("createTaskAction error:", error);
    return { success: false, error: "Failed to create task" };
  }
};

export const getLoggedInUserAllTasks = async (userId: string) => {
  try {
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, tasks };
  } catch (error) {
    console.error("getLoggedInUserAllTasks error:", error);
    return { success: false, error: "Failed to fetch tasks" };
  }
};

export const completeTask = async (taskId: string, userId: string) => {
  try {
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify the task belongs to the user
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: userId,
      },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        isCompleted: true,
        updatedAt: new Date(),
      },
    });

    return { success: true, task: updatedTask };
  } catch (error) {
    console.error("completeTask error:", error);
    return { success: false, error: "Failed to complete task" };
  }
};

export const deleteTask = async (taskId: string, userId: string) => {
  try {
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify the task belongs to the user
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: userId,
      },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    await prisma.task.delete({
      where: {
        id: taskId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("deleteTask error:", error);
    return { success: false, error: "Failed to delete task" };
  }
};

export const updateTask = async (
  taskId: string,
  data: {
    title: string;
    description?: string;
    dueDate?: Date;
    reminderDate?: Date;
  }
) => {
  try {
    // Verify the task exists
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        reminderDate: data.reminderDate,
        updatedAt: new Date(),
      },
    });

    return { success: true, task: updatedTask };
  } catch (error) {
    console.error("updateTask error:", error);
    return { success: false, error: "Failed to update task" };
  }
};
