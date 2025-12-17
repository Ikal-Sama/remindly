"use cache";

import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
  isPro?: boolean;
}

export default async function DashboardLayout({
  children,
  userName,
  isPro,
}: DashboardLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back{userName ? `, ${userName}` : ""}! Here's your task
            overview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isPro && (
            <div className="bg-linear-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              PRO
            </div>
          )}
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">{children}</div>
    </div>
  );
}
