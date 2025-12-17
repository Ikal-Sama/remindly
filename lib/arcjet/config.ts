import arcjet, { shield, detectBot, fixedWindow } from "@arcjet/next";

export const arcjetInstance = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    // Shield protects against common attacks like SQL injection, XSS, etc.
    shield({
      mode: "LIVE",
    }),
    // Bot detection to identify automated traffic
    detectBot({
      mode: "LIVE",
      // Allow verified bots like Googlebot, but block suspicious ones
      allow: [
        "GOOGLE_CRAWLER",
        "GOOGLE_ADSBOT",
        "GOOGLE_APPENGINE",
        "BING_CRAWLER",
        "CATEGORY:SLACK",
        "DISCORD_CRAWLER",
      ],
    }),
    // Rate limiting for general API protection
    fixedWindow({
      mode: "LIVE",
      window: "15m", // 15 minute window
      max: 100, // allow 1000 requests per 15 minutes per IP (increased for development)
    }),
  ],
});

// Specialized rate limiting for authentication endpoints
export const authRateLimit = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: "LIVE",
      allow: [], // Empty allow list blocks all bots
    }),
    // Stricter rate limiting for auth endpoints
    fixedWindow({
      mode: "LIVE",
      window: "15m",
      max: 5, // Only 5 auth attempts per 15 minutes
    }),
  ],
});

// Rate limiting for task operations
export const taskRateLimit = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({
      mode: "LIVE",
    }),
    fixedWindow({
      mode: "LIVE",
      window: "1h",
      max: 1000, // 1000 task operations per hour
    }),
  ],
});

// Email sending rate limiting
export const emailRateLimit = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({
      mode: "LIVE",
    }),
    fixedWindow({
      mode: "LIVE",
      window: "1h",
      max: 10, // 10 emails per hour per user
    }),
  ],
});

// Webhook protection - allows known webhook providers but applies rate limiting
export const webhookProtection = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: "LIVE",
      allow: ["STRIPE_WEBHOOK"],
    }),
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 100, // 100 webhook events per minute
    }),
  ],
});
