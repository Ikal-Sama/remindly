// Run with: tsx prisma/seed.ts
import prisma from "../lib/prisma";

async function main() {
  console.log("Starting database seed...");

  // Create FREE plan
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { name: "FREE" },
    update: {},
    create: {
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
    },
  });

  // Create PRO plan
  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { name: "PRO" },
    update: {},
    create: {
      name: "PRO",
      price: 500, // $5.00 in cents
      maxTasks: -1, // Unlimited
      features: {
        basicReminder: true,
        emailNotifications: true,
        customReminders: true,
        unlimitedTasks: true,
      },
      isActive: true,
    },
  });

  console.log("Subscription plans created:");
  console.log("FREE:", freePlan);
  console.log("PRO:", proPlan);
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Database disconnected");
  });
