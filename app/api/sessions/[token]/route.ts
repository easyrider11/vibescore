import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { ensureWorkspace, getWorkspacePath, listFiles } from "../../../../lib/workspace";
import { parseJsonOr } from "../../../../lib/json";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await prisma.interviewSession.findUnique({
    where: { publicToken: token },
    include: { scenario: true },
  });

  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await ensureWorkspace(session.id, session.scenario.slug);
  const workspace = getWorkspacePath(session.id);
  const files = await listFiles(workspace);

  return NextResponse.json({
    id: session.id,
    publicToken: session.publicToken,
    scenario: {
      title: session.scenario.title,
      description: session.scenario.description,
      background: session.scenario.background,
      tasks: parseJsonOr<string[]>(session.scenario.tasks, []),
      hints: parseJsonOr<string[]>(session.scenario.hints, []),
      evaluationPoints: parseJsonOr<string[]>(session.scenario.evaluationPoints, []),
      rubric: parseJsonOr<string[]>(session.scenario.rubric, []),
      aiPolicy: parseJsonOr<{ allowedModes?: string[] }>(session.scenario.aiPolicy, { allowedModes: [] }),
      timeLimitMin: session.scenario.timeLimitMin,
      slug: session.scenario.slug,
    },
    files,
  });
}
