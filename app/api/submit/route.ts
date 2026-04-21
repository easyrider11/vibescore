import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { ensureWorkspace, getWorkspacePath, listFiles, safePath } from "../../../lib/workspace";
import { diffFiles } from "../../../lib/diff";
import {
  rateLimit,
  SUBMIT_RATE_LIMIT,
  getClientId,
  rateLimitResponse,
} from "../../../lib/rate-limit";

const SEED_ROOT = path.join(process.cwd(), "seeds", "scenarios");

const SubmitSchema = z.object({
  token: z.string().min(1, "Missing token").max(128),
  clarificationNotes: z.string().max(5000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`submit:${getClientId(req)}`, SUBMIT_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl);

  const raw = await req.json().catch(() => null);
  const parsed = SubmitSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }
  const { token, clarificationNotes = null } = parsed.data;

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
