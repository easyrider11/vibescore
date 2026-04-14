import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { ensureWorkspace } from "../../../lib/workspace";
import { ensureOrg } from "../../../lib/org";
import { canCreateSession } from "../../../lib/billing";
import { PLANS, type PlanKey } from "../../../lib/stripe";
import { sendCandidateInviteEmail } from "../../../lib/email";

function getAppUrl(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check billing limits
  const org = await ensureOrg(user.id);
  const allowed = await canCreateSession(org.id);
  if (!allowed) {
    const plan = (org.plan as PlanKey) || "free";
    const limit = PLANS[plan]?.sessionsPerMonth ?? 5;
    return NextResponse.json(
      {
        error: `Session limit reached (${limit}/month on ${PLANS[plan]?.name || "Free"} plan). Upgrade to create more sessions.`,
        code: "SESSION_LIMIT_REACHED",
      },
      { status: 403 },
    );
  }

  const body = await req.json();
  const scenarioId = body.scenarioId?.toString();
  if (!scenarioId) return NextResponse.json({ error: "Missing scenarioId" }, { status: 400 });

  const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } });
  if (!scenario) return NextResponse.json({ error: "Scenario not found" }, { status: 404 });

  const candidateName = body.candidateName?.toString() || "";
  const candidateEmail = body.candidateEmail?.toString() || "";
  const position = body.position?.toString() || "";
  const durationMinutes = Number(body.durationMinutes) || scenario.timeLimitMin || 45;
  const sendInvite = body.sendInvite !== false; // default true

  const publicToken = crypto.randomBytes(12).toString("hex");
  const session = await prisma.interviewSession.create({
    data: {
      scenarioId: scenario.id,
      createdById: user.id,
      publicToken,
      candidateName,
      candidateEmail,
      position,
      durationMinutes,
      status: "pending",
    },
  });

  await ensureWorkspace(session.id, scenario.slug);

  let inviteEmail: { sent: boolean; error?: string } | null = null;
  if (sendInvite && candidateEmail && candidateEmail.includes("@")) {
    const sessionUrl = `${getAppUrl(req)}/s/${publicToken}`;
    inviteEmail = await sendCandidateInviteEmail({
      to: candidateEmail,
      candidateName,
      scenarioTitle: scenario.title,
      sessionUrl,
      durationMinutes,
      recruiterEmail: user.email,
    });
  }

  return NextResponse.json({ ...session, inviteEmail });
}
