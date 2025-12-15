import { useAnalyticsStore } from "@/stores/analytics-store";

export const useAnalyticsUpdates = () => {
  const {
    incrementTaskCount,
    decrementTaskCount,
    updateTaskCompletion,
    refreshAnalytics,
  } = useAnalyticsStore();

  const onTaskCreated = (isCompleted: boolean = false) => {
    incrementTaskCount(isCompleted);
  };

  const onTaskDeleted = (wasCompleted: boolean) => {
    decrementTaskCount(wasCompleted);
  };

  const onTaskCompleted = (wasCompleted: boolean, isCompleted: boolean) => {
    updateTaskCompletion(wasCompleted, isCompleted);
  };

  const onTaskUpdated = () => {
    // For complex updates, it's safer to refresh the entire analytics
    refreshAnalytics();
  };

  return {
    onTaskCreated,
    onTaskDeleted,
    onTaskCompleted,
    onTaskUpdated,
    refreshAnalytics,
  };
};
