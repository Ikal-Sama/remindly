import { NextResponse, type NextRequest } from "next/server";
import { arcjetInstance } from "@/lib/arcjet/config";
import { isWebsiteRoute } from "@/lib/utils";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/task",
  "/choose-plan",
  "/settings",
  "/subscription",
]; // only for logged-in users
const AUTH_ROUTES = ["/login", "/signup", "/register"]; // only for guests

/** User-agent token appended by the native shell. Keep in sync with capacitor.config.ts. */
const NATIVE_APP_UA = "RemindlyApp";

function isRouteMatch(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthenticated(request: NextRequest) {
  // Better Auth stores its session token in a cookie named `__Secure-better-auth.session_token` in production
  // We can't call Prisma/Better Auth in Edge middleware, so we just
  // infer auth state from the presence of this cookie.
  const sessionCookie =
    request.cookies.get("__Secure-better-auth.session_token") ||
    request.cookies.get("better-auth.session_token");

  // Check if cookie exists and has a value (not empty)
  return !!(sessionCookie?.value && sessionCookie.value.length > 0);
}

function isNativeShell(request: NextRequest) {
  // The Android shell appends this token to the WebView user agent
  // (see `appendUserAgent` in capacitor.config.ts). It lets us keep the
  // marketing website out of the app without waiting for client-side JS.
  return (request.headers.get("user-agent") || "").includes(NATIVE_APP_UA);
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Handle API routes with Arcjet protection
  if (pathname.startsWith("/api/")) {
    // Skip Arcjet for auth endpoints (Better Auth handles its own security)
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    // Skip Arcjet for Stripe webhooks - they are legitimate server-to-server requests
    if (pathname.startsWith("/api/webhooks/stripe")) {
      return NextResponse.next();
    }

    // Skip Arcjet for cron jobs - Vercel invokes them server-to-server with no
    // browser characteristics, which bot detection can misclassify. These
    // routes authenticate with the CRON_SECRET bearer token instead.
    if (pathname.startsWith("/api/cron")) {
      return NextResponse.next();
    }

    try {
      const decision = await arcjetInstance.protect(request);

      if (decision.isDenied()) {
        console.warn("Arcjet blocked request:", {
          reason: decision.reason,
          ip:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
          userAgent: request.headers.get("user-agent"),
          path: pathname,
        });

        if (decision.reason.isRateLimit()) {
          return NextResponse.json(
            { error: "Rate limit exceeded. Please try again later." },
            { status: 429 }
          );
        }

        if (decision.reason.isBot()) {
          return NextResponse.json(
            { error: "Bot traffic detected and blocked." },
            { status: 403 }
          );
        }

        if (decision.reason.isShield()) {
          return NextResponse.json(
            { error: "Request blocked by security shield." },
            { status: 403 }
          );
        }

        return NextResponse.json(
          { error: "Request blocked by security policy." },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error("Arcjet proxy error:", error);
      // Continue processing if Arcjet fails (fail open)
    }

    return NextResponse.next();
  }

  // Handle page routes with authentication
  const userIsAuthenticated = isAuthenticated(request);
  const protectedRoute = isRouteMatch(pathname, PROTECTED_ROUTES);
  const authRoute = isRouteMatch(pathname, AUTH_ROUTES);

  // 0) Route the native shell like an app, not a website. The app never shows
  // marketing pages: signed-in users land on the dashboard, guests on the
  // onboarding screen. Browsers never see the onboarding route.
  if (isNativeShell(request)) {
    if (pathname === "/welcome") {
      if (userIsAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } else if (isWebsiteRoute(pathname)) {
      return NextResponse.redirect(
        new URL(userIsAuthenticated ? "/dashboard" : "/welcome", request.url)
      );
    }
  } else if (pathname === "/welcome") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 1) Block unauthenticated users from protected routes
  if (protectedRoute && !userIsAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2) Block authenticated users from auth-only routes
  if (authRoute && userIsAuthenticated) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
