"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { useSubscription } from "@/hooks/use-subscription";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  PieChart,
  Activity,
  Download,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnalyticsStore } from "@/stores/analytics-store";
import { cn, TIME_RANGE_LABELS } from "@/lib/utils";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import { VerifyEmail } from "@/components/verify-email";
import type { SessionUser, TimeRange } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const {
    analytics,
    isLoading: analyticsLoading,
    fetchAnalytics,
    setIsPro: setAnalyticsIsPro,
  } = useAnalyticsStore();
  const { isPro, isLoading: subscriptionLoading } = useSubscription();
  const user = (session?.user ?? null) as SessionUser | null;
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push("/login");
    }
  }, [session, sessionLoading, router]);

  // Keep the analytics store in sync with the subscription hook's isPro value
  useEffect(() => {
    setAnalyticsIsPro(isPro);
  }, [isPro, setAnalyticsIsPro]);

  /**
   * Fetch the analytics once the subscription tier is known.
   *
   * The tier selects the endpoint (`/api/analytics` for PRO,
   * `/api/tasks/summary` for FREE). The previous version fired this effect on
   * mount only, while the tier was still resolving - so a PRO user got the
   * free-tier payload and, because the effect did not depend on the tier, it
   * never retried. The detailed data only appeared after pressing Refresh.
   *
   * The selected time range is part of the request too, so switching it
   * re-fetches the analytics for the new window.
   */
  useEffect(() => {
    if (subscriptionLoading) return;
    fetchAnalytics(isPro, timeRange);
  }, [subscriptionLoading, isPro, timeRange, fetchAnalytics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics(isPro, timeRange);
    setRefreshing(false);
  };

  if (sessionLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  // Show VerifyEmail component if user's email is not verified
  if (user && !user.emailVerified) {
    return <VerifyEmail email={user.email} />;
  }

  if (!isPro) {
    return (
      <div className="p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Basic task overview and insights
              </p>
            </div>
            <Button onClick={() => router.push("/choose-plan")}>
              Upgrade to PRO for detailed analytics
            </Button>
          </div>

          {/* Basic Metrics for FREE users */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Tasks */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Tasks
                    </p>
                    <h3 className="text-2xl font-bold mt-1">
                      {analytics?.summary?.totalTasks || 0}
                    </h3>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-500">
                        +12% from last month
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50">
                    <Target className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Completion Rate */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Completion Rate
                    </p>
                    <h3 className="text-2xl font-bold mt-1">
                      {analytics?.summary?.totalTasks &&
                      analytics?.summary?.totalTasks > 0
                        ? Math.round(
                            ((analytics?.summary?.completedTasks || 0) /
                              analytics?.summary?.totalTasks) *
                              100
                          )
                        : 0}
                      %
                    </h3>
                    <div className="flex items-center gap-1 mt-2">
                      {((analytics?.summary?.totalTasks &&
                        analytics.summary.totalTasks > 0 &&
                        Math.round(
                          ((analytics.summary.completedTasks || 0) /
                            analytics.summary.totalTasks) *
                            100
                        )) ||
                        0) >= 70 ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      )}
                      <span className="text-xs text-green-500">
                        Great progress!
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/50">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                </div>
                <Progress
                  value={
                    analytics?.summary?.totalTasks &&
                    analytics.summary.totalTasks > 0
                      ? Math.round(
                          (analytics.summary.completedTasks /
                            analytics.summary.totalTasks) *
                            100
                        )
                      : 0
                  }
                  className="mt-4"
                />
              </CardContent>
            </Card>

            {/* Pending Tasks */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Due Tasks
                    </p>
                    <h3 className="text-2xl font-bold mt-1">
                      {analytics?.summary?.tasksDueThisWeek || 0}
                    </h3>
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-yellow-500">
                        {analytics?.summary?.tasksDueThisWeek || 0} due this
                        week
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/50">
                    <Clock className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overdue Tasks */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Overdue Tasks
                    </p>
                    <h3 className="text-2xl font-bold mt-1">
                      {analytics?.summary?.overdueTasks || 0}
                    </h3>
                    <div className="flex items-center gap-1 mt-2">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-red-500">
                        {(analytics?.summary?.overdueTasks ?? 0) > 0
                          ? "Needs attention"
                          : "All caught up!"}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/50">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push("/task")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                      <Calendar className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">View All Tasks</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage your tasks and to-dos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push("/settings")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
                      <Target className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">Profile Settings</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage your account and preferences
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push("/task")}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                      <Plus className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">Create New Task</h3>
                      <p className="text-sm text-muted-foreground">
                        Add a new task to your list
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completionRate =
    analytics?.summary?.totalTasks && analytics.summary.totalTasks > 0
      ? Math.round(
          (analytics.summary.completedTasks / analytics.summary.totalTasks) *
            100
        )
      : 0;

  // Period-over-period change of the tasks created inside the selected range
  const tasksCreatedInRange = analytics?.summary?.tasksCreatedInRange ?? 0;
  const tasksCreatedPreviousPeriod =
    analytics?.summary?.tasksCreatedPreviousPeriod ?? 0;
  const createdChangePercent =
    tasksCreatedPreviousPeriod > 0
      ? Math.round(
          ((tasksCreatedInRange - tasksCreatedPreviousPeriod) /
            tasksCreatedPreviousPeriod) *
            100
        )
      : null;

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track your productivity and task completion patterns
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as TimeRange)}
              disabled={analyticsLoading}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")}
              />
              Refresh
            </Button>

            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Tasks */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Tasks
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    {analytics?.summary?.totalTasks || 0}
                  </h3>
                  <div className="flex items-center gap-1 mt-2">
                    {createdChangePercent === null ? (
                      <>
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-500">
                          {tasksCreatedInRange} new task
                          {tasksCreatedInRange === 1 ? "" : "s"} in the{" "}
                          {TIME_RANGE_LABELS[timeRange].toLowerCase()}
                        </span>
                      </>
                    ) : (
                      <>
                        {createdChangePercent >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                        <span
                          className={cn(
                            "text-xs",
                            createdChangePercent >= 0
                              ? "text-green-500"
                              : "text-red-500"
                          )}
                        >
                          {createdChangePercent >= 0 ? "+" : ""}
                          {createdChangePercent}% new tasks vs previous period
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50">
                  <Target className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Completion Rate
                  </p>
                  <h3 className="text-2xl font-bold mt-1">{completionRate}%</h3>
                  <div className="flex items-center gap-1 mt-2">
                    {completionRate >= 70 ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <span
                      className={cn(
                        "text-xs",
                        completionRate >= 70 ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {completionRate >= 70
                        ? "Great progress!"
                        : "Needs improvement"}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/50">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <Progress value={completionRate} className="mt-4" />
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending Tasks
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    {analytics?.summary?.incompleteTasks || 0}
                  </h3>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-yellow-500">
                      {analytics?.summary?.tasksDueThisWeek || 0} due this week
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/50">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overdue Tasks */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Overdue Tasks
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    {analytics?.summary?.overdueTasks || 0}
                  </h3>
                  <div className="flex items-center gap-1 mt-2">
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span className="text-xs text-red-500">
                      {(analytics?.summary?.overdueTasks ?? 0) > 0
                        ? "Needs attention"
                        : "All caught up!"}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/50">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Completion Trend */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
                Completion Trend
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {TIME_RANGE_LABELS[timeRange]}
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <AnalyticsCharts
                  completionTrend={analytics?.completionTrend}
                  categories={analytics?.categories || []}
                  type="completion"
                  range={timeRange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Task Distribution */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center">
                <PieChart className="w-4 h-4 mr-2 text-purple-500" />
                Task Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <AnalyticsCharts
                  completionTrend={analytics?.completionTrend}
                  categories={analytics?.categories || []}
                  type="distribution"
                  range={timeRange}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories and Labels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Categories */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Tasks by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.categories?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No categories found
                </p>
              ) : (
                <div className="space-y-4">
                  {analytics?.categories?.map((category) => {
                    const percentage =
                      category.total > 0
                        ? Math.round(
                            (category.completed / category.total) * 100
                          )
                        : 0;
                    return (
                      <div key={category.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm font-medium">
                              {category.name}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {category.completed}/{category.total} tasks
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Labels */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Most Used Labels</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.labels?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No labels found
                </p>
              ) : (
                <div className="space-y-3">
                  {[...(analytics?.labels ?? [])]
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 8)
                    .map((label) => (
                      <div
                        key={label.name}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="text-sm font-medium">
                            {label.name}
                          </span>
                        </div>
                        <Badge variant="secondary" className="ml-auto">
                          {label.count}
                        </Badge>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Productivity Insights */}
        <Card className="mt-6 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-500" />
              Productivity Insights
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Showing {TIME_RANGE_LABELS[timeRange].toLowerCase()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analytics?.summary?.mostProductiveDay ?? "—"}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                  Most productive day
                </div>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {analytics?.summary?.averageTasksPerDay ?? "—"}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  Avg. tasks per day
                </div>
              </div>
              <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {analytics?.summary?.currentStreak ?? 0}
                  {analytics?.summary?.currentStreak === 1
                    ? " day"
                    : " days"}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                  Day streak
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push("/task")}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                    <Calendar className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">View All Tasks</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your tasks and to-dos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push("/settings")}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
                    <Target className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Profile Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your account and preferences
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push("/task")}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                    <Plus className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Create New Task</h3>
                    <p className="text-sm text-muted-foreground">
                      Add a new task to your list
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
