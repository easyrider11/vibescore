import { describe, expect, it, vi, beforeEach } from "vitest";

const mockOrgFindUnique = vi.fn();
const mockSessionCount = vi.fn();

vi.mock("../lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: (...args: unknown[]) => mockOrgFindUnique(...args),
    },
    interviewSession: {
      count: (...args: unknown[]) => mockSessionCount(...args),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ email: "test@co.com" }),
    },
  },
}));

vi.mock("../lib/stripe", () => ({
  stripe: {},
  PLANS: {
    free: { name: "Free", sessionsPerMonth: 5, priceMonthly: 0, stripePriceId: null, features: [] },
    pro: { name: "Pro", sessionsPerMonth: 50, priceMonthly: 49, stripePriceId: "price_pro", features: [] },
    enterprise: { name: "Enterprise", sessionsPerMonth: -1, priceMonthly: 199, stripePriceId: "price_ent", features: [] },
  },
  getPlanByPriceId: () => null,
  isStripeConfigured: () => false,
}));

describe("Session limit enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks session creation when free plan limit reached", async () => {
    mockOrgFindUnique.mockResolvedValue({
      id: "org-1",
      plan: "free",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
    mockSessionCount.mockResolvedValue(5); // at limit

    const { canCreateSession } = await import("../lib/billing");
    expect(await canCreateSession("org-1")).toBe(false);
  });

  it("allows session creation when under limit", async () => {
    mockOrgFindUnique.mockResolvedValue({
      id: "org-1",
      plan: "free",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
    mockSessionCount.mockResolvedValue(3); // under limit

    const { canCreateSession } = await import("../lib/billing");
    expect(await canCreateSession("org-1")).toBe(true);
  });

  it("allows session creation on pro plan with higher limit", async () => {
    mockOrgFindUnique.mockResolvedValue({
      id: "org-1",
      plan: "pro",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      subscriptionStatus: "active",
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
    });
    mockSessionCount.mockResolvedValue(10); // over free limit but under pro

    const { canCreateSession } = await import("../lib/billing");
    expect(await canCreateSession("org-1")).toBe(true);
  });

  it("always allows enterprise (unlimited)", async () => {
    mockOrgFindUnique.mockResolvedValue({
      id: "org-1",
      plan: "enterprise",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      subscriptionStatus: "active",
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
    });
    mockSessionCount.mockResolvedValue(500);

    const { canCreateSession } = await import("../lib/billing");
    expect(await canCreateSession("org-1")).toBe(true);
  });
});
