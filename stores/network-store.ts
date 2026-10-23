import { create } from "zustand";

/**
 * Connectivity state shared by the whole app.
 *
 * `navigator.onLine` alone is not trustworthy: it reports `true` behind a
 * captive portal or a Wi-Fi link without a route to the internet. The store is
 * therefore driven by two signals:
 *
 * 1. the browser `online` / `offline` events, and
 * 2. the outcome of real requests (see `lib/api-client.ts`), which is the most
 *    honest indicator we have.
 *
 * It starts as `online` so the server and the hydration pass agree; the
 * watcher corrects it on mount.
 */
interface NetworkStore {
  online: boolean;
  setOnline: (online: boolean) => void;
}

export const useNetworkStore = create<NetworkStore>()((set) => ({
  online: true,
  setOnline: (online) => set({ online }),
}));

export function markOnline(): void {
  useNetworkStore.getState().setOnline(true);
}

export function markOffline(): void {
  useNetworkStore.getState().setOnline(false);
}

/**
 * Cheap liveness probe.
 *
 * A static asset is used on purpose: it is served from the CDN, never touches
 * the database or Arcjet, and the middleware skips paths containing a dot.
 * `cache: "no-store"` plus a cache-busting query stop the browser from
 * answering from disk while offline.
 */
const PROBE_PATH = "/favicon.ico";

export async function checkConnection(): Promise<boolean> {
  if (typeof window === "undefined") return true;

  try {
    await fetch(`${PROBE_PATH}?probe=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
    });
    markOnline();
    return true;
  } catch {
    markOffline();
    return false;
  }
}
