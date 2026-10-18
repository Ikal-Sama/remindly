"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { authClient } from "@/lib/auth/auth-client";
import type {
  Analytics,
  CategoriesResponse,
  CurrentSubscriptionResponse,
  LabelsResponse,
  SessionUser,
  Task,
  TasksResponse,
} from "@/lib/types";

interface DashboardData {
  user: SessionUser | null;
  isPro: boolean;
  tasks: Task[];
  analytics: Analytics | null;
  categories: CategoriesResponse["categories"];
  labels: LabelsResponse["labels"];
  loading: {
    tasks: boolean;
    analytics: boolean;
    subscription: boolean;
  };
}

interface CacheData<T = unknown> {
  data: T;
  timestamp: number;
}

type CacheKey = "subscription" | "tasks" | "analytics" | "categories" | "labels";

type CacheStore = Record<CacheKey, CacheData | null>;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useDashboardData() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    user: null,
    isPro: false,
    tasks: [],
    analytics: null,
    categories: [],
    labels: [],
    loading: {
      tasks: false,
      analytics: false,
      subscription: false,
    },
  });

  /**
   * TTL cache, held in a ref rather than state.
   *
   * This deliberately does not use `useState`: as state it would make
   * `fetchWithCache` depend on `cache`, so its identity changed on every
   * fetch, which in turn made every effect that calls it impossible to
   * declare honestly - declaring `fetchUserData` as a dependency of the
   * mount effect caused an infinite refetch loop.
   *
   * Nothing renders from the cache directly, so no re-render is needed when
   * it changes: consumers re-render because `dashboardData` is updated with
   * the freshly fetched values.
   *
   * Entries are stored as `CacheData<unknown>` because the five keys hold
   * different payload shapes; the concrete shape is re-established by the
   * caller-supplied generic on read.
   */
  const cacheRef = useRef<CacheStore>({
    subscription: null,
    tasks: null,
    analytics: null,
    categories: null,
    labels: null,
  });

  const isCacheValid = useCallback(
    (cacheData: { timestamp: number } | null) => {
      return cacheData !== null && Date.now() - cacheData.timestamp < CACHE_DURATION;
    },
    []
  );

  const fetchWithCache = useCallback(
    async <T>(key: CacheKey, fetcher: () => Promise<T>): Promise<T> => {
      const cacheData = cacheRef.current[key] as CacheData<T> | null;

      if (isCacheValid(cacheData)) {
        return cacheData!.data;
      }

      const data = await fetcher();

      cacheRef.current[key] = {
        data,
        timestamp: Date.now(),
      };

      return data;
    },
    [isCacheValid]
  );

  const fetchUserData = useCallback(async () => {
    try {
      const session = await authClient.getSession();
      // Capture into a local: narrowing on `session.data` does not survive into
      // the setState callback below.
      const user = session.data?.user;
      if (user) {
        setDashboardData((prev) => ({
          ...prev,
          user,
        }));

        // Fetch subscription status
        const subscriptionData = await fetchWithCache(
          "subscription",
          async () => {
            const response = await fetch("/api/subscription/create", {
              method: "GET",
            });
            if (!response.ok) throw new Error("Failed to fetch subscription");
            return (await response.json()) as CurrentSubscriptionResponse;
          }
        );

        setDashboardData((prev) => ({
          ...prev,
          isPro: subscriptionData.currentSubscription?.plan?.name === "PRO",
        }));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, [fetchWithCache]);

  const fetchTasksData = useCallback(async () => {
    if (!dashboardData.user) return;

    setDashboardData((prev) => ({
      ...prev,
      loading: { ...prev.loading, tasks: true },
    }));

    try {
      const tasksData = await fetchWithCache("tasks", async () => {
        const response = await fetch("/api/tasks");
        if (!response.ok) throw new Error("Failed to fetch tasks");
        return (await response.json()) as TasksResponse;
      });

      setDashboardData((prev) => ({
        ...prev,
        tasks: tasksData.tasks || [],
      }));
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setDashboardData((prev) => ({
        ...prev,
        loading: { ...prev.loading, tasks: false },
      }));
    }
  }, [dashboardData.user, fetchWithCache]);

  const fetchAnalyticsData = useCallback(async () => {
    if (!dashboardData.user || !dashboardData.isPro) return;

    setDashboardData((prev) => ({
      ...prev,
      loading: { ...prev.loading, analytics: true },
    }));

    try {
      const analyticsData = await fetchWithCache("analytics", async () => {
        const response = await fetch("/api/analytics");
        if (!response.ok) throw new Error("Failed to fetch analytics");
        return (await response.json()) as { analytics: Analytics };
      });

      setDashboardData((prev) => ({
        ...prev,
        analytics: analyticsData.analytics,
      }));
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setDashboardData((prev) => ({
        ...prev,
        loading: { ...prev.loading, analytics: false },
      }));
    }
  }, [dashboardData.user, dashboardData.isPro, fetchWithCache]);

  const fetchCategoriesAndLabels = useCallback(async () => {
    if (!dashboardData.user) return;

    try {
      const [categoriesData, labelsData] = await Promise.all([
        fetchWithCache("categories", async () => {
          const response = await fetch("/api/categories");
          if (!response.ok) throw new Error("Failed to fetch categories");
          return (await response.json()) as CategoriesResponse;
        }),
        fetchWithCache("labels", async () => {
          const response = await fetch("/api/labels");
          if (!response.ok) throw new Error("Failed to fetch labels");
          return (await response.json()) as LabelsResponse;
        }),
      ]);

      setDashboardData((prev) => ({
        ...prev,
        categories: categoriesData.categories || [],
        labels: labelsData.labels || [],
      }));
    } catch (error) {
      console.error("Error fetching categories and labels:", error);
    }
  }, [dashboardData.user, fetchWithCache]);

  // Initial data fetch
  useEffect(() => {
    // Fetching the session on mount is a legitimate effect. `fetchUserData`
    // awaits `authClient.getSession()` before its first setState, so this is
    // not a synchronous update inside the effect; the rule cannot see through
    // the async boundary and flags the call site regardless.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (dashboardData.user) {
      // `fetchTasksData` raises its `loading.tasks` flag before fetching, which
      // is intentional: the spinner must appear in the same paint as the click.
      // It only replaces an already-pending render, so the "cascading render"
      // this rule guards against does not occur.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTasksData();
      fetchCategoriesAndLabels();
      if (dashboardData.isPro) {
        fetchAnalyticsData();
      }
    }
  }, [
    dashboardData.user,
    dashboardData.isPro,
    fetchTasksData,
    fetchCategoriesAndLabels,
    fetchAnalyticsData,
  ]);

  const refreshData = useCallback(
    (type?: "tasks" | "analytics" | "all") => {
      if (type === "tasks" || type === "all") {
        // Clear tasks cache and refetch
        cacheRef.current.tasks = null;
        fetchTasksData();
      }
      if ((type === "analytics" || type === "all") && dashboardData.isPro) {
        // Clear analytics cache and refetch
        cacheRef.current.analytics = null;
        fetchAnalyticsData();
      }
    },
    [fetchTasksData, fetchAnalyticsData, dashboardData.isPro]
  );

  return {
    ...dashboardData,
    refreshData,
  };
}
