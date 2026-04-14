import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { parseJsonOr } from "../../../lib/json";
import { autoGrade, type GradingInput } from "../../../lib/auto-grade";
import { getAIConfig } from "../../../lib/ai";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const sessionId = body.sessionId?.toString();
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, createdById: user.id },
    include: {
      scenario: true,
      events: { orderBy: { createdAt: "asc" } },
      submissions: { orderBy: { createdAt: "desc" } },
      aiGrade: true,
    },
  });

  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check if already graded (allow re-grading via force flag)
  if (session.aiGrade && !body.force) {
    return NextResponse.json({
      ...session.aiGrade,
      scores: parseJsonOr(session.aiGrade.scores, {}),
      strengths: parseJsonOr(session.aiGrade.strengths, []),
      improvements: parseJsonOr(session.aiGrade.improvements, []),
      cached: true,
    });
  }

  // Build grading input
  const actualMinutes =
    session.startedAt && session.endedAt
      ? Math.round(
          (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000,
        )
      : null;

  const gradingInput: GradingInput = {
    scenario: {
      title: session.scenario.title,
      description: session.scenario.description,
      tasks: parseJsonOr<string[]>(session.scenario.tasks, []),
      evaluationPoints: parseJsonOr<string[]>(session.scenario.evaluationPoints, []),
    },
    events: session.events.map((e) => ({
      type: e.type,
      payload: parseJsonOr<Record<string, unknown>>(e.payload, {}),
      createdAt: e.createdAt,
    })),
    submissions: session.submissions.map((s) => ({
      diffText: s.diffText,
      clarificationNotes: s.clarificationNotes,
      snapshot: parseJsonOr<Record<string, string>>(s.snapshot, {}),
    })),
    durationMinutes: session.durationMinutes,
    actualMinutes,
  };

  const result = await autoGrade(gradingInput);

  // Upsert the grade
  const config = getAIConfig();
  const aiGrade = await prisma.aIGrade.upsert({
    where: { sessionId },
    update: {
      scores: JSON.parse(JSON.stringify(result.scores)),
      decision: result.decision,
      summary: result.summary,
      strengths: result.strengths,
      improvements: result.improvements,
      model: config.isReal ? config.model : "mock",
    },
    create: {
      sessionId,
      scores: JSON.parse(JSON.stringify(result.scores)),
      decision: result.decision,
      summary: result.summary,
      strengths: result.strengths,
      improvements: result.improvements,
      model: config.isReal ? config.model : "mock",
    },
  });

  return NextResponse.json({
    ...aiGrade,
    scores: result.scores,
    strengths: result.strengths,
    improvements: result.improvements,
    cached: false,
  });
}
