import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLink } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", req.url));
  }

  const result = await verifyMagicLink(token);

  if (!result.valid) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(result.error)}`, req.url));
  }

  return NextResponse.redirect(new URL("/app", req.url));
}
