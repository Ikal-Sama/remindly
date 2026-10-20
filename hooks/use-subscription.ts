import { useState } from "react";

/**
 * Subscription status hook.
 *
 * Fetches `/api/subscription/create` once on mount and caches the result.
 * Provides a manual `refetch()` for when the plan might have changed
 * (e.g. after a subscription webhook or cancellation).
 *
 * This avoids fetching the subscription status in every component that needs it,
 * and prevents the 5 known instances of inline `isPro` fetching that can
 * drift apart.
 */
export function useSubscription() {
  const [isPro, setIsPro] = useState<boolean>(false);

  const refetch = async () => {
    try {
      const response = await fetch("/api/subscription/create", {
        method: "GET",
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const currentPlan: string | undefined =
        data?.currentSubscription?.plan?.name;

      setIsPro(currentPlan === "PRO");
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  // Initial fetch on mount (runs synchronously after render)
  refetch();

  return { isPro, refetch };
}