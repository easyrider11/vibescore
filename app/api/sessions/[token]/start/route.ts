import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const session = await prisma.interviewSession.findUnique({ where: { publicToken: token } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.status === "completed" || session.status === "cancelled") {
    return NextResponse.json({ error: "Session already ended" }, { status: 400 });
  }

  if (session.status === "pending") {
    await prisma.interviewSession.update({
      where: { id: session.id },
      data: { status: "active", startedAt: new Date() },
    });
  }

  return NextResponse.json({ status: "active" });
}
