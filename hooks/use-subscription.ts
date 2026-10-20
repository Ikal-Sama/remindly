import { useCallback, useEffect, useState } from "react";

/**
 * Subscription status hook.
 *
 * Fetches `/api/subscription/create` once on mount and caches the result.
 * Provides a manual `refetch()` for when the plan might have changed
 * (e.g. after a subscription webhook or cancellation).
 *
 * `refetch` is memoised with `useCallback` so callers can list it as an
 * effect dependency without the effect re-running on every render.
 *
 * This avoids fetching the subscription status in every component that needs
 * it, and prevents the multiple known instances of inline `isPro` fetching
 * that can drift apart.
 */
export function useSubscription() {
  const [isPro, setIsPro] = useState<boolean>(false);

  const refetch = useCallback(async () => {
    try {
      const response = await fetch("/api/subscription/create", {
        method: "GET",
      });

      if (!response.ok) {
        return false;
      }

      const data: { currentSubscription?: { plan?: { name: string } } } =
        await response.json();
      const currentPlan: string | undefined =
        data.currentSubscription?.plan?.name;

      setIsPro(currentPlan === "PRO");
      return true;
    } catch (error) {
      console.error("Error fetching subscription:", error);
      return false;
    }
  }, []);

  // Initial fetch on mount. `refetch` awaits the network response before its
  // first `setIsPro`, so this is not a synchronous update inside the effect -
  // the rule cannot see through the async boundary and flags the call site
  // regardless. Same pattern as `use-dashboard-data.ts`.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  return { isPro, refetch };
}