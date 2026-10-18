"use client";

import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import SubscriptionsPlan from "@/components/shared/subs-plan";
import { Spinner } from "@/components/ui/spinner";

export default function ChoosePlanPage() {
  // `data` is null while the session request is still in flight, so the
  // pending flag must be checked before deciding the user is signed out -
  // otherwise an authenticated user is redirected to /login on first render.
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-8">
      <SubscriptionsPlan />
    </div>
  );
}
