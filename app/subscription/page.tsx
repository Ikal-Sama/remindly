"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";

type PlanName = "FREE" | "PRO" | null;

export default function SubscriptionPage() {
  const router = useRouter();
  const { isPro, refetch } = useSubscription();
  const [planName, setPlanName] = useState<PlanName>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch("/api/subscription/create", {
          method: "GET",
        });

        if (!response.ok) {
          setError("Unable to load subscription details.");
          return;
        }

        const data: { currentSubscription?: { plan?: { name: string } } } = await response.json();
        const currentPlan: string | undefined =
          data.currentSubscription?.plan?.name;

        if (currentPlan === "FREE" || currentPlan === "PRO") {
          setPlanName(currentPlan);
        } else {
          setPlanName(null);
        }
      } catch {
        setError("Something went wrong while fetching your subscription.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  // Re-fetch if the plan might have changed
  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleUpgradeClick = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planName: "PRO" }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start payment session");
      }

      const data2 = await response.json();

      if (!data2.url) {
        throw new Error("Missing checkout URL from server");
      }

      window.location.href = data2.url as string;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upgrade failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      setError(null);

      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to cancel subscription");
      }

      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Cancellation failed";
      setError(message);
    } finally {
      setIsCancelling(false);
    }
  };

  const isFree = planName === "FREE";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-3xl">
        <div className="bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 rounded-3xl p-[1px] shadow-xl">
          <div className="bg-background rounded-3xl p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] text-primary/80">
                Subscription
              </p>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                Your current plan
              </h1>

              {isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading your subscription...
                </p>
              ) : planName ? (
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {planName} PLAN
                  </span>
                  {isPro && (
                    <span className="text-xs text-emerald-500">
                      Enjoy all Pro features
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You don&apos;t have an active subscription yet.
                </p>
              )}

              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  {isPro && "Unlimited task creation"}
                  {!isPro && "Max 10 task creation"}
                </li>
                <li className="flex items-center gap-2">
                  Smart task reminders
                </li>
                <li className="flex items-center gap-2">
                  Email notifications
                </li>
                <li className="flex items-center gap-2">
                  Priority access to new features (Pro only)
                </li>
              </ul>
            </div>

            <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">
                  Current status
                </p>
                <p className="text-2xl font-semibold tracking-tight">
                  {isLoading ? "—" : planName === "PRO" ? "Pro Member" : "Free Member"}
                </p>
              </div>

              {isFree && !isLoading && (
                <Button
                  size="lg"
                  className="w-full md:w-auto shadow-md"
                  onClick={handleUpgradeClick}
                >
                  Upgrade to Pro
                </Button>
              )}

              {isPro && !isLoading && (
                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                  <p className="text-xs text-muted-foreground max-w-xs text-right">
                    You are on the <span className="font-semibold">Pro</span>{" "}plan. Thank you for supporting GoTask.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full md:w-auto"
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                  >
                    {isCancelling ? "Cancelling..." : "Cancel subscription"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}