import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/app"];
const PUBLIC_PATHS = ["/", "/login", "/s", "/api/login", "/api/auth", "/api/sessions"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /app routes
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Check for session cookie
  const sessionToken = req.cookies.get("vibe_session")?.value;
  if (!sessionToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie exists — let the server component validate it
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
