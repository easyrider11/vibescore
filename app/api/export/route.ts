import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, createdById: user.id },
    include: { scenario: true, events: true, submissions: true, rubricScores: true },
  });

  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    session: {
      id: session.id,
      publicToken: session.publicToken,
      createdAt: session.createdAt,
      scenario: session.scenario,
    },
    events: session.events,
    submissions: session.submissions,
    rubricScores: session.rubricScores,
  });
}
