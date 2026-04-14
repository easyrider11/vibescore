const defaultAiPolicy = { allowedModes: ["summary", "explain", "tests", "review"] };

const defaultRubric = [
  "Repo understanding",
  "Requirement clarification notes",
  "Delivery quality",
  "Architecture tradeoffs",
  "AI usage quality",
];

const scenarios = [
  {
    slug: "bugfix",
    title: "Bugfix: Cart total incorrect",
    description: "Fix a bug in totalCost so it accounts for quantity.",
    background: "A checkout service is returning incorrect totals for multi-quantity items.",
    tasks: [
      "Identify bug in totalCost()",
      "Fix to account for item qty",
      "Explain edge cases and add a quick test plan",
    ],
    hints: [
      "Start from app.js and trace into lib/calc.js",
      "Check how totals are computed for multiple quantities",
    ],
    evaluationPoints: [
      "Locates root cause quickly",
      "Fix includes qty and handles empty cart",
      "Explains test cases and edge conditions",
    ],
    rubric: defaultRubric,
    aiPolicy: defaultAiPolicy,
    timeLimitMin: 45,
  },
  {
    slug: "feature-add",
    title: "Feature: Add /notify endpoint",
    description: "Extend HTTP server with /notify and a basic test plan.",
    background: "A notification service needs a new endpoint to enqueue notifications.",
    tasks: [
      "Add /notify endpoint",
      "Return 202 with queued: true",
      "Describe testing approach",
    ],
    hints: [
      "Look at server.js handler routing",
      "Keep payload validation lightweight for MVP",
    ],
    evaluationPoints: [
      "API behavior matches requirements",
      "Handles invalid payloads gracefully",
      "Documents testing approach",
    ],
    rubric: defaultRubric,
    aiPolicy: defaultAiPolicy,
    timeLimitMin: 60,
  },
  {
    slug: "refactor",
    title: "Refactor: Notification adapters",
    description: "Extract adapters and improve testability.",
    background: "The notification module has duplicated logic that is hard to test.",
    tasks: [
      "Extract adapter functions",
      "Reduce duplication",
      "Explain test strategy",
    ],
    hints: [
      "service.js has repeated logic for email/sms",
      "Consider dependency injection for testing",
    ],
    evaluationPoints: [
      "Cleaner module boundaries",
      "Testability improves via injected adapters",
      "Tradeoffs explained",
    ],
    rubric: defaultRubric,
    aiPolicy: defaultAiPolicy,
    timeLimitMin: 50,
  },
  {
    slug: "review-summary-bug",
    title: "Bugfix: Session review summary incorrect",
    description: "Fix a bug where reviewer summary shows the wrong session state after a candidate ends the session.",
    background: "A reviewer relies on the summary panel to decide what is ready for manual review. Completed sessions sometimes still appear as in progress, and the summary metadata is inconsistent.",
    tasks: [
      "Trace the session end flow across the relevant files",
      "Find and fix the root cause of the incorrect reviewer summary",
      "Verify that the summary reflects the ended session correctly",
    ],
    hints: [
      "Start from the session end route and follow what gets written",
      "Check whether event names and summary aggregation rules agree with each other",
    ],
    evaluationPoints: [
      "Understands the flow across multiple backend files",
      "Identifies the real root cause instead of patching symptoms",
      "Uses a reasonable verification strategy after the fix",
    ],
    rubric: defaultRubric,
    aiPolicy: defaultAiPolicy,
    timeLimitMin: 45,
  },
  {
    slug: "needs-review-status",
    title: "Feature: Add Needs Review status to session list",
    description: "Add a derived status so reviewers can quickly spot completed sessions that still need manual review.",
    background: "Reviewers can currently see raw statuses like pending, in_progress, and completed. That makes it hard to identify which completed sessions still need human follow-up.",
    tasks: [
      "Understand how session list rows are built and rendered",
      "Add a derived status called needs_review",
      "Show it clearly in the session list without mutating the raw session status",
    ],
    hints: [
      "Look at where list rows are assembled before they reach the table",
      "Decide carefully whether the derived state belongs in the data layer or only in the UI",
    ],
    evaluationPoints: [
      "Chooses a clean boundary for the derived status",
      "Updates the UI without breaking existing status behavior",
      "Verifies the new behavior with reasonable tests",
    ],
    rubric: defaultRubric,
    aiPolicy: defaultAiPolicy,
    timeLimitMin: 60,
  },
];

module.exports = { scenarios };
