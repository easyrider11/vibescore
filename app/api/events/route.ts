import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { toJsonString } from "../../../lib/json";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = body.token?.toString();
  const type = body.type?.toString();
  const payload = body.payload ?? {};

  if (!token || !type) return NextResponse.json({ error: "Missing token/type" }, { status: 400 });

  const session = await prisma.interviewSession.findUnique({ where: { publicToken: token } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.event.create({ data: { sessionId: session.id, type, payload: toJsonString(payload) } });
  return NextResponse.json({ status: "ok" });
}
