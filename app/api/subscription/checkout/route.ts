import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { arcjetInstance } from "@/lib/arcjet/config";

export async function POST(request: NextRequest) {
  try {
    // Apply Arcjet protection before processing
    const decision = await arcjetInstance.protect(request);
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
      if (decision.reason.isBot()) {
        return NextResponse.json(
          { error: "Bot traffic detected and blocked." },
          { status: 403 }
        );
      }
      if (decision.reason.isShield()) {
        return NextResponse.json(
          { error: "Request blocked by security shield." },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "Request blocked by security policy." },
        { status: 403 }
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const planName = body?.planName as string | undefined;

    if (planName !== "PRO") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: "Stripe price ID not configured" },
        { status: 500 }
      );
    }

    const origin = request.nextUrl.origin;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: session.user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/subscription?status=success`,
      cancel_url: `${origin}/subscription?status=cancelled`,
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: "Unable to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
