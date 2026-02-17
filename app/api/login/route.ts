import { NextRequest, NextResponse } from "next/server";
import { createSession } from "../../../lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = body.email?.toString().trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const user = await createSession(email);
  return NextResponse.json({ id: user.id, email: user.email });
}
