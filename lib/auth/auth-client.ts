import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";

export const authClient = createAuthClient({
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://your-domain.com"
      : "http://localhost:3000",

  plugins: [
    stripeClient({
      subscription: true,
    }),
  ],
});
