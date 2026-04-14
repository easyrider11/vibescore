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

export const teamOutcomes = [
  {
    title: "Higher signal per interview",
    description: "Watch how candidates reason through realistic engineering work with AI, not rehearsed puzzle patterns.",
  },
  {
    title: "Less interviewer variance",
    description: "Use consistent rubrics, captured timelines, and shared evaluation context across your hiring team.",
  },
  {
    title: "Faster hiring decisions",
    description: "Move from scattered notes to a structured record of code changes, prompts, and reviewer evidence.",
  },
] as const;

export const workflowSteps = [
  {
    title: "Design the session",
    description: "Choose a realistic scenario, define the rubric, and set the interview constraints for the role.",
  },
  {
    title: "Invite the candidate",
    description: "Send a single browser-based session link with no downloads, setup, or candidate account friction.",
  },
  {
    title: "Review the evidence",
    description: "Replay decisions, inspect AI usage, compare diffs, and score the session with structured signal.",
  },
] as const;

export const differentiators = [
  {
    title: "Real codebases over toy prompts",
    description: "Candidates work inside realistic projects with enough surface area to show engineering judgment.",
  },
  {
    title: "AI collaboration you can evaluate",
    description: "See how candidates prompt, verify, and build with AI instead of hiding that part of the workflow.",
  },
  {
    title: "Shared reviewer context",
    description: "Give interviewers the same evidence trail so hiring decisions are faster and less subjective.",
  },
  {
    title: "Operational controls for teams",
    description: "Manage templates, team access, analytics, and session limits from one structured platform.",
  },
] as const;

export const pricingPackages: readonly PricingPackage[] = [
  {
    name: "Free",
    priceLabel: "$0",
    cadenceLabel: "/ month",
    audience: "For pilots and early evaluation",
    description: "A lightweight way to test AI-native interviews with your own team before you standardize the process.",
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

export const pricingComparison = [
  { label: "Interview volume", free: "5 / month", pro: "50 / month", enterprise: "Custom" },
  { label: "Team access", free: "Limited", pro: "Unlimited", enterprise: "Unlimited" },
  { label: "AI usage analytics", free: "Basic", pro: "Advanced", enterprise: "Advanced" },
  { label: "Custom scenarios", free: "No", pro: "Yes", enterprise: "Yes" },
  { label: "Security review", free: "No", pro: "No", enterprise: "Yes" },
  { label: "Integrations", free: "No", pro: "Standard", enterprise: "Custom" },
  { label: "Onboarding support", free: "Self-serve", pro: "Lightweight", enterprise: "Hands-on" },
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
    description: "Introduce AI-native interviewing with procurement, security, and workflow alignment handled upfront.",
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
