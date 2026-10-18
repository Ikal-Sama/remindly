import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

/**
 * Single Stripe client for the whole app.
 *
 * Pin the API version explicitly so every call site (checkout, webhooks, the
 * Better Auth plugin) speaks the same protocol. Keep this value in sync with
 * `LatestApiVersion` in the installed SDK - Stripe requires the type to match.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-02-25.clover",
});
