"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type PlanName = "FREE" | "PRO" | null;

export default function SubscriptionPage() {
  const router = useRouter();
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

        const data = await response.json();
        const currentPlan: string | undefined =
          data?.currentSubscription?.plan?.name;

        if (currentPlan === "FREE" || currentPlan === "PRO") {
          setPlanName(currentPlan);
        } else {
          setPlanName(null);
        }
      } catch (err) {
        setError("Something went wrong while fetching your subscription.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, []);

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

      const data = await response.json();

      if (!data.url) {
        throw new Error("Missing checkout URL from server");
      }

      window.location.href = data.url as string;
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
  const isPro = planName === "PRO";

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
              ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
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
                  {isFree && (
                    <span className="text-xs text-muted-foreground">
                      You are using the Free plan
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
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  {isFree && "Max 10 task creation"}
                  {isPro && "Unlimited task creation"}
                  {!planName && "Task creation limit depends on your plan"}
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  Smart task reminders
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  Email notifications
                  {isFree && <span className="ml-1 text-xs">(limited)</span>}
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
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
                  {isLoading
                    ? "—"
                    : planName
                    ? planName === "PRO"
                      ? "Pro Member"
                      : "Free Member"
                    : "No Plan"}
                </p>
              </div>

              {isFree && !isLoading && !error && (
                <Button
                  size="lg"
                  className="w-full md:w-auto shadow-md"
                  onClick={handleUpgradeClick}
                >
                  Upgrade to Pro
                </Button>
              )}

              {isPro && !isLoading && !error && (
                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                  <p className="text-xs text-muted-foreground max-w-xs text-right">
                    You are on the <span className="font-semibold">Pro</span>{" "}
                    plan. Thank you for supporting GoTask.
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
