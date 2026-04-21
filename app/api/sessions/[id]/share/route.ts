import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const session = await prisma.interviewSession.findFirst({
    where: { id, createdById: user.id },
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const enabled = body.enabled !== false; // default true

  if (enabled) {
    const token = session.publicReportToken || crypto.randomBytes(16).toString("hex");
    const updated = await prisma.interviewSession.update({
      where: { id },
      data: { publicReportToken: token },
    });
    return NextResponse.json({
      enabled: true,
      publicReportToken: updated.publicReportToken,
    });
  }

  await prisma.interviewSession.update({
    where: { id },
    data: { publicReportToken: null },
  });
  return NextResponse.json({ enabled: false, publicReportToken: null });
}
