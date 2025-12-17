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

    const labels = await prisma.label.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ labels });
  } catch (error) {
    console.error("Error fetching labels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, color } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Label name is required" },
        { status: 400 }
      );
    }

    // Check if label already exists for this user
    const existingLabel = await prisma.label.findFirst({
      where: {
        name: name.trim(),
        userId: session.user.id,
      },
    });

    if (existingLabel) {
      return NextResponse.json(
        { error: "Label already exists" },
        { status: 409 }
      );
    }

    const label = await prisma.label.create({
      data: {
        name: name.trim(),
        color: color || "#10B981",
        userId: session.user.id,
      },
    });

    return NextResponse.json({ label }, { status: 201 });
  } catch (error) {
    console.error("Error creating label:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
