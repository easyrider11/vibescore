import { prisma } from "./prisma";
import { stripe, PLANS, getPlanByPriceId, isStripeConfigured, type PlanKey } from "./stripe";

export interface BillingStatus {
  plan: PlanKey;
  planName: string;
  sessionsUsed: number;
  sessionsLimit: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Get the billing status for an organization.
 */
export async function getBillingStatus(orgId: string): Promise<BillingStatus> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) throw new Error("Organization not found");

  // Count sessions this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sessionsUsed = await prisma.interviewSession.count({
    where: {
      createdBy: { orgId },
      createdAt: { gte: monthStart },
    },
  });

  const plan = (org.plan as PlanKey) || "free";
  const planConfig = PLANS[plan];

  return {
    plan,
    planName: planConfig.name,
    sessionsUsed,
    sessionsLimit: planConfig.sessionsPerMonth,
    stripeCustomerId: org.stripeCustomerId,
    stripeSubscriptionId: org.stripeSubscriptionId,
    subscriptionStatus: org.subscriptionStatus,
    currentPeriodEnd: org.currentPeriodEnd,
    cancelAtPeriodEnd: org.cancelAtPeriodEnd,
  };
}

/**
 * Check if the org can create a new session (within plan limits).
 */
export async function canCreateSession(orgId: string): Promise<boolean> {
  const status = await getBillingStatus(orgId);
  if (status.sessionsLimit === -1) return true; // unlimited
  return status.sessionsUsed < status.sessionsLimit;
}

/**
 * Create a Stripe checkout session for upgrading.
 */
export async function createCheckoutSession(
  orgId: string,
  userId: string,
  planKey: PlanKey,
  returnUrl: string,
): Promise<string> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured");
  }

  const plan = PLANS[planKey];
  if (!plan.stripePriceId) {
    throw new Error(`No Stripe price configured for plan: ${planKey}`);
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw new Error("Organization not found");

  // Get or create Stripe customer
  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const customer = await stripe.customers.create({
      email: user?.email,
      name: org.name,
      metadata: { orgId, userId },
    });
    customerId = customer.id;

    await prisma.organization.update({
      where: { id: orgId },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${returnUrl}?success=true`,
    cancel_url: `${returnUrl}?canceled=true`,
    metadata: { orgId, planKey },
    subscription_data: {
      metadata: { orgId, planKey },
    },
  });

  return session.url!;
}

/**
 * Create a Stripe customer portal session for managing subscription.
 */
export async function createPortalSession(
  orgId: string,
  returnUrl: string,
): Promise<string> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured");
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org?.stripeCustomerId) {
    throw new Error("No billing account found");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
}

/**
 * Handle Stripe webhook events to sync subscription state.
 */
export async function handleSubscriptionEvent(
  event: { type: string; data: { object: Record<string, unknown> } },
) {
  const subscription = event.data.object;
  const orgId = (subscription.metadata as Record<string, string>)?.orgId;

  if (!orgId) {
    console.warn("Stripe webhook: no orgId in subscription metadata");
    return;
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const priceId = ((subscription.items as { data: { price: { id: string } }[] })?.data?.[0]?.price?.id) || "";
      const plan = getPlanByPriceId(priceId) || "pro";

      await prisma.organization.update({
        where: { id: orgId },
        data: {
          plan,
          stripeSubscriptionId: subscription.id as string,
          subscriptionStatus: subscription.status as string,
          currentPeriodEnd: new Date((subscription.current_period_end as number) * 1000),
          cancelAtPeriodEnd: (subscription.cancel_at_period_end as boolean) || false,
        },
      });

      console.log(`✅ Subscription ${event.type} for org ${orgId}: plan=${plan}`);
      break;
    }

    case "customer.subscription.deleted": {
      await prisma.organization.update({
        where: { id: orgId },
        data: {
          plan: "free",
          stripeSubscriptionId: null,
          subscriptionStatus: "canceled",
          cancelAtPeriodEnd: false,
        },
      });

      console.log(`⚠ Subscription canceled for org ${orgId}, reverted to free`);
      break;
    }

    default:
      console.log(`Unhandled Stripe event: ${event.type}`);
  }
}
