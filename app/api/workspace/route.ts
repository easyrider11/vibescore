import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import { prisma } from "../../../lib/prisma";
import { ensureWorkspace, getWorkspacePath, listFiles, safePath } from "../../../lib/workspace";
import { toJsonString } from "../../../lib/json";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const filePath = searchParams.get("path");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const session = await prisma.interviewSession.findUnique({ where: { publicToken: token }, include: { scenario: true } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await ensureWorkspace(session.id, session.scenario.slug);
  const workspace = getWorkspacePath(session.id);

  if (!filePath) {
    const files = await listFiles(workspace);
    return NextResponse.json({ files });
  }

  const resolved = safePath(workspace, filePath);
  const content = await fs.readFile(resolved, "utf-8");

  await prisma.event.create({
    data: { sessionId: session.id, type: "OPEN_FILE", payload: toJsonString({ path: filePath }) },
  });

  return NextResponse.json({ path: filePath, content });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = body.token?.toString();
  const filePath = body.path?.toString();
  const content = body.content?.toString();

  if (!token || !filePath) return NextResponse.json({ error: "Missing token or path" }, { status: 400 });

  const session = await prisma.interviewSession.findUnique({ where: { publicToken: token }, include: { scenario: true } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await ensureWorkspace(session.id, session.scenario.slug);
  const workspace = getWorkspacePath(session.id);
  const resolved = safePath(workspace, filePath);
  await fs.writeFile(resolved, content ?? "", "utf-8");

  await prisma.event.create({
    data: { sessionId: session.id, type: "EDIT_FILE", payload: toJsonString({ path: filePath }) },
  });

  return NextResponse.json({ status: "saved" });
}
