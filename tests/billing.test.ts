import { describe, expect, it, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockCount = vi.fn();
const mockCustomerCreate = vi.fn();
const mockCheckoutCreate = vi.fn();
const mockPortalCreate = vi.fn();

vi.mock("../lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    interviewSession: {
      count: (...args: unknown[]) => mockCount(...args),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ email: "test@co.com" }),
    },
  },
}));

vi.mock("../lib/stripe", () => ({
  stripe: {
    customers: { create: (...args: unknown[]) => mockCustomerCreate(...args) },
    checkout: { sessions: { create: (...args: unknown[]) => mockCheckoutCreate(...args) } },
    billingPortal: { sessions: { create: (...args: unknown[]) => mockPortalCreate(...args) } },
  },
  PLANS: {
    free: { name: "Free", sessionsPerMonth: 5, priceMonthly: 0, stripePriceId: null, features: [] },
    pro: { name: "Pro", sessionsPerMonth: 50, priceMonthly: 49, stripePriceId: "price_pro", features: [] },
    enterprise: { name: "Enterprise", sessionsPerMonth: -1, priceMonthly: 199, stripePriceId: "price_ent", features: [] },
  },
  getPlanByPriceId: (id: string) => {
    if (id === "price_pro") return "pro";
    if (id === "price_ent") return "enterprise";
    return null;
  },
  isStripeConfigured: () => true,
}));

describe("billing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getBillingStatus returns free plan with usage", async () => {
    mockFindUnique.mockResolvedValue({
      id: "org-1",
      plan: "free",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
    mockCount.mockResolvedValue(3);

    const { getBillingStatus } = await import("../lib/billing");
    const status = await getBillingStatus("org-1");

    expect(status.plan).toBe("free");
    expect(status.planName).toBe("Free");
    expect(status.sessionsUsed).toBe(3);
    expect(status.sessionsLimit).toBe(5);
  });

  it("canCreateSession returns false when at limit", async () => {
    mockFindUnique.mockResolvedValue({
      id: "org-1",
      plan: "free",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    });
    mockCount.mockResolvedValue(5);

    const { canCreateSession } = await import("../lib/billing");
    const result = await canCreateSession("org-1");

    expect(result).toBe(false);
  });

  it("canCreateSession returns true for enterprise (unlimited)", async () => {
    mockFindUnique.mockResolvedValue({
      id: "org-1",
      plan: "enterprise",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      subscriptionStatus: "active",
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
    });
    mockCount.mockResolvedValue(999);

    const { canCreateSession } = await import("../lib/billing");
    const result = await canCreateSession("org-1");

    expect(result).toBe(true);
  });

  it("handleSubscriptionEvent updates org on subscription created", async () => {
    mockUpdate.mockResolvedValue({});

    const { handleSubscriptionEvent } = await import("../lib/billing");
    await handleSubscriptionEvent({
      type: "customer.subscription.created",
      data: {
        object: {
          id: "sub_123",
          metadata: { orgId: "org-1", planKey: "pro" },
          items: { data: [{ price: { id: "price_pro" } }] },
          status: "active",
          current_period_end: Math.floor(Date.now() / 1000) + 86400,
          cancel_at_period_end: false,
        },
      },
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "org-1" },
        data: expect.objectContaining({
          plan: "pro",
          stripeSubscriptionId: "sub_123",
          subscriptionStatus: "active",
        }),
      }),
    );
  });

  it("handleSubscriptionEvent reverts to free on deletion", async () => {
    mockUpdate.mockResolvedValue({});

    const { handleSubscriptionEvent } = await import("../lib/billing");
    await handleSubscriptionEvent({
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_123",
          metadata: { orgId: "org-1" },
        },
      },
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "org-1" },
        data: expect.objectContaining({
          plan: "free",
          stripeSubscriptionId: null,
          subscriptionStatus: "canceled",
        }),
      }),
    );
  });
});
