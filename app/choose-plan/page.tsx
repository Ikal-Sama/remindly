"use client";

import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import SubscriptionsPlan from "@/components/shared/subs-plan";

export default function ChoosePlanPage() {
  const { data: session, isPending: loading } = authClient.useSession();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Check if user already has an active subscription

  return (
    <div className="container mx-auto py-8">
      <SubscriptionsPlan />
    </div>
  );
}
