# 2026-10-23 — Offline handling: connectivity UI + read-only cache

## What the user saw

1. **Cold start without internet** — the Android WebView error page
   (`net::ERR_INTERNET_DISCONNECTED`) with the Vercel URL. The app loads a
   remote URL (`capacitor.config.ts` → `server.url`), so there is no local HTML
   to render before the network answers.
2. **Connection lost while the app was open** — the shell stayed, but requests
   failed inconsistently: the dashboard showed "Failed to load data", parts of
   the task page only logged to the console, and checkout / cancel / save
   silently did nothing.

The landing page also advertises "offline support", which this change makes
true for the already-open app (read-only), but **not** for cold start.

## What this change does (tier 1, web only)

| File | Change |
| --- | --- |
| `stores/network-store.ts` | Shared connectivity state. Driven by the `online` / `offline` events **and** by the outcome of real requests, because `navigator.onLine` reports `true` behind a captive portal. `checkConnection()` probes a static asset (`/favicon.ico`) with `HEAD`, `no-store` and a cache-busting query: CDN-served, no database, and skipped by the proxy because the path contains a dot. |
| `components/network/network-watcher.tsx` | Mounted once in the layout. Wires the events, re-probes every 15s while offline (Android does not always fire `online`), and toasts "Back online" on the transition. |
| `components/shared/offline-banner.tsx` | Persistent bottom pill: "You're offline - showing saved data. Changes can't be saved." with a Retry button. Bottom rather than top because the navbar is fixed and the page headers already sit close to it. Sits above the mobile tab bar on app routes. |
| `lib/api-client.ts` | `apiFetch` wrapper: hands the `Response` back untouched, but a transport failure marks the store offline and throws `OfflineError`. Aborts are not offline signals. `isOfflineError()` also recognises server-action failures, which bypass the wrapper. |
| `lib/offline-cache.ts` | Namespaced localStorage cache (`remindly:cache:*`) with timestamp, defensive reads, and `clearOfflineCache()`. |
| `stores/analytics-store.ts` | Caches the last payload per time range. On a failed refresh it restores that payload and sets `staleAt` instead of blanking the screen; with no cache it sets an offline-specific error. |
| `app/dashboard/page.tsx` | Stale-data note ("showing your last saved analytics from 10:32") with Retry, plus an error note with Retry when there is nothing cached. Refresh while offline explains itself instead of spinning. |
| `app/task/page.tsx` | Caches tasks, categories and labels per user. On failure it renders the cached tasks with the stale note, or a "Couldn't load your tasks" card with Retry. Write actions (create, complete, delete) are blocked while offline with a toast, before the user types anything. The cached user is used when `getSession()` cannot reach the server, so losing connectivity does not bounce a signed-in user to `/login`; a null session from a reachable server still does. |
| `app/subscription/page.tsx` | Caches the plan, falls back to it offline, and displays errors (the `error` state existed but was never rendered). Checkout and cancel are guarded. |
| `hooks/use-subscription.ts` | Caches the PRO/FREE tier so a PRO user keeps the PRO layout offline instead of silently dropping to the free view. |
| `components/shared/stale-data-note.tsx` | Shared "showing saved data from …" note with a Retry action. |
| Sign-out paths | `profile.tsx`, the navbar mobile menu, the bottom tab bar and account deletion call `clearOfflineCache()`, so a cached task list never survives into another account on the same device. |

## Limits / not done

- **Cold start offline is unchanged.** With `server.url` there is nothing
  cached to boot. Fixing it means either a native offline screen in
  `MainActivity` (new APK) or bundling the web shell locally (architecture
  change). Both are out of scope here.
- **No offline mutation queue.** Reads come from the cache; writes require a
  connection. Queuing task creation/completion with conflict resolution is a
  separate, much larger feature.
- The cache is unencrypted localStorage, scoped to the device and cleared on
  sign-out. It holds only what the user could already see.
- `navigator.onLine` can still be wrong on captive portals; the request-based
  signal is what corrects it.
- The marketing claim "offline support" remains optimistic until cold start is
  handled.

## Verification

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors, 49 warnings (no new warnings; `main` had 50).
- `npm run build` — success.
- On-device check (airplane mode, open app, cached screens) is for the app
  owner after deployment. JS-only change: no APK rebuild needed.
