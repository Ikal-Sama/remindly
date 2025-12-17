import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        category: true,
        taskLabels: {
          include: {
            label: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform taskLabels to labels to match frontend interface
    const transformedTasks = tasks.map((task) => ({
      ...task,
      labels: task.taskLabels,
      taskLabels: undefined, // Remove the original field
    }));

    return NextResponse.json({ tasks: transformedTasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, dueDate, reminderDate, categoryId, labelIds } =
      await request.json();

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    if (!dueDate) {
      return NextResponse.json(
        { error: "Due date is required" },
        { status: 400 }
      );
    }

    // Validate that the category belongs to the user if provided
    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId: session.user.id,
        },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 }
        );
      }
    }

    // Validate that all labels belong to the user if provided
    if (labelIds && labelIds.length > 0) {
      const labels = await prisma.label.findMany({
        where: {
          id: { in: labelIds },
          userId: session.user.id,
        },
      });

      if (labels.length !== labelIds.length) {
        return NextResponse.json({ error: "Invalid labels" }, { status: 400 });
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || "",
        dueDate: new Date(dueDate),
        reminderDate: reminderDate ? new Date(reminderDate) : null,
        categoryId: categoryId || null,
        userId: session.user.id,
        taskLabels:
          labelIds && labelIds.length > 0
            ? {
                create: labelIds.map((labelId: string) => ({
                  labelId,
                })),
              }
            : undefined,
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

    // Transform taskLabels to labels to match frontend interface
    const transformedTask = {
      ...task,
      labels: task.taskLabels,
      taskLabels: undefined, // Remove the original field
    };

    return NextResponse.json({ task: transformedTask }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      id,
      title,
      description,
      dueDate,
      reminderDate,
      categoryId,
      labelIds,
      isCompleted,
    } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Verify the task belongs to the user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Validate category if provided
    if (categoryId !== undefined && categoryId !== null) {
      if (categoryId) {
        const category = await prisma.category.findFirst({
          where: {
            id: categoryId,
            userId: session.user.id,
          },
        });

        if (!category) {
          return NextResponse.json(
            { error: "Invalid category" },
            { status: 400 }
          );
        }
      }
    }

    // Validate labels if provided
    if (labelIds && labelIds.length > 0) {
      const labels = await prisma.label.findMany({
        where: {
          id: { in: labelIds },
          userId: session.user.id,
        },
      });

      if (labels.length !== labelIds.length) {
        return NextResponse.json({ error: "Invalid labels" }, { status: 400 });
      }
    }

    // Update the task
    const task = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description.trim() : undefined,
        dueDate: dueDate !== undefined ? new Date(dueDate) : undefined,
        reminderDate:
          reminderDate !== undefined
            ? reminderDate
              ? new Date(reminderDate)
              : null
            : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
        isCompleted: isCompleted !== undefined ? isCompleted : undefined,
        taskLabels:
          labelIds !== undefined
            ? {
                deleteMany: {},
                create: labelIds.map((labelId: string) => ({
                  labelId,
                })),
              }
            : undefined,
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

    // Transform taskLabels to labels to match frontend interface
    const transformedTask = {
      ...task,
      labels: task.taskLabels,
      taskLabels: undefined, // Remove the original field
    };

    return NextResponse.json({ task: transformedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Verify the task belongs to the user
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
