import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("⚠ STRIPE_SECRET_KEY not set — billing features disabled");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

/**
 * Pricing tiers for Buildscore.
 * Price IDs are set via env vars so they work across Stripe test/live modes.
 */
export const PLANS = {
  free: {
    name: "Free",
    sessionsPerMonth: 5,
    features: ["5 sessions/month", "AI auto-grading", "Basic analytics", "1 team member"],
    priceMonthly: 0,
    stripePriceId: null,
  },
  pro: {
    name: "Pro",
    sessionsPerMonth: 50,
    features: [
      "50 sessions/month",
      "AI auto-grading",
      "Advanced analytics",
      "Unlimited team members",
      "Custom scenarios",
      "Priority support",
    ],
    priceMonthly: 49,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || null,
  },
  enterprise: {
    name: "Enterprise",
    sessionsPerMonth: -1, // unlimited
    features: [
      "Unlimited sessions",
      "AI auto-grading",
      "Advanced analytics",
      "Unlimited team members",
      "Custom scenarios",
      "SSO & SAML",
      "Dedicated support",
      "Custom integrations",
    ],
    priceMonthly: 199,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || null,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/**
 * Map Stripe price ID back to our plan key.
 */
export function getPlanByPriceId(priceId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.stripePriceId === priceId) return key as PlanKey;
  }
  return null;
}

/**
 * Check if Stripe is properly configured.
 */
export function isStripeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_SECRET_KEY !== "sk_test_placeholder"
  );
}
