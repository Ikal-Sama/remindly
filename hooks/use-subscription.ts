import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { readCache, writeCache } from "@/lib/offline-cache";

const CACHE_KEY = "subscription:isPro";

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

  /**
   * True until the first subscription request settles.
   *
   * The tier decides which analytics endpoint is valid (`/api/analytics` for
   * PRO, `/api/tasks/summary` for FREE). Consumers must not fetch analytics
   * before this resolves, otherwise a PRO user silently receives the
   * free-tier payload and never sees the detailed data.
   */
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refetch = useCallback(async () => {
    try {
      const response = await apiFetch("/api/subscription/create", {
        method: "GET",
      });

      if (!response.ok) {
        return false;
      }

      const data: { currentSubscription?: { plan?: { name: string } } } =
        await response.json();
      const currentPlan: string | undefined =
        data.currentSubscription?.plan?.name;
      const nextIsPro = currentPlan === "PRO";

      setIsPro(nextIsPro);
      writeCache(CACHE_KEY, nextIsPro);
      return true;
    } catch (error) {
      console.error("Error fetching subscription:", error);

      // Offline: keep the last known tier so a PRO user still gets the PRO
      // layout instead of silently dropping to the free one.
      const cached = readCache<boolean>(CACHE_KEY);
      if (cached) setIsPro(cached.data);

      return false;
    } finally {
      // The tier has settled either way - resolved or failed - so consumers
      // can stop waiting for it. A failed lookup leaves `isPro` as false,
      // which is the correct fallback for a user without a PRO subscription.
      setIsLoading(false);
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

  return { isPro, isLoading, refetch };
}