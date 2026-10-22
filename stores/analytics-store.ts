import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Analytics } from "@/lib/types";

export type { Analytics };

interface AnalyticsStore {
  analytics: Analytics | null;
  isLoading: boolean;
  error: string | null;
  isPro: boolean;
  setIsPro: (isPro: boolean) => void;
  fetchAnalytics: (isProOverride?: boolean) => Promise<void>;
  refreshAnalytics: (isProOverride?: boolean) => Promise<void>;
  updateAnalytics: (analytics: Analytics) => void;
  incrementTaskCount: (isCompleted: boolean) => void;
  decrementTaskCount: (isCompleted: boolean) => void;
  updateTaskCompletion: (fromCompleted: boolean, toCompleted: boolean) => void;
  clearError: () => void;
  reset: () => void;
}

export const useAnalyticsStore = create<AnalyticsStore>()(
  devtools(
    (set, get) => ({
      analytics: null,
      isLoading: false,
      error: null,
      isPro: false,

      setIsPro: (isPro) => set({ isPro }),

      fetchAnalytics: async (isProOverride) => {
        /**
         * Prefer an explicitly supplied tier over the one held in the store.
         *
         * The store's `isPro` is synced from the subscription hook by an
         * effect, so it can still be stale (`false`) at the moment a caller
         * that already knows the tier asks for data. Reading it here would
         * then hit the free-tier endpoint for a PRO user.
         */
        const isPro = isProOverride ?? get().isPro;
        set({ isLoading: true, error: null });

        try {
          const endpoint = isPro ? "/api/analytics" : "/api/tasks/summary";
          const response = await fetch(endpoint);

          if (response.ok) {
            const data = await response.json();
            set({
              analytics: isPro
                ? data.analytics
                : {
                    summary: data,
                    categories: [],
                    labels: [],
                    completionTrend: [],
                  },
              isLoading: false,
            });
          } else if (response.status === 403) {
            // For free users, try to get basic task data
            if (!isPro) {
              const basicResponse = await fetch("/api/tasks/summary");
              if (basicResponse.ok) {
                const basicData = await basicResponse.json();
                set({
                  analytics: {
                    summary: basicData,
                    categories: [],
                    labels: [],
                    completionTrend: [],
                  },
                  isLoading: false,
                });
                return;
              }
            }
            set({
              error: isPro
                ? "Analytics is a PRO feature"
                : "Failed to load task data",
              isLoading: false,
            });
          } else {
            set({ error: "Failed to load data", isLoading: false });
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          set({ error: "Failed to load data", isLoading: false });
        }
      },

      refreshAnalytics: async (isProOverride) => {
        await get().fetchAnalytics(isProOverride);
      },

      updateAnalytics: (analytics) => set({ analytics }),

      incrementTaskCount: (isCompleted) => {
        const { analytics } = get();
        if (!analytics) return;

        const newAnalytics = {
          ...analytics,
          summary: {
            ...analytics.summary,
            totalTasks: analytics.summary.totalTasks + 1,
            completedTasks: isCompleted
              ? analytics.summary.completedTasks + 1
              : analytics.summary.completedTasks,
            incompleteTasks: isCompleted
              ? analytics.summary.incompleteTasks
              : analytics.summary.incompleteTasks + 1,
            completionRate: 0, // Will be recalculated below
            tasksCreatedLast30Days:
              analytics.summary.tasksCreatedLast30Days + 1,
          },
        };

        // Recalculate completion rate
        newAnalytics.summary.completionRate =
          newAnalytics.summary.totalTasks > 0
            ? Math.round(
                (newAnalytics.summary.completedTasks /
                  newAnalytics.summary.totalTasks) *
                  100
              )
            : 0;

        set({ analytics: newAnalytics });
      },

      decrementTaskCount: (wasCompleted) => {
        const { analytics } = get();
        if (!analytics) return;

        const newAnalytics = {
          ...analytics,
          summary: {
            ...analytics.summary,
            totalTasks: Math.max(0, analytics.summary.totalTasks - 1),
            completedTasks: wasCompleted
              ? Math.max(0, analytics.summary.completedTasks - 1)
              : analytics.summary.completedTasks,
            incompleteTasks: wasCompleted
              ? analytics.summary.incompleteTasks
              : Math.max(0, analytics.summary.incompleteTasks - 1),
            completionRate: 0, // Will be recalculated below
            tasksCreatedLast30Days: Math.max(
              0,
              analytics.summary.tasksCreatedLast30Days - 1
            ),
          },
        };

        // Recalculate completion rate
        newAnalytics.summary.completionRate =
          newAnalytics.summary.totalTasks > 0
            ? Math.round(
                (newAnalytics.summary.completedTasks /
                  newAnalytics.summary.totalTasks) *
                  100
              )
            : 0;

        set({ analytics: newAnalytics });
      },

      updateTaskCompletion: (fromCompleted, toCompleted) => {
        const { analytics } = get();
        if (!analytics) return;

        const newAnalytics = {
          ...analytics,
          summary: {
            ...analytics.summary,
            completedTasks: toCompleted
              ? analytics.summary.completedTasks + 1
              : Math.max(0, analytics.summary.completedTasks - 1),
            incompleteTasks: toCompleted
              ? Math.max(0, analytics.summary.incompleteTasks - 1)
              : analytics.summary.incompleteTasks + 1,
            completionRate: 0, // Will be recalculated below
            tasksCompletedLast30Days: toCompleted
              ? analytics.summary.tasksCompletedLast30Days + 1
              : Math.max(0, analytics.summary.tasksCompletedLast30Days - 1),
          },
        };

        // Recalculate completion rate
        newAnalytics.summary.completionRate =
          newAnalytics.summary.totalTasks > 0
            ? Math.round(
                (newAnalytics.summary.completedTasks /
                  newAnalytics.summary.totalTasks) *
                  100
              )
            : 0;

        set({ analytics: newAnalytics });
      },

      clearError: () => set({ error: null }),

      reset: () =>
        set({ analytics: null, isLoading: false, error: null, isPro: false }),
    }),
    {
      name: "analytics-store",
    }
  )
);
