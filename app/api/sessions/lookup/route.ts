import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, createdById: user.id },
    select: { publicToken: true },
  });

  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ publicToken: session.publicToken });
}
