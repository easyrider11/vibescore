export interface MarketingCta {
  label: string;
  href: string;
}

export interface PricingPackage {
  name: "Free" | "Pro" | "Enterprise";
  priceLabel: string;
  cadenceLabel: string;
  audience: string;
  description: string;
  features: string[];
  cta: MarketingCta;
  highlight?: string;
  highlighted?: boolean;
}

export const marketingCtas = {
  primary: {
    label: "Book a demo",
    href: "mailto:sales@buildscore.dev?subject=Buildscore%20Demo",
  },
  secondary: {
    label: "Start free",
    href: "/login",
  },
} as const;

export const proofPoints = [
  "Structured scoring",
  "Live pair sessions",
  "AI usage analytics",
  "Org controls",
] as const;

export const pricingPackages: readonly PricingPackage[] = [
  {
    name: "Free",
    priceLabel: "$0",
    cadenceLabel: "/ month",
    audience: "For pilots and early evaluation",
    description: "Run a few sessions with your team and see if the format fits before you commit.",
    features: [
      "5 sessions per month",
      "AI auto-grading",
      "Basic analytics",
      "Single-team evaluation setup",
    ],
    cta: marketingCtas.secondary,
  },
  {
    name: "Pro",
    priceLabel: "Starting at $49",
    cadenceLabel: "/ month",
    audience: "For growing hiring teams",
    description: "Run repeatable interview loops with richer analytics, shared reviewer context, and higher session volume.",
    features: [
      "50 sessions per month",
      "Advanced analytics and trends",
      "Unlimited team members",
      "Custom scenarios",
      "Priority support",
    ],
    cta: marketingCtas.primary,
    highlight: "Most teams start here",
    highlighted: true,
  },
  {
    name: "Enterprise",
    priceLabel: "Custom",
    cadenceLabel: " engagement",
    audience: "For security and rollout needs",
    description: "Designed for organizations that need custom onboarding, security review, integrations, and process design support.",
    features: [
      "Unlimited interview volume",
      "SSO and access controls",
      "Security review support",
      "Custom integrations",
      "Onboarding and rollout guidance",
    ],
    cta: marketingCtas.primary,
  },
] as const;

export const pricingAudienceBands = [
  {
    title: "Pilot",
    description: "Validate the interview loop with a small hiring team and a few live candidates.",
  },
  {
    title: "Scale",
    description: "Standardize evaluation across interviewers while increasing candidate volume.",
  },
  {
    title: "Rollout",
    description: "Roll out interviews across teams with SSO, audit logs, and procurement sorted upfront.",
  },
] as const;

export const pricingFaqs = [
  {
    question: "Can we start free before booking a demo?",
    answer: "Yes. The free plan is there for teams that want to explore the workflow first, while demos are the fastest path for teams evaluating rollout fit.",
  },
  {
    question: "What does Pro mean by starting at $49?",
    answer: "Pro is positioned for active hiring teams. Final pricing depends on how many sessions and workflow requirements your team expects each month.",
  },
  {
    question: "When should we talk to sales?",
    answer: "Talk to sales if you need team onboarding, a rollout recommendation, security review support, or want help mapping Buildscore to your existing hiring process.",
  },
  {
    question: "Do candidates need an account?",
    answer: "No. Candidates join through a session link and start directly in the browser.",
  },
] as const;
