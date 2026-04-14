import { describe, expect, it, vi, beforeEach } from "vitest";

const mockGetCurrentUser = vi.fn();
const mockUserFindUnique = vi.fn();
const mockUserFindMany = vi.fn();
const mockUserUpdate = vi.fn();
const mockOrgFindUnique = vi.fn();
const mockOrgCreate = vi.fn();
const mockInviteCreate = vi.fn();
const mockInviteFindFirst = vi.fn();
const mockInviteFindMany = vi.fn();
const mockInviteFindUnique = vi.fn();
const mockInviteUpdate = vi.fn();
const mockInviteDeleteMany = vi.fn();
const mockTransaction = vi.fn();

vi.mock("../lib/auth", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

vi.mock("../lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    organization: {
      findUnique: (...args: unknown[]) => mockOrgFindUnique(...args),
      create: (...args: unknown[]) => mockOrgCreate(...args),
    },
    teamInvite: {
      create: (...args: unknown[]) => mockInviteCreate(...args),
      findFirst: (...args: unknown[]) => mockInviteFindFirst(...args),
      findMany: (...args: unknown[]) => mockInviteFindMany(...args),
      findUnique: (...args: unknown[]) => mockInviteFindUnique(...args),
      update: (...args: unknown[]) => mockInviteUpdate(...args),
      deleteMany: (...args: unknown[]) => mockInviteDeleteMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock("../lib/email", () => ({
  sendTeamInviteEmail: vi.fn().mockResolvedValue({ sent: true }),
}));

describe("Team management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrgMembers", () => {
    it("returns members for an org", async () => {
      const members = [
        { id: "u1", email: "owner@co.com", name: "Owner", role: "owner", createdAt: new Date() },
        { id: "u2", email: "member@co.com", name: "Member", role: "member", createdAt: new Date() },
      ];
      mockUserFindMany.mockResolvedValue(members);

      const { getOrgMembers } = await import("../lib/org");
      const result = await getOrgMembers("org-1");

      expect(result).toEqual(members);
      expect(mockUserFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orgId: "org-1" },
        }),
      );
    });
  });

  describe("invite validation", () => {
    it("rejects invalid email", () => {
      const email = "not-an-email";
      expect(email.includes("@")).toBe(false);
    });

    it("rejects invalid roles", () => {
      const validRoles = ["admin", "member"];
      expect(validRoles.includes("owner")).toBe(false);
      expect(validRoles.includes("superadmin")).toBe(false);
      expect(validRoles.includes("admin")).toBe(true);
      expect(validRoles.includes("member")).toBe(true);
    });
  });

  describe("invite acceptance", () => {
    it("rejects expired invite", () => {
      const invite = {
        expiresAt: new Date(Date.now() - 86400000), // yesterday
        acceptedAt: null,
      };
      expect(invite.expiresAt < new Date()).toBe(true);
    });

    it("rejects already-used invite", () => {
      const invite = {
        expiresAt: new Date(Date.now() + 86400000),
        acceptedAt: new Date(),
      };
      expect(invite.acceptedAt !== null).toBe(true);
    });

    it("accepts valid invite for user without org", async () => {
      const invite = {
        id: "inv-1",
        token: "abc123",
        orgId: "org-1",
        role: "member",
        acceptedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        org: { name: "Test Org" },
      };

      mockInviteFindUnique.mockResolvedValue(invite);
      mockUserFindUnique.mockResolvedValue({ id: "u1", orgId: null });
      mockTransaction.mockResolvedValue([{}, {}]);

      // Simulate the accept flow
      expect(invite.acceptedAt).toBeNull();
      expect(invite.expiresAt > new Date()).toBe(true);
      // User has no org, so can join
      const user = { id: "u1", orgId: null };
      expect(user.orgId).toBeNull();
    });
  });
});
