import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

/**
 * POST /api/team/accept — Accept a team invite
 * User must be authenticated. The invite email doesn't need to match
 * (they might sign in with a different email).
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const token = body.token as string;

  if (!token) {
    return NextResponse.json({ error: "Invite token required" }, { status: 400 });
  }

  const invite = await prisma.teamInvite.findUnique({
    where: { token },
    include: { org: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 404 });
  }

  if (invite.acceptedAt) {
    return NextResponse.json({ error: "Invite already used" }, { status: 400 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 400 });
  }

  // Check if user already in an org
  const userRecord = await prisma.user.findUnique({ where: { id: user.id } });
  if (userRecord?.orgId && userRecord.orgId !== invite.orgId) {
    return NextResponse.json(
      { error: "You already belong to another organization. Leave it first to accept this invite." },
      { status: 409 },
    );
  }

  if (userRecord?.orgId === invite.orgId) {
    // Already in this org
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    return NextResponse.json({ success: true, orgName: invite.org.name, alreadyMember: true });
  }

  // Join the org
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { orgId: invite.orgId, role: invite.role },
    }),
    prisma.teamInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ success: true, orgName: invite.org.name });
}
