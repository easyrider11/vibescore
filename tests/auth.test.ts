import { describe, expect, it, vi, beforeEach } from "vitest";

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}));

const mockUpsert = vi.fn();
const mockTokenCreate = vi.fn();
const mockTokenFindUnique = vi.fn();
const mockTokenDeleteMany = vi.fn();
const mockTokenDelete = vi.fn();
const mockMagicCreate = vi.fn();
const mockMagicFindUnique = vi.fn();
const mockMagicUpdate = vi.fn();
const mockMagicUpdateMany = vi.fn();

vi.mock("../lib/prisma", () => ({
  prisma: {
    user: { upsert: (...args: unknown[]) => mockUpsert(...args) },
    sessionToken: {
      create: (...args: unknown[]) => mockTokenCreate(...args),
      findUnique: (...args: unknown[]) => mockTokenFindUnique(...args),
      deleteMany: (...args: unknown[]) => mockTokenDeleteMany(...args),
      delete: (...args: unknown[]) => mockTokenDelete(...args),
    },
    magicLinkToken: {
      create: (...args: unknown[]) => mockMagicCreate(...args),
      findUnique: (...args: unknown[]) => mockMagicFindUnique(...args),
      update: (...args: unknown[]) => mockMagicUpdate(...args),
      updateMany: (...args: unknown[]) => mockMagicUpdateMany(...args),
    },
  },
}));

describe("auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe("createSession", () => {
    it("creates user and session token", async () => {
      const { createSession } = await import("../lib/auth");
      mockUpsert.mockResolvedValue({ id: "user-1", email: "test@example.com" });
      mockTokenCreate.mockResolvedValue({ id: "tok-1" });

      const user = await createSession("test@example.com");

      expect(user.email).toBe("test@example.com");
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: "test@example.com" } })
      );
      expect(mockTokenCreate).toHaveBeenCalled();
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        expect.objectContaining({ name: "vibe_session", httpOnly: true })
      );
    });
  });

  describe("getCurrentUser", () => {
    it("returns null if no cookie", async () => {
      const { getCurrentUser } = await import("../lib/auth");
      mockCookieStore.get.mockReturnValue(undefined);

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it("returns user if valid token exists", async () => {
      const { getCurrentUser } = await import("../lib/auth");
      mockCookieStore.get.mockReturnValue({ value: "valid-token" });
      mockTokenFindUnique.mockResolvedValue({
        id: "tok-1",
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: "user-1", email: "test@example.com" },
      });

      const user = await getCurrentUser();
      expect(user?.email).toBe("test@example.com");
    });

    it("returns null and deletes expired token", async () => {
      const { getCurrentUser } = await import("../lib/auth");
      mockCookieStore.get.mockReturnValue({ value: "expired-token" });
      mockTokenFindUnique.mockResolvedValue({
        id: "tok-1",
        expiresAt: new Date(Date.now() - 86400000),
        user: { id: "user-1", email: "test@example.com" },
      });

      const user = await getCurrentUser();
      expect(user).toBeNull();
      expect(mockTokenDelete).toHaveBeenCalledWith({ where: { id: "tok-1" } });
    });
  });

  describe("clearSession", () => {
    it("deletes token and clears cookie", async () => {
      const { clearSession } = await import("../lib/auth");
      mockCookieStore.get.mockReturnValue({ value: "some-token" });

      await clearSession();

      expect(mockTokenDeleteMany).toHaveBeenCalledWith({ where: { token: "some-token" } });
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        expect.objectContaining({ name: "vibe_session", maxAge: 0 })
      );
    });
  });

  describe("magic links", () => {
    it("creates a magic link token", async () => {
      const { createMagicLink } = await import("../lib/auth");
      mockMagicCreate.mockResolvedValue({ id: "ml-1" });

      const token = await createMagicLink("test@example.com");
      expect(typeof token).toBe("string");
      expect(token.length).toBe(64); // 32 bytes hex
      expect(mockMagicUpdateMany).toHaveBeenCalled(); // invalidates old tokens
      expect(mockMagicCreate).toHaveBeenCalled();
    });

    it("verifies a valid magic link", async () => {
      const { verifyMagicLink } = await import("../lib/auth");
      mockMagicFindUnique.mockResolvedValue({
        id: "ml-1",
        email: "test@example.com",
        usedAt: null,
        expiresAt: new Date(Date.now() + 600000),
      });
      mockMagicUpdate.mockResolvedValue({});
      mockUpsert.mockResolvedValue({ id: "user-1", email: "test@example.com" });
      mockTokenCreate.mockResolvedValue({ id: "tok-1" });

      const result = await verifyMagicLink("valid-token");
      expect(result.valid).toBe(true);
    });

    it("rejects expired magic link", async () => {
      const { verifyMagicLink } = await import("../lib/auth");
      mockMagicFindUnique.mockResolvedValue({
        id: "ml-1",
        email: "test@example.com",
        usedAt: null,
        expiresAt: new Date(Date.now() - 600000),
      });

      const result = await verifyMagicLink("expired-token");
      expect(result.valid).toBe(false);
    });

    it("rejects already-used magic link", async () => {
      const { verifyMagicLink } = await import("../lib/auth");
      mockMagicFindUnique.mockResolvedValue({
        id: "ml-1",
        email: "test@example.com",
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 600000),
      });

      const result = await verifyMagicLink("used-token");
      expect(result.valid).toBe(false);
    });
  });
});
