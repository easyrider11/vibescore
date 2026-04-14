import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { ok: boolean; error?: string }> = {};
  let ok = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true };
  } catch (err) {
    ok = false;
    checks.database = {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      time: new Date().toISOString(),
      uptime: typeof process !== "undefined" ? Math.floor(process.uptime()) : null,
      checks,
    },
    { status: ok ? 200 : 503 },
  );
}
