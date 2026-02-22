import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { toJsonString } from "../../../lib/json";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const sessionId = body.sessionId?.toString();
  const scores = body.scores;
  const comments = body.comments?.toString() ?? "";

  if (!sessionId || !scores) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, createdById: user.id },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rubric = await prisma.rubricScore.create({
    data: {
      sessionId,
      scores: toJsonString(scores),
      comments,
    },
  });

  return NextResponse.json(rubric);
}
