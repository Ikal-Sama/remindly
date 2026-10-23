import { useNetworkStore } from "@/stores/network-store";

/**
 * `true` while the app believes it has a usable connection to the internet.
 *
 * Starts as `true` and is corrected on mount by `NetworkWatcher`, then kept up
 * to date by browser events and by request outcomes.
 */
export function useNetworkStatus(): boolean {
  return useNetworkStore((state) => state.online);
}
