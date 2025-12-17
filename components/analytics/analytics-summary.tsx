"use cache";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, CheckCircle, Clock } from "lucide-react";

interface AnalyticsSummaryProps {
  summary: {
    totalTasks: number;
    completedTasks: number;
    incompleteTasks: number;
    completionRate: number;
    tasksDueThisWeek: number;
    overdueTasks: number;
  };
}

export default function AnalyticsSummary({ summary }: AnalyticsSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalTasks}</div>
          <p className="text-xs text-muted-foreground">
            All tasks in your account
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.completedTasks}</div>
          <p className="text-xs text-muted-foreground">
            {summary.completionRate}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.incompleteTasks}</div>
          <p className="text-xs text-muted-foreground">
            Tasks pending completion
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.tasksDueThisWeek}</div>
          <p className="text-xs text-muted-foreground">
            {summary.overdueTasks} overdue
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
