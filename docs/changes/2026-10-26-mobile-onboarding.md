# 2026-10-26 - Native app opens on onboarding, not the marketing site

## What the user saw

Launching the Android app dropped the user on the marketing homepage, complete
with the website navbar and footer. Standard mobile apps open on an onboarding
screen (sign in / create account) or straight into the app, and never show
marketing chrome.

## Cause

The shell is a Capacitor WebView pointed at the production origin
(`capacitor.config.ts` -> `server.url`), so the first request was `/` - the
public landing page. Nothing on the client or the server knew the request came
from the app, so the proxy treated it like any browser visit.

## Fix

The app now identifies itself and the proxy routes it like an app:

| File | Change |
| --- | --- |
| `capacitor.config.ts` | `appendUserAgent: "RemindlyApp"` - appended to the WebView user agent on every request. |
| `proxy.ts` | Detects the `RemindlyApp` token. For the shell: `/` and the other marketing pages (`/about`, `/pricing`, `/contact`) redirect to `/welcome` for guests and `/dashboard` for signed-in users; `/welcome` redirects to `/dashboard` when a session cookie exists. For browsers, `/welcome` redirects to `/` so the app screen is never exposed on the website. |
| `app/welcome/page.tsx`, `components/welcome-screen.tsx` | New app-only onboarding screen: logo, three benefits, "Create a free account" and "I already have an account". Full-viewport, no navbar or footer, `noindex`. |
| `components/shared/navbar.tsx` | Renders nothing on `/welcome` so the screen owns the viewport. |
| `components/shared/footer.tsx` | Renders only on marketing pages (`isWebsiteRoute`). App and auth screens are footer-free on web and native alike. |
| `lib/utils.ts` | `WEBSITE_ROUTES` + `isWebsiteRoute()` next to the existing app-route helpers, shared by the footer and the proxy. |
| `app/robots.ts` | Disallows `/welcome`. |
| `android/app/build.gradle` | `versionCode 5` / `versionName "1.4"`. |

Redirects happen on the server before any HTML is sent, so there is no flash of
the homepage and no client-side auth check on boot.

`android/app/src/main/assets/capacitor.config.json` is generated and gitignored;
it was updated locally with the same `appendUserAgent` value for the release
build. A future `npx cap sync` regenerates it from `capacitor.config.ts`.

## Behavior

| Request | Result |
| --- | --- |
| App, guest, `/` or any marketing page | `307 /welcome` |
| App, signed in, `/` or any marketing page | `307 /dashboard` |
| App, signed in, `/welcome` | `307 /dashboard` |
| Browser, `/welcome` | `307 /` |
| App, guest, `/login`, `/signup` | Unchanged (auth forms) |

## Verification

1. Install `remindly-apk-release.apk` (1.4) over 1.3.
2. Launch while signed out: onboarding screen, no homepage, no footer.
3. Tap "Create a free account" / "I already have an account": the existing,
   working auth forms.
4. Sign in and relaunch: dashboard directly, no onboarding flash.
5. Log out and relaunch: onboarding again.
6. On the website (desktop and mobile browser), `/` still renders the landing
   page with the footer, and `/welcome` redirects to `/`.
