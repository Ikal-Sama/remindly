"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { memo, useMemo } from "react";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type ChartType = "completion" | "distribution" | "both";

interface AnalyticsChartsProps {
  completionTrend?: Array<{ date: string; completed: number }>;
  categories: Array<{
    name: string;
    color: string;
    total: number;
    completed: number;
  }>;
  type?: ChartType;
}

export const AnalyticsCharts = memo(function AnalyticsCharts({
  completionTrend = [],
  categories = [],
  type = "both",
}: AnalyticsChartsProps) {
  // Prepare completion trend data from analytics
  const completionTrendData = useMemo(
    () => ({
      labels:
        completionTrend?.map((item) => {
          const date = new Date(item.date);
          return date.toLocaleDateString("en-US", { weekday: "short" });
        }) || [],
      datasets: [
        {
          label: "Tasks Completed",
          data: completionTrend?.map((item) => item.completed) || [],
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 1,
        },
      ],
    }),
    [completionTrend]
  );

  const taskDistributionData = useMemo(
    () => ({
      labels: categories.map((cat) => cat.name),
      datasets: [
        {
          data: categories.map((cat) => cat.total),
          backgroundColor: categories.map((cat) => {
            // Convert hex to rgba with opacity
            const r = parseInt(cat.color.slice(1, 3), 16);
            const g = parseInt(cat.color.slice(3, 5), 16);
            const b = parseInt(cat.color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, 0.8)`;
          }),
          borderColor: categories.map((cat) => cat.color),
          borderWidth: 1,
        },
      ],
    }),
    [categories]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: {
          position: "top" as const,
        },
      },
    }),
    []
  );

  // Render based on the type prop
  if (type === "completion") {
    return (
      <Bar
        data={completionTrendData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
              },
            },
          },
        }}
      />
    );
  }

  if (type === "distribution") {
    return (
      <Pie
        data={taskDistributionData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
            },
          },
        }}
      />
    );
  }

  // Default: render both charts (for backward compatibility)
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Completion Trend (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <Bar data={completionTrendData} options={chartOptions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task Distribution by Category</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <Pie
            data={taskDistributionData}
            options={{
              ...chartOptions,
              maintainAspectRatio: false,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
});
