"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { checkConnection, useNetworkStore } from "@/stores/network-store";

/**
 * Keeps the connectivity store in sync with the device.
 *
 * The `online` event is not fired on every Android network transition (flaky
 * mobile data, captive portals), so while offline we also probe every few
 * seconds. Recovery is announced once, from the store transition, so a
 * successful request can announce it too.
 */
export function NetworkWatcher() {
  useEffect(() => {
    const onOffline = () => useNetworkStore.getState().setOnline(false);
    const onOnline = () => {
      void checkConnection();
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    const unsubscribe = useNetworkStore.subscribe((state, previous) => {
      if (state.online && !previous.online) {
        toast.success("Back online");
      }
    });

    // `navigator.onLine` can be stale on first paint - confirm with a request.
    void checkConnection();

    const timer = window.setInterval(() => {
      if (!useNetworkStore.getState().online) {
        void checkConnection();
      }
    }, 15000);

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      unsubscribe();
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
