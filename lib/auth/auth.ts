import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { stripe } from "@better-auth/stripe";
import prisma from "../prisma";
import { sendEmailOtp } from "../emails/emailOtp";
import { sendResetPasswordEmail } from "../emails/send-reset-password-email";
import { stripe as stripeClient } from "../stripe";
import { ensureFreeSubscription } from "../subscriptions";

/** How long a one-time code stays valid. Kept in step with the email copy. */
const OTP_TTL_MINUTES = 10;

export const auth = betterAuth({
  user: {
    changeEmail: {
      enabled: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({ user, url });
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    // Deliberately NO `sendVerificationEmail` here.
    //
    // The emailOTP plugin injects its own `sendVerificationEmail` via its
    // `init()` hook when `overrideDefaultEmailVerification` is true. Defining
    // our own here takes precedence over that injected implementation, which
    // silently sent the old link-based email instead of the OTP.
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      enabled: true,
    },
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  // Six-digit code instead of a verification link.
  //
  // `overrideDefaultEmailVerification` reroutes Better Auth's own
  // email-verification flow through OTP, which also covers email changes.
  // Password reset is deliberately left link-based - that flow already works,
  // and a reset link is the conventional pattern for it.
  //
  // `storeOTP: "hashed"` means a leaked database cannot be replayed into
  // verified accounts.
  plugins: [
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        try {
          await sendEmailOtp({
            email,
            otp,
            type,
            expiresInMinutes: OTP_TTL_MINUTES,
          });
        } catch (error) {
          // Never surface a delivery failure as a 500 from the auth endpoints.
          console.error("Failed to send OTP email:", error);
        }
      },
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      otpLength: 6,
      expiresIn: OTP_TTL_MINUTES * 60,
      storeOTP: "hashed",
      allowedAttempts: 5,
      rateLimit: { window: 60, max: 5 },
    }),
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        // Every new account starts on the FREE plan, so nobody has to pick a
        // plan before they can use the app. Deliberately failure-tolerant: an
        // unseeded database must not be able to block signups.
        after: async (user) => {
          try {
            await ensureFreeSubscription(user.id);
          } catch (error) {
            console.error("Failed to provision FREE plan on signup:", error);
          }
        },
      },
    },
  },
});

