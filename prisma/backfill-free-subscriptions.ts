// Backfills the FREE plan for users created before auto-provisioning existed.
// Run with: npm run db:backfill-free
import "./load-env";
import prisma from "../lib/prisma";
import { ensureFreeSubscription } from "../lib/subscriptions";

async function main() {
  const usersWithoutPlan = await prisma.user.findMany({
    where: { subscriptions: { none: { status: "active" } } },
    select: { id: true, email: true },
  });

  console.log(
    `Found ${usersWithoutPlan.length} user(s) with no active subscription.`,
  );

  for (const user of usersWithoutPlan) {
    const subscription = await ensureFreeSubscription(user.id);
    console.log(
      subscription
        ? `Provisioned FREE for ${user.email}`
        : `Skipped ${user.email} - FREE plan missing from the database (run db:seed)`,
    );
  }

  console.log("Backfill complete.");
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
