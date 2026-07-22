import { NextResponse } from "next/server";

/**
 * Next.js 16.2 Proxy — runs at the edge before every matched request is served.
 * (Previously called "middleware" — renamed to "proxy" in Next.js 16.2.)
 *
 * Responsibility: Protect authenticated routes.
 *
 * Current state (Phase A — Foundation):
 *   Passes all requests through. No authentication check is performed yet.
 *   The matcher config below is already scoped to protected routes so
 *   Phase B only needs to add verification logic inside the function body.
 *
 * TODO Phase B — JWT Verification:
 *
 *   1. Read the HTTP-only JWT cookie the backend sets on login:
 *        const token = request.cookies.get("token")?.value;
 *
 *   2. Verify using `jose` (edge-compatible; jsonwebtoken requires Node.js crypto):
 *        import { jwtVerify } from "jose";
 *        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
 *        try {
 *          const { payload } = await jwtVerify(token, secret);
 *        } catch {
 *          return NextResponse.redirect(new URL("/login", request.url));
 *        }
 *
 *   3. Redirect unauthenticated users:
 *        if (!token) {
 *          return NextResponse.redirect(new URL("/login", request.url));
 *        }
 *
 *   4. (Optional) Forward the decoded role to Server Components via header:
 *        const response = NextResponse.next();
 *        response.headers.set("x-user-role", payload.role);
 *        return response;
 *
 *   5. Add JWT_SECRET to .env.local (server-only, no NEXT_PUBLIC_ prefix).
 *   6. Run: npm install jose
 */
export function proxy(request) {
  // TODO Phase B: Replace this passthrough with JWT verification (see above).
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
