import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { webhookProtection } from "@/lib/arcjet/config";

// Configure Stripe with your secret key. API version will use the SDK default
// or the version configured in your Stripe dashboard.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

type SubscriptionWithPeriods = Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
};

export async function POST(req: NextRequest) {
  // Skip Arcjet protection for Stripe webhooks - they are legitimate server-to-server requests
  // Arcjet webhook protection can interfere with Stripe's webhook delivery

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
          return NextResponse.json({ error: "Webhook error" }, { status: 500 });
        }
      }

      if (!user) {
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

      // Handle PRO plan
      if (priceId && priceId === process.env.STRIPE_PRO_PRICE_ID) {
        const proPlan = await prisma.subscriptionPlan.findUnique({
          where: { name: "PRO" },
        });

        if (!proPlan) {
          return NextResponse.json({ received: true });
        }

        planId = proPlan.id;
      }
      // Handle FREE plan - secure fallback for cases where FREE plan might be processed
      else if (!priceId || priceId === process.env.STRIPE_FREE_PRICE_ID) {
        const freePlan = await prisma.subscriptionPlan.findUnique({
          where: { name: "FREE" },
        });

        if (!freePlan) {
          return NextResponse.json({ received: true });
        }

        planId = freePlan.id;
      }

      if (!planId) {
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
          currentPeriodStart: subscription.current_period_start
            ? new Date(subscription.current_period_start * 1000)
            : new Date(),
          currentPeriodEnd: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days fallback
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
