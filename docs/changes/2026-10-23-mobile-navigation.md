# 2026-10-23 — Mobile app navigation: session after Google sign-in + bottom tabs

## Symptom

Two problems in the Android app (Capacitor WebView):

1. After signing in with Google the dashboard loaded, but the header kept
   showing **Sign In** instead of the user avatar.
2. Mobile navigation was a hamburger menu mixing marketing links, app links and
   logout — not an app-style navigation for the signed-in screens.

## Root cause — stale session in the header

`requestNativeGoogleIdToken()` hands the ID token to
`authClient.$fetch("/sign-in/social")`, which sets the session cookie. That raw
request bypasses Better Auth's client session store, so the `useSession()` value
held by the already-mounted `Navbar` stayed at its pre-login value
(`data: null`). `router.push()` + `router.refresh()` only re-render server
components; they do not refetch the client store, so the avatar never appeared
until a manual reload.

Confirmed not a verification issue: unverified users get the `VerifyEmail`
screen instead of the dashboard, and the dashboard rendered.

## Fix — session

After the token is accepted, use a full navigation
(`window.location.replace(callbackURL)`) instead of a client-side push. A fresh
boot reads the session cookie before rendering the header and the app
navigation. This matches the existing sign-out pattern
(`window.location.href = "/login"`).

## Mobile navigation

| File | Change |
| --- | --- |
| `components/shared/mobile-bottom-nav.tsx` | New. Fixed bottom tab bar, phones only (`md:hidden`): **Dashboard** `/dashboard`, **Tasks** `/task`, **Profile** `/settings`. Active tab follows the pathname, top indicator + primary colour, `aria-current="page"`, and `env(safe-area-inset-bottom)` so it clears gesture bars. Hidden outside app routes and for signed-out users. |
| `lib/utils.ts` | `APP_NAV_ITEMS` and `isAppRoute()` — one source of truth for the app routes and the active-route check. |
| `components/shared/navbar.tsx` | On app routes the mobile hamburger is replaced by the existing `Profile` dropdown (Settings / Subscription / Logout); public marketing pages keep the hamburger. |
| `app/layout.tsx` | Renders `MobileBottomNav` once, globally. |
| `app/dashboard/page.tsx`, `app/task/page.tsx`, `app/settings/page.tsx` | Content gets `pb-24 md:pb-10` so the fixed bar never covers the last row. |
| `components/shared/footer.tsx` | On app routes the footer gets bottom padding on phones for the same reason. |

`Profile` on the bottom bar goes to `/settings`, which already holds the account,
password and billing tabs.

No APK rebuild is needed: the installed app loads the bundle from Vercel.

## Verification

- `npx tsc --noEmit` → clean.
- `npm run lint` → 0 errors (50 pre-existing warnings from the gitignored
  Android build artifacts).
- `npm run build` → success; the emitted CSS contains the tab bar utilities
  (`pb-24`, `env(safe-area-inset-bottom)`).
- On-device Google sign-in + tab bar: requires a device, verified by the app
  owner after deployment.

## Follow-up (2026-10-23) — Subscription, logout and a single profile entry point

Requested changes after trying the first version:

| Item | Change |
| --- | --- |
| Subscription in the bar | `APP_NAV_ITEMS` now includes `/subscription`, so it is an app route and gets the tab bar. |
| Logout in the bar | Fifth slot, an action rather than a route: `authClient.signOut()` then `window.location.replace("/login")`. Tinted `text-muted-foreground` → `hover:text-destructive` to separate it from the destinations. |
| Duplicate profile | Removed the avatar from the top bar on app routes. The bottom bar is now the only profile entry point there; the top bar keeps the theme toggle only. |
| Logo destination | On phones the logo opens `/dashboard` for a signed-in user (and `/` when signed out). On `md` and wider it still opens `/`. Implemented with two responsive links, no viewport JS. |
| Fit five tabs | Label size lowered from 11px to 10px (`text-[10px]`). |

`/subscription` also stops showing the marketing hamburger on mobile, because it
is now an app route and the bottom bar covers navigation.

## Notes / not done

- `/choose-plan` keeps the top navigation; it is part of the sign-up flow, not
  an everyday destination.
- The marketing pages are unchanged on mobile.
- Android hardware back button behaviour was not touched.
