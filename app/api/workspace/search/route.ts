import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { prisma } from "../../../../lib/prisma";
import { ensureWorkspace, getWorkspacePath, listFiles, safePath } from "../../../../lib/workspace";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const query = searchParams.get("q");
  if (!token || !query) return NextResponse.json({ error: "Missing token/query" }, { status: 400 });

  const session = await prisma.interviewSession.findUnique({
    where: { publicToken: token },
    include: { scenario: true },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await ensureWorkspace(session.id, session.scenario.slug);
  const workspace = getWorkspacePath(session.id);
  const files = await listFiles(workspace);

  const results: Array<{ path: string; line: number; preview: string }> = [];
  for (const file of files) {
    const resolved = safePath(workspace, file);
    const content = await fs.readFile(resolved, "utf-8");
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(query.toLowerCase())) {
        results.push({ path: file, line: idx + 1, preview: line.trim() });
      }
    });
    if (results.length > 50) break;
  }

  return NextResponse.json({ results });
}
