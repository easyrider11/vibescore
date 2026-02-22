import { cookies } from "next/headers";
import { prisma } from "./prisma";
import crypto from "crypto";

const COOKIE_NAME = "vibe_session";

export async function createSession(email: string) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const token = crypto.randomBytes(24).toString("hex");
  await prisma.sessionToken.create({
    data: { token, userId: user.id },
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return user;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await prisma.sessionToken.findUnique({
    where: { token },
    include: { user: true },
  });
  return session?.user ?? null;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.sessionToken.deleteMany({ where: { token } });
  }
  cookieStore.set({ name: COOKIE_NAME, value: "", maxAge: 0, path: "/" });
}
