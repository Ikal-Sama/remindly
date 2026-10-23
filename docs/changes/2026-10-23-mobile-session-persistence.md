# 2026-10-23 — Mobile session lost after closing the app

## What the user saw

Sign in on the Android app, swipe the app out of recents, open it again, and
the app lands on the login screen. No logout happened, and the web build keeps
the session, so the problem is specific to the native shell.

## Root cause

The app is a Capacitor WebView pointed at the production URL
(`capacitor.config.ts` → `server.url`), so the only auth state is Better Auth's
session cookie (`__Secure-better-auth.session_token`).

Better Auth already sets a persistent cookie (`Max-Age` = 7 days), so this is
not a session-cookie problem. The problem is that **the Android WebView writes
cookies to disk lazily**. When the process is killed before that background
write happens — which is exactly what swiping from recents does right after a
sign-in — the cookie never reaches the persistent store. The next cold start
has no cookie, the proxy sees an unauthenticated request, and `/dashboard`
redirects to `/login`.

This is the long-standing Capacitor behaviour tracked in
[ionic-team/capacitor#3012](https://github.com/ionic-team/capacitor/issues/3012).
Capacitor 8 still does not flush the cookie store on pause, and its only
lifecycle cookie call (`CapacitorCookies.handleOnDestroy()`) removes **session**
cookies, which does not touch our persistent cookie.

## Fix

| File | Change |
| --- | --- |
| `android/app/src/main/java/com/ikalsama/remindly/MainActivity.java` | Override `onPause()` and call `CookieManager.getInstance().flush()`, forcing the WebView cookie store to disk whenever the app goes to the background. Swiping from recents happens after `onPause`, so the session cookie is already persisted by then. |
| `android/app/build.gradle` | `versionCode 4` / `versionName "1.3"` so the update installs over 1.2 (same signing key). |

This is native-only: web sessions were never affected, so no web code changed.

## Verification

1. Install `remindly-apk-release.apk` (1.3) over the previous build.
2. Sign in with Google.
3. Immediately swipe the app out of recents.
4. Reopen — the dashboard should load without asking to sign in again.
5. Repeat after a normal logout; the app must still land on `/login`.

## Notes

- A reinstall of the APK does not clear app data, so the existing v1.2
  installation updates in place.
- If the artwork or native shell changes again, rebuild with
  `JAVA_HOME=C:\Users\ikalsama\.jdks\jbr-21.0.11` and
  `.\gradlew.bat assembleRelease` from `android/`.
