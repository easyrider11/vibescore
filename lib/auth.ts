import { cookies } from "next/headers";
import { prisma } from "./prisma";
import crypto from "crypto";

const COOKIE_NAME = "vibe_session";
const SESSION_EXPIRY_DAYS = 30;
const MAGIC_LINK_EXPIRY_MIN = 15;

export async function createSession(email: string) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.sessionToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
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

  if (!session) return null;

  // Check expiry
  if (session.expiresAt < new Date()) {
    await prisma.sessionToken.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.sessionToken.deleteMany({ where: { token } });
  }
  cookieStore.set({ name: COOKIE_NAME, value: "", maxAge: 0, path: "/" });
}

// ─── Magic Link ───

export async function createMagicLink(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MIN * 60 * 1000);

  // Invalidate any existing unused tokens for this email
  await prisma.magicLinkToken.updateMany({
    where: { email, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.magicLinkToken.create({
    data: { email, token, expiresAt },
  });

  return token;
}

export async function verifyMagicLink(token: string) {
  const record = await prisma.magicLinkToken.findUnique({ where: { token } });

  if (!record) return { valid: false as const, error: "Invalid link" };
  if (record.usedAt) return { valid: false as const, error: "Link already used" };
  if (record.expiresAt < new Date()) return { valid: false as const, error: "Link expired" };

  // Mark as used
  await prisma.magicLinkToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  // Create a real session
  const user = await createSession(record.email);
  return { valid: true as const, user };
}
