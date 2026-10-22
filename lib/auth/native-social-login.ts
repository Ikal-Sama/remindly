import { Capacitor } from "@capacitor/core";

/**
 * Google sign-in for the native (Capacitor) build.
 *
 * Google refuses to run its OAuth flow inside an embedded WebView, so the
 * browser redirect strands the user in the system browser with the session
 * cookie trapped in the browser's cookie jar. The native build therefore uses
 * the platform "Sign in with Google" credential flow and hands the resulting
 * ID token to Better Auth, which sets the session cookie inside the app's own
 * cookie jar - no browser hand-off, no deep link, no cookie transfer.
 *
 * The ID token has to be issued for the *web* OAuth client, because that is
 * the client id the server verifies the token against (`GOOGLE_CLIENT_ID`).
 */
const GOOGLE_WEB_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/** Keeps the plugin's credential state alive between clicks. */
let initialization: Promise<void> | null = null;

/** True when the app runs inside the Capacitor shell rather than a browser. */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/** True when the user dismissed the native account picker on purpose. */
export function isNativeSignInCancelled(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "USER_CANCELLED"
  );
}

/** True when the installed app is too old to ship the social login plugin. */
function isPluginMissing(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "UNIMPLEMENTED"
  );
}

/**
 * Runs the native Google credential flow.
 *
 * Returns the ID token on success, or `null` on the web - where callers should
 * fall back to the regular OAuth redirect instead.
 */
export async function requestNativeGoogleIdToken(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;

  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error(
      "NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing - native Google sign-in is not configured.",
    );
  }

  // Imported lazily so the web bundle never pulls in the native plugin.
  const { SocialLogin } = await import("@capgo/capacitor-social-login");

  try {
    if (!initialization) {
      initialization = SocialLogin.initialize({
        google: { webClientId: GOOGLE_WEB_CLIENT_ID, mode: "online" },
      }).catch((error) => {
        // Do not cache a failed initialization, otherwise every later attempt
        // would replay the same error.
        initialization = null;
        throw error;
      });
    }
    await initialization;

    const { result } = await SocialLogin.login({
      provider: "google",
      options: { scopes: ["email", "profile"] },
    });

    if (!("idToken" in result) || !result.idToken) {
      throw new Error("Google did not return an ID token.");
    }

    return result.idToken;
  } catch (error) {
    if (isPluginMissing(error)) {
      throw new Error(
        "This build of the app cannot sign in with Google. Please install the latest version.",
      );
    }
    throw error;
  }
}
