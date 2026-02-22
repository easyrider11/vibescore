import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { prisma } from "../../../lib/prisma";
import { ensureWorkspace, getWorkspacePath, listFiles, safePath } from "../../../lib/workspace";
import { toJsonString } from "../../../lib/json";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = body.token?.toString();
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const session = await prisma.interviewSession.findUnique({
    where: { publicToken: token },
    include: { scenario: true },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await ensureWorkspace(session.id, session.scenario.slug);
  const workspace = getWorkspacePath(session.id);
  const files = await listFiles(workspace);

  let hasTodo = false;
  for (const file of files) {
    const resolved = safePath(workspace, file);
    const content = await fs.readFile(resolved, "utf-8");
    if (content.includes("TODO")) {
      hasTodo = true;
      break;
    }
  }

  const result = {
    exitCode: hasTodo ? 1 : 0,
    stdout: hasTodo ? "Tests failed: TODO found" : "All tests passed",
    stderr: "",
  };

  await prisma.event.create({
    data: {
      sessionId: session.id,
      type: "RUN_TESTS",
      payload: toJsonString(result),
    },
  });

  return NextResponse.json(result);
}
