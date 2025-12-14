import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";

export const authClient = createAuthClient({
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://remindly-jhf3upl1a-daniel-jhons-projects.vercel.app"
      : "http://localhost:3000",

  plugins: [
    stripeClient({
      subscription: true,
    }),
  ],
});
