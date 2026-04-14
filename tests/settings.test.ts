import { describe, expect, it, vi, beforeEach } from "vitest";

const mockGetCurrentUser = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockUserUpdate = vi.fn();

vi.mock("../lib/auth", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

vi.mock("../lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    organization: {
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

describe("ensureOrg", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing org if user already has one", async () => {
    const org = { id: "org-1", name: "Test Org" };
    mockFindUnique.mockResolvedValue({ id: "user-1", email: "test@co.com", org });

    const { ensureOrg } = await import("../lib/org");
    const result = await ensureOrg("user-1");
    expect(result).toEqual(org);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates a new org if user has none", async () => {
    mockFindUnique.mockResolvedValue({ id: "user-1", email: "test@co.com", org: null });
    const newOrg = { id: "org-2", name: "test's Team" };
    mockCreate.mockResolvedValue(newOrg);
    mockUserUpdate.mockResolvedValue({});

    const { ensureOrg } = await import("../lib/org");
    const result = await ensureOrg("user-1");
    expect(result).toEqual(newOrg);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "test's Team",
        }),
      }),
    );
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { role: "owner" },
      }),
    );
  });

  it("throws if user not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const { ensureOrg } = await import("../lib/org");
    await expect(ensureOrg("nonexistent")).rejects.toThrow("User not found");
  });
});
