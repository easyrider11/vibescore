import { NextRequest, NextResponse } from "next/server";
import { createMagicLink } from "../../../../lib/auth";
import { sendMagicLinkEmail } from "../../../../lib/email";
import { rateLimit, LOGIN_RATE_LIMIT, getClientId, rateLimitResponse } from "../../../../lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(`magic:${getClientId(req)}`, LOGIN_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl);
  const body = await req.json();
  const email = body.email?.toString().trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const token = await createMagicLink(email);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const magicUrl = `${appUrl}/api/auth/verify?token=${token}`;

  const result = await sendMagicLinkEmail(email, magicUrl);

  if (!result.sent) {
    return NextResponse.json(
      { error: result.error || "Failed to send email" },
      { status: 500 }
    );
  }

  return NextResponse.json({ sent: true });
}
