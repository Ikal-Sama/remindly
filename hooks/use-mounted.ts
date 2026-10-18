"use client";

import { useSyncExternalStore } from "react";

/** No-op subscribe: this hook only needs the server/client snapshot split. */
const subscribe = () => () => {};

/**
 * Returns `false` on the server and during the first client render, then `true`.
 *
 * Use this to guard browser-only output (for example `next-themes` resolving the
 * active theme) from hydration mismatches, where the server and the first client
 * render would otherwise disagree.
 *
 * Preferred over the `useState` + `useEffect` + `setMounted(true)` idiom, which
 * triggers an extra render pass on every mount and is flagged by the
 * `react-hooks/set-state-in-effect` rule.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true, // client snapshot
    () => false // server snapshot
  );
}
