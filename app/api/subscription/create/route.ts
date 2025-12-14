import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userSubscription = await prisma.userSubscription.findFirst({
      where: {
        userId: session.user.id,
        status: "active",
        currentPeriodEnd: {
          gt: new Date(),
        },
      },
      // Prefer higher-priced plans (PRO) over FREE when multiple
      // active subscriptions exist, then pick the most recent period.
      orderBy: [
        {
          plan: {
            price: "desc",
          },
        },
        {
          currentPeriodEnd: "desc",
        },
      ],
      include: {
        plan: true,
      },
    });

    return NextResponse.json({
      currentSubscription: userSubscription,
      hasActiveSubscription: !!userSubscription,
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planName } = await request.json();

    if (!planName || !["FREE", "PRO"].includes(planName)) {
      return NextResponse.json({ error: "Invalid plan name" }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { name: planName },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.userSubscription.findFirst({
      where: {
        userId: session.user.id,
        status: "active",
        currentPeriodEnd: {
          gt: new Date(),
        },
      },
    });

    let userSubscription;

    if (existingSubscription) {
      // Update existing subscription
      userSubscription = await prisma.userSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          planId: plan.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
          ),
        },
        include: {
          plan: true,
        },
      });
    } else {
      // Create new subscription
      userSubscription = await prisma.userSubscription.create({
        data: {
          userId: session.user.id,
          planId: plan.id,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
          ),
        },
        include: {
          plan: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      subscription: userSubscription,
      message: `Successfully subscribed to ${planName} plan`,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
