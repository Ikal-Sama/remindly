import { markOffline, markOnline } from "@/stores/network-store";

/**
 * Thrown when a request never reached the server because the device is
 * offline. Callers can branch on it instead of parsing `TypeError` messages.
 */
export class OfflineError extends Error {
  constructor(
    message = "You're offline. Check your connection and try again.",
  ) {
    super(message);
    this.name = "OfflineError";
  }
}

/**
 * `fetch` wrapper that keeps the connectivity store honest.
 *
 * The response is handed back untouched - callers still own status handling.
 * Only transport failures are converted, which is exactly the signal that
 * `navigator.onLine` misses. An abort is not an offline signal and is
 * re-thrown as-is.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  try {
    const response = await fetch(input, init);
    markOnline();
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    markOffline();
    throw new OfflineError();
  }
}

/**
 * Best-effort classification for errors that did not come through
 * `apiFetch`, such as Next.js server actions.
 */
export function isOfflineError(error: unknown): boolean {
  if (error instanceof OfflineError) return true;
  return (
    error instanceof TypeError && /fetch|network|load failed/i.test(error.message)
  );
}

/** Message suitable for a toast or an inline note. */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof OfflineError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
