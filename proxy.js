import { NextResponse } from "next/server";

/**
 * Next.js 16.2 Proxy — runs at the edge before every matched request is served.
 *
 * Responsibility: Redirect unauthenticated users away from protected routes.
 *
 * Strategy: checks for the presence of the JWT token cookie set by lib/token.js
 * after a successful login. The cookie is not HttpOnly (the backend uses Bearer
 * tokens, not cookie-based auth), so this check is a first-line redirect — the
 * backend itself validates the token on every protected API call.
 *
 * TODO: Install `jose` and add jwtVerify() here to prevent forged cookies from
 * bypassing the edge redirect. Ensure JWT_SECRET in .env.local matches the
 * backend's JWT_SECRET value.
 */
export function proxy(request) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    // Preserve the intended destination so the login page can redirect there
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Matcher config — proxy only runs on these paths.
 * All public routes (landing, search, chef profiles, auth pages) are excluded.
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chef-portal/:path*",
    "/admin/:path*",
  ],
};
