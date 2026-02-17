import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { ensureWorkspace } from "../../../lib/workspace";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const scenarioId = body.scenarioId?.toString();
  if (!scenarioId) return NextResponse.json({ error: "Missing scenarioId" }, { status: 400 });

  const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } });
  if (!scenario) return NextResponse.json({ error: "Scenario not found" }, { status: 404 });

  const publicToken = crypto.randomBytes(12).toString("hex");
  const session = await prisma.interviewSession.create({
    data: {
      scenarioId: scenario.id,
      createdById: user.id,
      publicToken,
    },
  });

  await ensureWorkspace(session.id, scenario.slug);

  return NextResponse.json(session);
}
