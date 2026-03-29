import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { parseJsonOr } from "../../../../../lib/json";
import { getWorkspacePath, listFiles } from "../../../../../lib/workspace";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const url = new URL(req.url);
  const since = url.searchParams.get("since");

  const session = await prisma.interviewSession.findUnique({
    where: { publicToken: token },
    include: { scenario: true },
  });

  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Build event query — optionally filter events after a timestamp
  const whereClause: any = { sessionId: session.id };
  if (since) {
    whereClause.createdAt = { gt: new Date(since) };
  }

  const events = await prisma.event.findMany({
    where: whereClause,
    orderBy: { createdAt: "asc" },
  });

  // Get AI chat events for the full history
  const allAiEvents = await prisma.event.findMany({
    where: { sessionId: session.id, type: "AI_CHAT" },
    orderBy: { createdAt: "asc" },
  });

  // Read current workspace files
  const workspace = getWorkspacePath(session.id);
  let currentFiles: Record<string, string> = {};
  try {
    const fileList = await listFiles(workspace);
    for (const filePath of fileList) {
      try {
        const fullPath = join(workspace, filePath);
        const fileContent = await readFile(fullPath, "utf-8");
        currentFiles[filePath] = fileContent;
      } catch {
        // skip unreadable files
      }
    }
  } catch {
    // workspace not ready yet
  }

  // Get submissions
  const submissions = await prisma.submission.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "desc" },
  });

  const parsedEvents = events.map((e) => ({
    id: e.id,
    type: e.type,
    payload: parseJsonOr(e.payload, {}),
    createdAt: e.createdAt.toISOString(),
  }));

  const aiChat = allAiEvents.map((e) => {
    const payload = parseJsonOr<{ mode?: string; question?: string; response?: string }>(e.payload, {});
    return {
      id: e.id,
      mode: payload.mode || "",
      question: payload.question || "",
      response: payload.response || "",
      createdAt: e.createdAt.toISOString(),
    };
  });

  return NextResponse.json({
    sessionId: session.id,
    status: session.status,
    scenario: {
      title: session.scenario.title,
      slug: session.scenario.slug,
      timeLimitMin: session.scenario.timeLimitMin,
    },
    events: parsedEvents,
    aiChat,
    currentFiles,
    submissions: submissions.map((s) => ({
      id: s.id,
      clarificationNotes: s.clarificationNotes,
      diffText: s.diffText,
      createdAt: s.createdAt.toISOString(),
    })),
    serverTime: new Date().toISOString(),
  });
}
