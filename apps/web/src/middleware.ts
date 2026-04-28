import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge middleware that gates protected routes by checking for the presence
// of the access_token cookie. The actual signature is verified by the API on
// every request — middleware is only a UX optimization to bounce
// unauthenticated users to /login before the page renders.
//
// Refresh tokens are not checked here because they're scoped to the
// /api/auth path and aren't visible to the middleware. If a user has only a
// refresh cookie (e.g., access expired), the page will render and the API
// client's interceptor will silently refresh on the first 401.

const PROTECTED_PREFIXES = ["/portal", "/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  const accessCookie = req.cookies.get("access_token");
  const refreshCookie = req.cookies.get("refresh_token");
  if (accessCookie?.value || refreshCookie?.value) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*"],
};
