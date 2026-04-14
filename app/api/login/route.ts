import { NextRequest, NextResponse } from "next/server";
import { createSession } from "../../../lib/auth";
import { rateLimit, LOGIN_RATE_LIMIT, getClientId, rateLimitResponse } from "../../../lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(`login:${getClientId(req)}`, LOGIN_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl);

  const body = await req.json();
  const email = body.email?.toString().trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const user = await createSession(email);
  return NextResponse.json({ id: user.id, email: user.email });
}
