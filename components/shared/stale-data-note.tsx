"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCacheTime } from "@/lib/offline-cache";

/**
 * Inline note shown when a page is rendering the last cached payload instead
 * of fresh data.
 */
export function StaleDataNote({
  savedAt,
  label,
  onRetry,
}: {
  savedAt: string;
  label: string;
  onRetry: () => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
      <WifiOff className="size-4 shrink-0" aria-hidden />
      <span className="flex-1">
        Offline - showing your last saved {label} from{" "}
        {formatCacheTime(savedAt)}.
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 px-2 text-xs"
        onClick={onRetry}
      >
        <RefreshCw className="size-3" aria-hidden />
        Retry
      </Button>
    </div>
  );
}
