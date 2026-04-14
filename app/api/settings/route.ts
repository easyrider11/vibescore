import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { ensureOrg } from "../../../lib/org";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await ensureOrg(user.id);

  return NextResponse.json({
    org: {
      id: org.id,
      name: org.name,
      defaultAiMode: org.defaultAiMode,
      defaultDurationMin: org.defaultDurationMin,
      autoGradeEnabled: org.autoGradeEnabled,
      allowedAiModes: org.allowedAiModes,
    },
    user: {
      id: user.id,
      email: user.email,
      name: (user as Record<string, unknown>).name || "",
      role: (user as Record<string, unknown>).role || "member",
    },
  });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await ensureOrg(user.id);

  // Only owner/admin can update org settings
  const userRecord = await prisma.user.findUnique({ where: { id: user.id } });
  if (!userRecord || !["owner", "admin"].includes(userRecord.role)) {
    return NextResponse.json({ error: "Only admins can update settings" }, { status: 403 });
  }

  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (typeof body.name === "string") updates.name = body.name.trim().slice(0, 100);
  if (["mock", "real"].includes(body.defaultAiMode)) updates.defaultAiMode = body.defaultAiMode;
  if (typeof body.defaultDurationMin === "number" && body.defaultDurationMin >= 15 && body.defaultDurationMin <= 180) {
    updates.defaultDurationMin = body.defaultDurationMin;
  }
  if (typeof body.autoGradeEnabled === "boolean") updates.autoGradeEnabled = body.autoGradeEnabled;
  if (Array.isArray(body.allowedAiModes)) {
    const valid = ["summary", "explain", "tests", "review", "generate", "debug"];
    updates.allowedAiModes = body.allowedAiModes.filter((m: string) => valid.includes(m));
  }

  // Update user name if provided
  if (typeof body.userName === "string") {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: body.userName.trim().slice(0, 100) },
    });
  }

  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: updates,
  });

  return NextResponse.json({ org: updated });
}
