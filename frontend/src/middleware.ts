/**
 * middleware.ts — Route protection for ShortifyAI
 *
 * SECURITY: Redirects unauthenticated users away from protected routes.
 * Uses Supabase session cookies as the auth signal.
 *
 * NOTE: This is a lightweight cookie-presence check. For cryptographic JWT
 * verification in middleware, install @supabase/ssr and replace with
 * createServerClient from that package.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require the user to be logged in
const PROTECTED_PREFIXES = ["/dashboard", "/editor", "/onboarding"];

// Routes that logged-in users should NOT see (redirect to dashboard)
const AUTH_ONLY_PREFIXES = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for Supabase session cookies (format: sb-<projectRef>-auth-token)
  const hasSession = Array.from(request.cookies.getAll()).some(
    (cookie) =>
      cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")
  );

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  const isAuthOnly = AUTH_ONLY_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Unauthenticated user hitting a protected route → redirect to login
  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname); // preserve intended destination
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user hitting login/signup → redirect to dashboard
  if (isAuthOnly && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Only run middleware on matched routes — skip static assets and API routes
  matcher: [
    "/dashboard/:path*",
    "/editor/:path*",
    "/onboarding/:path*",
    "/login",
    "/signup",
  ],
};
