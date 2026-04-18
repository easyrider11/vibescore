import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import { endDemoSession, isDemoUser } from "../../../../lib/demo";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDemoUser(user.email)) {
    return NextResponse.json({ error: "Not a demo account" }, { status: 400 });
  }

  await endDemoSession(user.id);
  return NextResponse.json({ ok: true });
}
