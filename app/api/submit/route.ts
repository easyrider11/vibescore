import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { prisma } from "../../../lib/prisma";
import { ensureWorkspace, getWorkspacePath, listFiles, safePath } from "../../../lib/workspace";
import { diffFiles } from "../../../lib/diff";

const SEED_ROOT = path.join(process.cwd(), "seeds", "scenarios");

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = body.token?.toString();
  const clarificationNotes = body.clarificationNotes?.toString() ?? null;
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const session = await prisma.interviewSession.findUnique({
    where: { publicToken: token },
    include: { scenario: true },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await ensureWorkspace(session.id, session.scenario.slug);
  const workspace = getWorkspacePath(session.id);

  const files = await listFiles(workspace);
  const snapshot: Record<string, string> = {};
  for (const file of files) {
    const resolved = safePath(workspace, file);
    snapshot[file] = await fs.readFile(resolved, "utf-8");
  }

  const baseRoot = path.join(SEED_ROOT, session.scenario.slug);
  const baseFiles = await listFiles(baseRoot);
  const baseSnapshot: Record<string, string> = {};
  for (const file of baseFiles) {
    baseSnapshot[file] = await fs.readFile(path.join(baseRoot, file), "utf-8");
  }

  const diffText = diffFiles(baseSnapshot, snapshot);

  const submission = await prisma.submission.create({
    data: {
      sessionId: session.id,
      snapshot,
      diffText,
      clarificationNotes,
    },
  });

  await prisma.event.create({
    data: { sessionId: session.id, type: "SUBMIT", payload: { submissionId: submission.id } },
  });

  return NextResponse.json({ submissionId: submission.id });
}
