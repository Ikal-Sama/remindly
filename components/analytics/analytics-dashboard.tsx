"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
} from "lucide-react";
import { useAnalyticsStore } from "@/stores/analytics-store";

interface AnalyticsDashboardProps {
  isPro: boolean;
  simplified?: boolean;
}

export default function AnalyticsDashboard({
  isPro,
  simplified = false,
}: AnalyticsDashboardProps) {
  const { analytics, isLoading, error, fetchAnalytics, setIsPro } =
    useAnalyticsStore();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    setIsPro(isPro);
  }, [isPro, setIsPro]);

  useEffect(() => {
    if (isPro) {
      fetchAnalytics();
    }
  }, [isPro, fetchAnalytics]);

  // Simplified mode for non-PRO users
  if (simplified && !isPro) {
    return (
      <div className="mt-8 space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        </div>

        {/* Simplified Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-bold">--%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Due This Week</p>
                  <p className="text-2xl font-bold">--</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-500">Overdue</p>
                  <p className="text-2xl font-bold">--</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Created (30d)</p>
                  <p className="text-2xl font-bold">--</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Prompt */}
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Unlock Detailed Analytics
            </h3>
            <p className="text-gray-500 mb-4">
              Upgrade to PRO plan to see real data, charts, productivity
              insights, and much more.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isPro) {
    return (
      <Card className="mt-8">
        <CardContent className="p-6 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analytics & Insights</h3>
          <p className="text-gray-500">
            Upgrade to PRO plan to access detailed analytics and insights about
            your tasks.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-8 space-y-6">
        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-32 animate-pulse">
              <CardContent className="h-full flex flex-col justify-center">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mt-8">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Analytics & Insights</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold">
                  {analytics.summary.completionRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Due This Week</p>
                <p className="text-2xl font-bold">
                  {analytics.summary.tasksDueThisWeek}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold">
                  {analytics.summary.overdueTasks}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Created (30d)</p>
                <p className="text-2xl font-bold">
                  {analytics.summary.tasksCreatedLast30Days}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories and Labels */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasks by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.categories.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No categories found
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.categories.map((category) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium">
                        {category.name}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {category.completed}/{category.total}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Labels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Used Labels</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.labels.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No labels found</p>
            ) : (
              <div className="space-y-3">
                {analytics.labels
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((label) => (
                    <div
                      key={label.name}
                      className="flex items-center justify-between"
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
                      <div
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${label.color}20`,
                          color: label.color,
                          border: `1px solid ${label.color}40`,
                        }}
                      >
                        {label.count}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productivity Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Productivity Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-medium">Recent Activity</p>
                <p className="text-sm text-gray-500">
                  {analytics.summary.tasksCompletedLast30Days} tasks completed
                  in the last 30 days
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <p className="font-medium">Task Creation</p>
                <p className="text-sm text-gray-500">
                  {analytics.summary.tasksCreatedLast30Days} new tasks created
                  in the last 30 days
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
