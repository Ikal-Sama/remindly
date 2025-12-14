import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeSubscription = await prisma.userSubscription.findFirst({
      where: {
        userId: session.user.id,
        status: "active",
        currentPeriodEnd: {
          gt: new Date(),
        },
      },
    });

    if (!activeSubscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    const updated = await prisma.userSubscription.update({
      where: { id: activeSubscription.id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        currentPeriodEnd: new Date(),
      },
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
