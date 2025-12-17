/**
 * Next.js 16 Caching Configuration
 *
 * This file documents the caching strategy implemented using the "use cache" directive
 * to optimize the Remindly application performance.
 *
 * Updated: Removed caching from API routes serving client components due to serialization issues
 */

export const cacheConfig = {
  // Static pages - cached indefinitely until next build
  staticPages: {
    home: {
      path: "/app/page.tsx",
      strategy: "no cache (client component)",
      revalidation: "n/a",
      description: "Landing page with client-side auth logic",
    },
    pricing: {
      path: "/app/pricing/page.tsx",
      strategy: "use cache",
      revalidation: "on-demand",
      description: "Pricing page with subscription plans",
    },
    about: {
      path: "/app/about/page.tsx",
      strategy: "use cache",
      revalidation: "on-demand",
      description: "About page with company information",
    },
  },

  // API routes - cached with appropriate strategies
  apiRoutes: {
    subscriptionPlans: {
      path: "/app/api/subscription/plans/route.ts",
      strategy: "use cache",
      revalidation: "on-demand",
      description: "Subscription plans data (rarely changes)",
    },
    tasksSummary: {
      path: "/app/api/tasks/summary/route.ts",
      strategy: "no cache (client component data)",
      revalidation: "real-time",
      description:
        "Task statistics summary (removed due to serialization issues)",
    },
    categories: {
      path: "/app/api/categories/route.ts",
      strategy: "no cache (client component data)",
      revalidation: "real-time",
      description: "User categories (removed due to serialization issues)",
    },
    analytics: {
      path: "/app/api/analytics/route.ts",
      strategy: "no cache (user-specific)",
      revalidation: "real-time",
      description: "Analytics data (user-specific, no caching)",
    },
  },

  // Components - cached for better performance
  components: {
    pricingCards: {
      path: "/components/shared/pricing-cards.tsx",
      strategy: "use cache",
      revalidation: "on-demand",
      description: "Pricing cards component",
    },
    analyticsSummary: {
      path: "/components/analytics/analytics-summary.tsx",
      strategy: "use cache",
      revalidation: "1 minute",
      description: "Analytics summary cards",
    },
    dashboardHeader: {
      path: "/components/shared/dashboard-header.tsx",
      strategy: "use cache",
      revalidation: "on-demand",
      description: "Dashboard header component",
    },
  },

  // Cache invalidation strategies
  invalidation: {
    onTaskUpdate: [
      "/app/api/analytics/route.ts",
      "/components/analytics/analytics-summary.tsx",
    ],
    onCategoryChange: ["/app/api/analytics/route.ts"],
    onSubscriptionChange: [
      "/app/api/subscription/plans/route.ts",
      "/components/shared/pricing-cards.tsx",
    ],
    onContentUpdate: ["/app/pricing/page.tsx", "/app/about/page.tsx"],
  },
};

/**
 * Performance Benefits:
 *
 * 1. Static Pages: Instant loading for marketing pages
 * 2. API Routes: Reduced database queries for frequently accessed data
 * 3. Components: Faster rendering for complex UI components
 * 4. Bandwidth: Reduced data transfer for repeated requests
 * 5. Server Load: Lower CPU usage for cached content
 *
 * Cache Hierarchy:
 * - Browser Cache → CDN Cache → Edge Cache → Server Cache → Database
 *
 * Best Practices Implemented:
 * - Static content cached indefinitely
 * - User-specific data selectively cached
 * - API responses cached where appropriate
 * - Component-level caching for expensive renders
 * - Strategic cache invalidation points
 *
 * Limitations Discovered:
 * - API routes serving client components cannot use "use cache" due to serialization issues
 * - Client components cannot use "use cache" directive
 * - Only server components can benefit from "use cache" directive
 */
