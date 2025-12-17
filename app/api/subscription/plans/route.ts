"use cache";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
    });

    // Convert to plain objects to avoid serialization issues
    const plainPlans = plans.map((plan) => ({
      ...plan,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
    }));

    return NextResponse.json({ plans: plainPlans });
  } catch (error) {
    console.error("Error fetching plans:", error);

    // If database fails, return default plans
    const defaultPlans = [
      {
        id: "free-default",
        name: "FREE",
        price: 0,
        maxTasks: 10,
        features: {
          basicReminder: true,
          emailNotifications: false,
          customReminders: false,
          unlimitedTasks: false,
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "pro-default",
        name: "PRO",
        price: 500,
        maxTasks: -1,
        features: {
          basicReminder: true,
          emailNotifications: true,
          customReminders: true,
          unlimitedTasks: true,
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json({ plans: defaultPlans });
  }
}
