/**
 * Tiny localStorage cache that keeps the app readable without a network.
 *
 * Only the last successful payload is stored, per key. Everything is defensive:
 * a corrupt, evicted or unavailable entry (private mode, quota) just behaves
 * like a cache miss - it must never break a page.
 *
 * Entries are namespaced so signing out can wipe everything the previous user
 * left on the device.
 */
const PREFIX = "remindly:cache:";

export interface CachedValue<T> {
  data: T;
  /** ISO timestamp of when the value was written. */
  savedAt: string;
}

export function readCache<T>(key: string): CachedValue<T> | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedValue<T> | null;
    if (!parsed || typeof parsed !== "object" || !("data" in parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      PREFIX + key,
      JSON.stringify({ data, savedAt: new Date().toISOString() }),
    );
  } catch {
    // Caching is best effort - a full quota must not surface as an error.
  }
}

/** Drop every cached entry, e.g. when the user signs out. */
export function clearOfflineCache(): void {
  if (typeof window === "undefined") return;

  try {
    const keys = Object.keys(window.localStorage).filter((key) =>
      key.startsWith(PREFIX),
    );
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore - nothing to clean up if storage is unavailable.
  }
}

/** Human-readable timestamp for the "showing saved data" note. */
export function formatCacheTime(savedAt: string): string {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return "earlier";

  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}
