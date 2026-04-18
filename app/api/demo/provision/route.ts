import { NextRequest, NextResponse } from "next/server";
import { provisionDemoAccount } from "../../../../lib/demo";
import { getClientId, rateLimit, rateLimitResponse } from "../../../../lib/rate-limit";

// 5 provisioning attempts per IP per hour — each one creates real DB rows.
const DEMO_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  const rl = rateLimit(`demo:${clientId}`, DEMO_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl);

  try {
    const result = await provisionDemoAccount();
    return NextResponse.json({
      ok: true,
      redirectTo: result.redirectTo,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to provision demo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
