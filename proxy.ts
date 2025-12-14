import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/choose-plan",
  "/settings",
  "/subscription",
]; // only for logged-in users
const AUTH_ROUTES = ["/login", "/signup", "/register"]; // only for guests

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

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const userIsAuthenticated = isAuthenticated(request);
  const protectedRoute = isRouteMatch(pathname, PROTECTED_ROUTES);
  const authRoute = isRouteMatch(pathname, AUTH_ROUTES);

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
