import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { parseJsonOr } from "../../../../../lib/json";
import { autoGrade, type GradingInput } from "../../../../../lib/auto-grade";
import { getAIConfig } from "../../../../../lib/ai";

async function triggerAutoGrade(sessionId: string) {
  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        scenario: true,
        events: { orderBy: { createdAt: "asc" } },
        submissions: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!session) return;

    const actualMinutes =
      session.startedAt && session.endedAt
        ? Math.round(
            (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000,
          )
        : null;

    const input: GradingInput = {
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

    const result = await autoGrade(input);
    const config = getAIConfig();

    await prisma.aIGrade.upsert({
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

    console.log(`✅ Auto-graded session ${sessionId}`);
  } catch (err) {
    console.error(`❌ Auto-grade failed for session ${sessionId}:`, err);
  }
}

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const session = await prisma.interviewSession.findUnique({ where: { publicToken: token } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.status === "completed" || session.status === "cancelled") {
    return NextResponse.json({ error: "Session already ended" }, { status: 400 });
  }

  await prisma.interviewSession.update({
    where: { id: session.id },
    data: { status: "completed", endedAt: new Date() },
  });

  // Fire-and-forget: auto-grade in background
  triggerAutoGrade(session.id);

  return NextResponse.json({ status: "completed" });
}
