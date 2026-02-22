import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { parseJsonOr } from "../../../lib/json";

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

  const scenario = {
    ...session.scenario,
    tasks: parseJsonOr<string[]>(session.scenario.tasks, []),
    hints: parseJsonOr<string[]>(session.scenario.hints, []),
    evaluationPoints: parseJsonOr<string[]>(session.scenario.evaluationPoints, []),
    rubric: parseJsonOr<string[]>(session.scenario.rubric, []),
    aiPolicy: parseJsonOr<Record<string, unknown>>(session.scenario.aiPolicy, {}),
  };

  const events = session.events.map((event) => ({
    ...event,
    payload: parseJsonOr<Record<string, unknown>>(event.payload, {}),
  }));

  const submissions = session.submissions.map((submission) => ({
    ...submission,
    snapshot: parseJsonOr<Record<string, string>>(submission.snapshot, {}),
  }));

  const rubricScores = session.rubricScores.map((item) => ({
    ...item,
    scores: parseJsonOr<Record<string, number>>(item.scores, {}),
  }));

  return NextResponse.json({
    session: {
      id: session.id,
      publicToken: session.publicToken,
      createdAt: session.createdAt,
      scenario,
    },
    events,
    submissions,
    rubricScores,
  });
}
