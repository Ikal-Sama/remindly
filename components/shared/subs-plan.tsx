"use client";

import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import { useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";

/**
 * Plan comparison with the appropriate call to action.
 *
 * Rendered both on the marketing landing page and on /choose-plan, so it has
 * to cope with three states:
 *
 *   signed out      FREE -> "Get Started" -> /signup
 *   signed in FREE  FREE -> "Your current plan" (disabled)
 *   signed in PRO   PRO  -> "Your current plan" (disabled)
 *
 * Every account is provisioned a FREE plan on signup, so FREE is never
 * something to select.
 */
export default function SubscriptionsPlan() {
  const router = useRouter();
  const { isPro, refetch } = useSubscription();

  const { data: session, isPending } = authClient.useSession();
  const isSignedIn = Boolean(session?.user);

  const [isLoading, setIsLoading] = useState(false);

  const startFree = () => {
    router.push(isSignedIn ? "/dashboard" : "/signup");
  };

  const startPro = async () => {
    if (!isSignedIn) {
      router.push("/signup");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planName: "PRO" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start payment session");
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error("Missing checkout URL from server");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to subscribe. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isFreeCurrent = isSignedIn && !isPro;

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
        Choose Your Plan
      </h2>
      <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
        Every account starts on FREE. Upgrade when you need more.
      </p>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* FREE Plan */}
        <div className="bg-background border rounded-xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold mb-2">FREE</h3>
          <p className="text-3xl font-bold mb-6">
            $0
            <span className="text-lg font-normal text-muted-foreground">
              /month
            </span>
          </p>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              </div>
              <span>Max 10 task creation</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              </div>
              <span>Auto email reminder for tasks</span>
            </li>
          </ul>

          <Button
            className="w-full"
            variant="secondary"
            onClick={startFree}
            disabled={isFreeCurrent}
          >
            {isPending
              ? "Loading…"
              : isFreeCurrent
              ? "Your current plan"
              : isSignedIn
              ? "Included with your account"
              : "Get Started"}
          </Button>
        </div>

        {/* PRO Plan */}
        <div className="bg-background border-2 border-primary rounded-xl p-8 shadow-sm relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
            POPULAR
          </div>
          <h3 className="text-2xl font-bold mb-2">PRO</h3>
          <p className="text-3xl font-bold mb-6">
            $5
            <span className="text-lg font-normal text-muted-foreground">
              /month
            </span>
          </p>

          <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              </div>
              <span>Unlimited task creation</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              </div>
              <span>Custom email reminder dates</span>
            </li>
          </ul>

          <Button
            className="w-full"
            onClick={startPro}
            disabled={isLoading || isPro}
          >
            {isPro ? "Your current plan" : "Upgrade to Pro"}
          </Button>
        </div>
      </div>
    </div>
  );
}