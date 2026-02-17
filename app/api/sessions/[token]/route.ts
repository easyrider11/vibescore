import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { ensureWorkspace, getWorkspacePath, listFiles } from "../../../../lib/workspace";

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const session = await prisma.interviewSession.findUnique({
    where: { publicToken: params.token },
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
      tasks: session.scenario.tasks,
      rubric: session.scenario.rubric,
      slug: session.scenario.slug,
    },
    files,
  });
}
