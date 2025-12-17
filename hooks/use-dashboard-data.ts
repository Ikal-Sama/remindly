"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth/auth-client";

interface DashboardData {
  user: any;
  isPro: boolean;
  tasks: any[];
  analytics: any;
  categories: any[];
  labels: any[];
  loading: {
    tasks: boolean;
    analytics: boolean;
    subscription: boolean;
  };
}

interface CacheData {
  data: any;
  timestamp: number;
}

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

  // Cache state
  const [cache, setCache] = useState<{
    subscription: CacheData | null;
    tasks: CacheData | null;
    analytics: CacheData | null;
    categories: CacheData | null;
    labels: CacheData | null;
  }>({
    subscription: null,
    tasks: null,
    analytics: null,
    categories: null,
    labels: null,
  });

  const isCacheValid = useCallback((cacheData: CacheData | null) => {
    return cacheData && Date.now() - cacheData.timestamp < CACHE_DURATION;
  }, []);

  const fetchWithCache = useCallback(
    async <T>(
      key: keyof typeof cache,
      fetcher: () => Promise<T>
    ): Promise<T> => {
      const cacheData = cache[key];

      if (isCacheValid(cacheData)) {
        return cacheData!.data as T;
      }

      const data = await fetcher();

      setCache((prev) => ({
        ...prev,
        [key]: {
          data,
          timestamp: Date.now(),
        },
      }));

      return data;
    },
    [cache, isCacheValid]
  );

  const fetchUserData = useCallback(async () => {
    try {
      const session = await authClient.getSession();
      if (session.data?.user) {
        setDashboardData((prev) => ({
          ...prev,
          user: session?.data?.user,
        }));

        // Fetch subscription status
        const subscriptionData = await fetchWithCache(
          "subscription",
          async () => {
            const response = await fetch("/api/subscription/create", {
              method: "GET",
            });
            if (!response.ok) throw new Error("Failed to fetch subscription");
            return response.json();
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
        return response.json();
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
        return response.json();
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
          return response.json();
        }),
        fetchWithCache("labels", async () => {
          const response = await fetch("/api/labels");
          if (!response.ok) throw new Error("Failed to fetch labels");
          return response.json();
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
    fetchUserData();
  }, []);

  useEffect(() => {
    if (dashboardData.user) {
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
        setCache((prev) => ({ ...prev, tasks: null }));
        fetchTasksData();
      }
      if ((type === "analytics" || type === "all") && dashboardData.isPro) {
        // Clear analytics cache and refetch
        setCache((prev) => ({ ...prev, analytics: null }));
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
