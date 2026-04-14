import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { ensureOrg, getOrgMembers } from "../../../lib/org";
import { sendTeamInviteEmail } from "../../../lib/email";

/**
 * GET /api/team — List org members
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await ensureOrg(user.id);
  const members = await getOrgMembers(org.id);

  // Include pending invites
  const invites = await prisma.teamInvite.findMany({
    where: { orgId: org.id, acceptedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, email: true, role: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    members,
    invites,
    currentUserId: user.id,
    orgName: org.name,
  });
}

/**
 * POST /api/team — Invite a new member
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await ensureOrg(user.id);

  // Only owner/admin can invite
  const userRecord = await prisma.user.findUnique({ where: { id: user.id } });
  if (!userRecord || !["owner", "admin"].includes(userRecord.role)) {
    return NextResponse.json({ error: "Only admins can invite members" }, { status: 403 });
  }

  const body = await req.json();
  const email = (body.email as string)?.trim().toLowerCase();
  const role = (body.role as string) || "member";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  if (!["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Check if already a member
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.orgId === org.id) {
    return NextResponse.json({ error: "User is already a member" }, { status: 409 });
  }

  // Check for existing pending invite
  const existingInvite = await prisma.teamInvite.findFirst({
    where: { email, orgId: org.id, acceptedAt: null, expiresAt: { gt: new Date() } },
  });
  if (existingInvite) {
    return NextResponse.json({ error: "Invite already pending for this email" }, { status: 409 });
  }

  // Create invite token
  const crypto = await import("crypto");
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await prisma.teamInvite.create({
    data: {
      email,
      role,
      token,
      orgId: org.id,
      invitedById: user.id,
      expiresAt,
    },
  });

  // Send invite email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${token}`;
  const emailResult = await sendTeamInviteEmail({
    to: email,
    orgName: org.name,
    inviterEmail: userRecord.email,
    inviteUrl,
    role,
  });

  return NextResponse.json({
    invite: { id: invite.id, email, role, expiresAt },
    email: emailResult,
  });
}

/**
 * PUT /api/team — Update member role
 */
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await ensureOrg(user.id);

  // Only owner can change roles
  const userRecord = await prisma.user.findUnique({ where: { id: user.id } });
  if (!userRecord || userRecord.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can change roles" }, { status: 403 });
  }

  const body = await req.json();
  const memberId = body.memberId as string;
  const newRole = body.role as string;

  if (!memberId || !["admin", "member"].includes(newRole)) {
    return NextResponse.json({ error: "Invalid member or role" }, { status: 400 });
  }

  // Can't change own role
  if (memberId === user.id) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  // Verify member belongs to this org
  const member = await prisma.user.findUnique({ where: { id: memberId } });
  if (!member || member.orgId !== org.id) {
    return NextResponse.json({ error: "Member not found in organization" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: memberId },
    data: { role: newRole },
  });

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/team — Remove member or cancel invite
 */
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await ensureOrg(user.id);

  const userRecord = await prisma.user.findUnique({ where: { id: user.id } });
  if (!userRecord || !["owner", "admin"].includes(userRecord.role)) {
    return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  const inviteId = searchParams.get("inviteId");

  if (inviteId) {
    // Cancel pending invite
    await prisma.teamInvite.deleteMany({
      where: { id: inviteId, orgId: org.id },
    });
    return NextResponse.json({ success: true });
  }

  if (memberId) {
    // Can't remove yourself
    if (memberId === user.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    // Can't remove owner
    const member = await prisma.user.findUnique({ where: { id: memberId } });
    if (!member || member.orgId !== org.id) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (member.role === "owner") {
      return NextResponse.json({ error: "Cannot remove the owner" }, { status: 400 });
    }

    // Remove from org
    await prisma.user.update({
      where: { id: memberId },
      data: { orgId: null, role: "member" },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "memberId or inviteId required" }, { status: 400 });
}
