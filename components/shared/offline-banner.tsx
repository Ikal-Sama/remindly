"use client";

import { usePathname } from "next/navigation";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { cn, isAppRoute } from "@/lib/utils";
import { checkConnection } from "@/stores/network-store";

/**
 * Persistent "you're offline" notice.
 *
 * A floating pill at the bottom is used instead of a top banner: the navbar is
 * fixed and the page headers already sit close to it, so an inline strip would
 * cover content. On app routes the pill sits above the mobile tab bar.
 */
export function OfflineBanner() {
  const online = useNetworkStatus();
  const pathname = usePathname();

  if (online) return null;

  const handleRetry = async () => {
    const reachable = await checkConnection();
    if (!reachable) toast.error("Still offline. Check your connection.");
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-3 z-40 mx-auto flex max-w-md items-center gap-2 rounded-full border border-amber-500/40 bg-background/95 px-4 py-2 text-xs shadow-lg backdrop-blur-md sm:text-sm",
        isAppRoute(pathname)
          ? "bottom-[calc(5rem_+_env(safe-area-inset-bottom))] md:bottom-6"
          : "bottom-4",
      )}
    >
      <WifiOff className="size-4 shrink-0 text-amber-500" aria-hidden />
      <p className="flex-1 leading-tight">
        You&apos;re offline
        <span className="hidden sm:inline">
          {" "}
          - showing saved data. Changes can&apos;t be saved.
        </span>
        <span className="sm:hidden"> - showing saved data</span>
      </p>
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-2 text-xs"
        onClick={handleRetry}
      >
        Retry
      </Button>
    </div>
  );
}
