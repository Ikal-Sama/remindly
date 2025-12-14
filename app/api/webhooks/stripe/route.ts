import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

// Configure Stripe with your secret key. API version will use the SDK default
// or the version configured in your Stripe dashboard.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

type SubscriptionWithPeriods = Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const subscription = event.data.object as SubscriptionWithPeriods;
      const customerId = subscription.customer as string;
      const priceId = (subscription.items.data[0]?.price?.id ?? null) as
        | string
        | null;

      // Find user by Stripe customer id first
      let user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });

      // Fallback: look up Stripe customer by id, match user by email, and
      // persist stripeCustomerId for future webhooks.
      if (!user) {
        try {
          const customer = (await stripe.customers.retrieve(customerId)) as
            | Stripe.Customer
            | Stripe.DeletedCustomer;

          if (!customer.deleted && customer.email) {
            user = await prisma.user.findFirst({
              where: { email: customer.email },
            });

            if (user && !user.stripeCustomerId) {
              await prisma.user.update({
                where: { id: user.id },
                data: { stripeCustomerId: customerId },
              });
            }
          }
        } catch (err) {
          console.error(
            "Stripe webhook: failed to retrieve customer for fallback lookup",
            { customerId, err }
          );
        }
      }

      if (!user) {
        console.warn("Stripe webhook: user not found for customer", customerId);
        return NextResponse.json({ received: true });
      }

      // Map Stripe status to app status (simplified)
      // Treat any non-cancelled / non-expired subscription as active.
      const cancelledStripeStatuses: Stripe.Subscription.Status[] = [
        "canceled",
        "incomplete_expired",
        "unpaid",
      ];

      const status = cancelledStripeStatuses.includes(subscription.status)
        ? "cancelled"
        : "active";

      // Determine corresponding app subscription plan based on Stripe price id
      let planId: string | null = null;

      if (priceId && priceId === process.env.STRIPE_PRO_PRICE_ID) {
        const proPlan = await prisma.subscriptionPlan.findUnique({
          where: { name: "PRO" },
        });

        if (!proPlan) {
          console.error(
            "Stripe webhook: PRO plan not found in subscriptionPlan table"
          );
          return NextResponse.json({ received: true });
        }

        planId = proPlan.id;
      }

      if (!planId) {
        console.warn(
          "Stripe webhook: unable to determine planId for subscription",
          { subscriptionId: subscription.id, priceId }
        );
        return NextResponse.json({ received: true });
      }

      // Ensure only a single active subscription per user by cancelling any
      // other active subscriptions for this user before applying the current
      // Stripe subscription. Wrap this together with the create/update in a
      // transaction to avoid race conditions from concurrent webhooks.
      await prisma.$transaction(async (tx) => {
        await tx.userSubscription.updateMany({
          where: {
            userId: user.id,
            status: "active",
            OR: [
              {
                stripeSubscriptionId: {
                  not: subscription.id,
                },
              },
              {
                stripeSubscriptionId: null,
              },
            ],
          },
          data: {
            status: "cancelled",
            cancelledAt: new Date(),
          },
        });

        const existingSubscription = await tx.userSubscription.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        const commonData = {
          status,
          planId,
          stripePriceId: priceId ?? undefined,
          currentPeriodStart: new Date(
            subscription.current_period_start * 1000
          ),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        };

        if (existingSubscription) {
          await tx.userSubscription.update({
            where: { id: existingSubscription.id },
            data: commonData,
          });
        } else {
          await tx.userSubscription.create({
            data: {
              userId: user.id,
              stripeSubscriptionId: subscription.id,
              ...commonData,
            },
          });
        }
      });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      await prisma.userSubscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling Stripe webhook", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
