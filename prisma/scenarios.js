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
    slug: "agent-loop-fix",
    title: "AI-native: Fix a broken LLM agent loop",
    description:
      "Debug a tool-calling agent that runs away and ignores tool outputs. Fix the loop, explain the blast radius, and outline what you'd add next.",
    background:
      "A small LLM agent product has two incidents in flight: some sessions loop forever and burn budget, and tool results frequently fail to propagate into the final answer. The agent core is small but subtly broken.",
    tasks: [
      "Read lib/agent.js and identify both bugs in the tool-calling loop",
      "Fix the loop so it terminates and so tool outputs reach the model",
      "Describe what you would add next (evals, tracing, cost guard)",
    ],
    hints: [
      "Check how messages are appended after a tool call — the model needs to see them",
      "The max-steps guard has a typing bug; it never fires as written",
      "Use AI freely for explain/review modes, but own the diagnosis yourself",
    ],
    evaluationPoints: [
      "Locates both bugs and explains why each matters in production",
      "Fix is minimal and correct; tests in tests/agent.test.js pass",
      "Articulates follow-ups: evals, tracing, cost ceilings, retry policy",
      "Uses AI as a thinking partner rather than to guess at the fix",
    ],
    rubric: defaultRubric,
    aiPolicy: defaultAiPolicy,
    timeLimitMin: 60,
  },
  {
    slug: "prompt-injection-defense",
    title: "AI-native: Harden the support agent against prompt injection",
    description:
      "Two production incidents: the agent leaked its system prompt, and a user convinced it to issue a refund. Separate user input from system context, gate destructive tools, and describe what else you would defend against.",
    background:
      "Customer-support LLM agent with tools (get_order_status, refund_order). An adversarial user exploited lazy prompt construction and missing approval gates.",
    tasks: [
      "Stop the agent from leaking its system prompt when a user sends an 'ignore above instructions' injection",
      "Stop destructive tools (refund_order) from executing without explicit approval",
      "Describe additional injection patterns and how you would detect them in production",
    ],
    hints: [
      "The user message is landing inside the system prompt — that's why the injection works",
      "Check whether the requiresApproval flag on tools is ever actually checked",
    ],
    evaluationPoints: [
      "Understands why concatenating user text into system context is the root cause",
      "Introduces a clean separation (structured messages + tool gating)",
      "Articulates the wider threat model: indirect injection, tool allowlists, output filters, canaries",
      "Does not over-engineer — pragmatic first fix, follow-ups separate",
    ],
    rubric: defaultRubric,
    aiPolicy: defaultAiPolicy,
    timeLimitMin: 60,
  },
  {
    slug: "rag-retrieval-miss",
    title: "AI-native: Fix a RAG pipeline returning the wrong docs",
    description:
      "A docs chatbot returns the same top-1 document for every question. Debug the retrieval layer, fix the similarity and ranking bugs, and describe how you'd measure retrieval quality going forward.",
    background:
      "Small RAG pipeline over a 6-doc corpus. The generation layer is fine; retrieval is broken. Two subtle bugs in lib/retrieve.js.",
    tasks: [
      "Find and fix both bugs in lib/retrieve.js",
      "Make tests/retrieve.test.js pass",
      "Describe an evaluation strategy: what dataset, what metric (recall@k, MRR, NDCG), how you'd monitor it",
    ],
    hints: [
      "Check whether the similarity function is actually cosine, or just a dot product",
      "Trace a query end-to-end. Which doc comes back first, and does that make sense?",
    ],
    evaluationPoints: [
      "Diagnoses the similarity bug without guessing",
      "Catches the sort-order bug (easy to miss)",
      "Proposes a realistic eval harness: labeled query/doc pairs + recall@k",
      "Understands why cosine-score range matters for downstream thresholding",
    ],
    rubric: defaultRubric,
    aiPolicy: defaultAiPolicy,
    timeLimitMin: 50,
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
