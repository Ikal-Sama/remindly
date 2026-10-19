import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";
import { emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL:
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_APP_URL
      : "http://localhost:3000",

  plugins: [
    // Must mirror the server-side emailOTP plugin so authClient.emailOtp
    // is typed and routed correctly.
    emailOTPClient(),
    stripeClient({
      subscription: true,
    }),
  ],
});
