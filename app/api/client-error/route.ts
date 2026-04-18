import { NextRequest, NextResponse } from "next/server";
import { captureException } from "../../../lib/observability";
import { getClientId, rateLimit } from "../../../lib/rate-limit";

// 60 client errors per IP per 5 minutes — prevents a looping bug in the
// browser from flooding the pipe.
const CLIENT_ERROR_LIMIT = { limit: 60, windowMs: 5 * 60 * 1000 };

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  const rl = rateLimit(`client-error:${clientId}`, CLIENT_ERROR_LIMIT);
  if (!rl.allowed) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => ({}));
  const err = new Error(String(body.message || "Unknown client error"));
  err.stack = body.stack ? String(body.stack) : undefined;

  captureException(err, {
    route: String(body.url || ""),
    extra: {
      type: body.type,
      filename: body.filename,
      lineno: body.lineno,
      colno: body.colno,
      userAgent: body.userAgent,
    },
  });

  return NextResponse.json({ ok: true });
}
