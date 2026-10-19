import prisma from "./prisma";

/**
 * Sentinel expiry for the FREE plan.
 *
 * `GET /api/subscription/create` only treats a subscription as active when
 * `currentPeriodEnd` is in the future. A FREE plan has nothing to expire, so
 * without this a year-old FREE subscription would fall out of that filter and
 * the user would be treated as having no plan at all - unable to create tasks.
 */
const FREE_PLAN_NEVER_EXPIRES = new Date("2999-12-31T00:00:00.000Z");

/**
 * Guarantee the user has an active subscription, creating the FREE plan if
 * they have none.
 *
 * Signup provisions this via a better-auth database hook, and the Stripe
 * webhook calls it when a paid subscription ends, so a user is never left
 * without a plan - which would lock them out of task creation entirely
 * (`createTaskAction` returns `NO_SUBSCRIPTION`).
 *
 * Never downgrades an active paid plan: a user who already has PRO keeps it.
 *
 * Throws only if the caller opts in; by default a missing FREE plan row (an
 * unseeded database) logs and returns null rather than breaking signup.
 */
export async function ensureFreeSubscription(userId: string) {
  const freePlan = await prisma.subscriptionPlan.findFirst({
    where: { name: "FREE" },
  });

  if (!freePlan) {
    console.error(
      "ensureFreeSubscription: no FREE plan found. Run `npm run db:seed`.",
    );
    return null;
  }

  const existing = await prisma.userSubscription.findFirst({
    where: { userId, status: "active" },
    include: { plan: true },
  });

  if (existing) {
    // A paid plan is already active - never downgrade it.
    if (existing.planId !== freePlan.id) {
      return existing;
    }

    // Already FREE. Keep its expiry far in the future so it never ages out of
    // the "active" filter.
    if (existing.currentPeriodEnd < FREE_PLAN_NEVER_EXPIRES) {
      return prisma.userSubscription.update({
        where: { id: existing.id },
        data: { currentPeriodEnd: FREE_PLAN_NEVER_EXPIRES },
        include: { plan: true },
      });
    }

    return existing;
  }

  return prisma.userSubscription.create({
    data: {
      userId,
      planId: freePlan.id,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: FREE_PLAN_NEVER_EXPIRES,
    },
    include: { plan: true },
  });
}
