import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const DEMO_COOKIE = "vibe_session";
const SESSION_EXPIRY_DAYS = 30;

interface CandidateSeed {
  name: string;
  email: string;
  position: string;
  scenarioSlug: string;
  outcome: "strong_hire" | "hire" | "no_hire";
  durationMin: number;
  aiHeavy: boolean;
  submittedMinutesAgo: number;
}

const CANDIDATE_SEEDS: CandidateSeed[] = [
  {
    name: "Priya Patel",
    email: "priya.p@example.com",
    position: "Senior Backend Engineer",
    scenarioSlug: "agent-loop-fix",
    outcome: "strong_hire",
    durationMin: 38,
    aiHeavy: true,
    submittedMinutesAgo: 60 * 4,
  },
  {
    name: "Diego Martinez",
    email: "diego.m@example.com",
    position: "AI Engineer",
    scenarioSlug: "agent-loop-fix",
    outcome: "hire",
    durationMin: 52,
    aiHeavy: true,
    submittedMinutesAgo: 60 * 26,
  },
  {
    name: "Sam Osei",
    email: "sam.o@example.com",
    position: "Full-Stack Engineer",
    scenarioSlug: "needs-review-status",
    outcome: "hire",
    durationMin: 44,
    aiHeavy: false,
    submittedMinutesAgo: 60 * 50,
  },
  {
    name: "Ji-woo Han",
    email: "jiwoo.h@example.com",
    position: "Senior Full-Stack Engineer",
    scenarioSlug: "needs-review-status",
    outcome: "strong_hire",
    durationMin: 41,
    aiHeavy: true,
    submittedMinutesAgo: 60 * 74,
  },
  {
    name: "Noah Becker",
    email: "noah.b@example.com",
    position: "Backend Engineer",
    scenarioSlug: "review-summary-bug",
    outcome: "no_hire",
    durationMin: 28,
    aiHeavy: false,
    submittedMinutesAgo: 60 * 98,
  },
  {
    name: "Aarav Desai",
    email: "aarav.d@example.com",
    position: "Backend Engineer",
    scenarioSlug: "review-summary-bug",
    outcome: "hire",
    durationMin: 47,
    aiHeavy: true,
    submittedMinutesAgo: 60 * 122,
  },
  {
    name: "Maya Lindgren",
    email: "maya.l@example.com",
    position: "Senior Engineer",
    scenarioSlug: "bugfix",
    outcome: "strong_hire",
    durationMin: 22,
    aiHeavy: true,
    submittedMinutesAgo: 60 * 150,
  },
  {
    name: "Tomás Rivera",
    email: "tomas.r@example.com",
    position: "Engineer II",
    scenarioSlug: "feature-add",
    outcome: "hire",
    durationMin: 55,
    aiHeavy: false,
    submittedMinutesAgo: 60 * 180,
  },
  {
    name: "Chen Wei",
    email: "chen.w@example.com",
    position: "Staff Engineer",
    scenarioSlug: "refactor",
    outcome: "strong_hire",
    durationMin: 46,
    aiHeavy: true,
    submittedMinutesAgo: 60 * 220,
  },
];

const AI_CONVERSATIONS: Record<string, Array<{ mode: string; q: string; a: string; tokens: number }>> = {
  "agent-loop-fix": [
    {
      mode: "explain",
      q: "Walk me through the loop in lib/agent.js — where could this go infinite?",
      a: "The while(true) continues until nextTurn returns a 'final' turn. Two concerns: (1) the guard `steps == 'maxSteps'` compares a number to a string literal, so it never trips. (2) the branch that records tool results pushes them under role=\"assistant\" rather than role=\"tool\", so the mock model's `toolResults = messages.filter(m => m.role === 'tool')` will always be empty — it keeps re-requesting the same tool.",
      tokens: 420,
    },
    {
      mode: "review",
      q: "Review my fix: change steps == 'maxSteps' to steps >= maxSteps and push tool results with role: 'tool'.",
      a: "Looks right. One nit: increment `steps` inside the tool_call branch, not after the guard, so the guard sees the correct count. Also pass `name` on the role:'tool' message so the model can match it. Tests in tests/agent.test.js should pass now.",
      tokens: 210,
    },
    {
      mode: "tests",
      q: "What additional tests would you add beyond the four in tests/agent.test.js?",
      a: "I'd add: (1) a cost-ceiling test that asserts no more than N tokens / N tool calls per query, (2) a retry/backoff test for flaky tools, (3) a test that tool errors surface in the final answer rather than looping, and (4) an eval harness comparing final answers to a fixture set of (query, expected-substring) pairs.",
      tokens: 300,
    },
  ],
  "needs-review-status": [
    {
      mode: "explain",
      q: "Where should the needs_review derived status live — data layer or UI?",
      a: "Derive it in the data layer (session-list.js) because multiple UI surfaces will want it and you want a single source of truth. Don't mutate session.status — add a `reviewState` field alongside it. The UI just reads reviewState.",
      tokens: 180,
    },
    {
      mode: "review",
      q: "Reviewing my patch: I added a derived `reviewState` on each row in lib/session-list.js and render a chip in ui/render-sessions-table.js.",
      a: "Good. Double-check: the chip order matters — 'needs review' should sort above 'completed' so reviewers see it first. Also make sure status-badge.js handles the new value with a distinct color, otherwise it'll fall through to the default.",
      tokens: 220,
    },
  ],
  "review-summary-bug": [
    {
      mode: "explain",
      q: "Why would a completed session look in-progress in the reviewer summary?",
      a: "getReviewerSummary filters events by type 'session_submitted', but end-session.js writes events with type 'session_ended'. The names disagree, so the summary never finds an end event and defaults to in_progress.",
      tokens: 160,
    },
    {
      mode: "review",
      q: "Fix: align the event name on both sides to 'session_ended'. Sound right?",
      a: "Yes. Either rename the constant once and import it from session-events.js, or check both names during a migration window. Definitely don't leave the disagreement — that's how we got here.",
      tokens: 140,
    },
  ],
  bugfix: [
    {
      mode: "explain",
      q: "What is totalCost missing?",
      a: "It multiplies price by 1 instead of item.qty, so multi-quantity line items undercount. Replace `price` with `price * (item.qty || 1)` and add a guard for empty carts.",
      tokens: 110,
    },
  ],
  "feature-add": [
    {
      mode: "explain",
      q: "How should /notify validate its payload?",
      a: "For MVP require a `message` string and either `userId` or `channel`. Return 400 on missing fields, 202 with `{queued: true}` on success. Lean on a shared validator so server.js stays thin.",
      tokens: 180,
    },
  ],
  refactor: [
    {
      mode: "review",
      q: "Does extracting EmailAdapter / SmsAdapter help?",
      a: "Yes — you remove duplicated formatting code and gain testability (inject a MockAdapter). Prefer constructor injection over module-level defaults so tests stay isolated.",
      tokens: 150,
    },
  ],
};

const DIFFS: Record<string, string> = {
  "agent-loop-fix": `--- a/lib/agent.js
+++ b/lib/agent.js
@@
       // Record the assistant's tool call and the tool's result so the
       // model can see them on the next turn.
-      messages.push({ role: "assistant", tool: turn.name, args: turn.args });
-      messages.push({ role: "assistant", name: turn.name, content: result });
+      messages.push({ role: "assistant", tool_call: { name: turn.name, args: turn.args } });
+      messages.push({ role: "tool", name: turn.name, content: result });
     }

     // Guard against infinite loops.
-    if (steps == "maxSteps") {
+    if (steps >= maxSteps) {
       throw new Error(\`agent exceeded max steps (\${maxSteps})\`);
     }
     steps += 1;
`,
  "needs-review-status": `--- a/lib/session-list.js
+++ b/lib/session-list.js
@@
 function buildSessionRows(sessions) {
-  return sessions.map((s) => ({ ...s }));
+  return sessions.map((s) => ({
+    ...s,
+    reviewState: s.status === "completed" && !s.reviewedAt ? "needs_review" : s.status,
+  }));
 }
--- a/ui/status-badge.js
+++ b/ui/status-badge.js
@@
 const COLORS = {
   pending: "gray",
   in_progress: "blue",
   completed: "green",
+  needs_review: "orange",
 };
`,
  "review-summary-bug": `--- a/lib/reviewer-summary.js
+++ b/lib/reviewer-summary.js
@@
-  const endEvent = events.find((event) => event.type === "session_submitted");
-  const endEventIndex = events.findIndex((event) => event.type === "session_submitted");
+  const endEvent = events.find((event) => event.type === "session_ended");
+  const endEventIndex = events.findIndex((event) => event.type === "session_ended");
`,
  bugfix: `--- a/lib/calc.js
+++ b/lib/calc.js
@@
-function totalCost(cart) {
-  return cart.items.reduce((sum, item) => sum + item.price, 0);
-}
+function totalCost(cart) {
+  if (!cart?.items?.length) return 0;
+  return cart.items.reduce(
+    (sum, item) => sum + item.price * (item.qty || 1),
+    0,
+  );
+}
`,
  "feature-add": `--- a/server.js
+++ b/server.js
@@
 if (req.url === "/health") { return res.end("ok"); }
+if (req.url === "/notify" && req.method === "POST") {
+  let body = "";
+  req.on("data", (c) => (body += c));
+  req.on("end", () => {
+    const payload = JSON.parse(body || "{}");
+    if (!payload.message) { res.statusCode = 400; return res.end("message required"); }
+    res.statusCode = 202;
+    res.end(JSON.stringify({ queued: true }));
+  });
+  return;
+}
`,
  refactor: `--- a/service.js
+++ b/service.js
@@
+function createNotifier({ email, sms } = {}) {
+  return {
+    send(channel, payload) {
+      if (channel === "email") return email.send(payload);
+      if (channel === "sms") return sms.send(payload);
+      throw new Error("unknown channel");
+    },
+  };
+}
+module.exports = { createNotifier };
`,
};

const NOTES: Record<string, string> = {
  "agent-loop-fix":
    "Two bugs: 1) steps == 'maxSteps' compares number to string so the guard never fires; 2) tool results were appended with role='assistant' so the model never saw them and kept re-calling. Fix is minimal — correct the comparison and use role='tool'.",
  "needs-review-status":
    "Derived the needs_review state in the data layer rather than the UI so multiple surfaces stay consistent. Raw session.status is untouched; only reviewState is new.",
  "review-summary-bug":
    "Root cause: end-session writes type='session_ended' but reviewer-summary looks for 'session_submitted'. Renamed on the reader side and left a TODO to centralize the event-name constant.",
  bugfix: "Added quantity to totalCost and guarded empty cart.",
  "feature-add": "Added /notify handler, 400 on missing message, 202 with queued payload otherwise.",
  refactor: "Extracted createNotifier adapter and injected email/sms so tests can supply mocks.",
};

function decisionScores(outcome: CandidateSeed["outcome"]): Record<string, number> {
  if (outcome === "strong_hire")
    return {
      repo_understanding: 5,
      requirement_clarity: 4,
      delivery_quality: 5,
      architecture_tradeoffs: 4,
      ai_usage_quality: 5,
    };
  if (outcome === "hire")
    return {
      repo_understanding: 4,
      requirement_clarity: 4,
      delivery_quality: 4,
      architecture_tradeoffs: 3,
      ai_usage_quality: 4,
    };
  return {
    repo_understanding: 2,
    requirement_clarity: 2,
    delivery_quality: 2,
    architecture_tradeoffs: 2,
    ai_usage_quality: 2,
  };
}

function decisionCopy(
  outcome: CandidateSeed["outcome"],
): { summary: string; strengths: string[]; improvements: string[] } {
  if (outcome === "strong_hire") {
    return {
      summary:
        "Candidate diagnosed the root cause quickly, validated their hypothesis with targeted test runs, and used AI as a thinking partner rather than a crutch. Fix is minimal, well-reasoned, and they articulated follow-up work.",
      strengths: [
        "Correctly identified both bugs without relying on AI to guess",
        "Verified the fix with multiple test iterations",
        "Outlined what they would add next: evals, tracing, cost ceiling",
      ],
      improvements: [
        "Could have added a regression test covering the max-steps guard edge case",
      ],
    };
  }
  if (outcome === "hire") {
    return {
      summary:
        "Candidate delivered a working fix within the time budget and explained their reasoning clearly. AI usage was pragmatic, and they ran tests before submitting.",
      strengths: [
        "Walked through the code before editing",
        "Asked AI for targeted reviews rather than broad completions",
        "Tests passed after the fix",
      ],
      improvements: [
        "Missed one edge case in the first pass; caught it on re-test",
        "Could sharpen the follow-up plan for production hardening",
      ],
    };
  }
  return {
    summary:
      "Candidate struggled to locate the root cause and submitted without running tests. AI usage was thin and the fix did not address the underlying issue.",
    strengths: ["Navigated the repo structure quickly"],
    improvements: [
      "Did not verify fix with test runs",
      "Relied on surface-level patches rather than diagnosing",
      "No concrete follow-up plan",
    ],
  };
}

function buildEvents(
  scenarioSlug: string,
  startedAt: Date,
  endedAt: Date,
  aiHeavy: boolean,
) {
  const convos = AI_CONVERSATIONS[scenarioSlug] || AI_CONVERSATIONS.bugfix;
  const events: Array<{ type: string; payload: Record<string, unknown>; createdAt: Date }> = [];
  const totalMs = endedAt.getTime() - startedAt.getTime();
  const pushAt = (frac: number, ev: { type: string; payload: Record<string, unknown> }) => {
    events.push({
      ...ev,
      createdAt: new Date(startedAt.getTime() + Math.round(totalMs * frac)),
    });
  };

  pushAt(0, { type: "START_SESSION", payload: { scenario: scenarioSlug } });
  pushAt(0.05, { type: "OPEN_FILE", payload: { path: "notes.md" } });
  pushAt(0.08, { type: "OPEN_FILE", payload: { path: "lib/agent.js" } });
  pushAt(0.12, { type: "OPEN_FILE", payload: { path: "tests/agent.test.js" } });

  if (aiHeavy) {
    convos.forEach((c, i) => {
      const slot = 0.18 + (i * 0.6) / Math.max(convos.length, 1);
      pushAt(slot, {
        type: "AI_CHAT",
        payload: {
          mode: c.mode,
          question: c.q,
          response: c.a,
          tokensUsed: c.tokens,
          responseTimeMs: 900 + i * 150,
          mocked: true,
        },
      });
    });
  } else {
    const first = convos[0];
    if (first) {
      pushAt(0.35, {
        type: "AI_CHAT",
        payload: {
          mode: first.mode,
          question: first.q,
          response: first.a,
          tokensUsed: first.tokens,
          responseTimeMs: 1100,
          mocked: true,
        },
      });
    }
  }

  pushAt(0.55, {
    type: "RUN_TESTS",
    payload: {
      passed: false,
      stdout: "FAIL - tool result reaches the final answer\nFAIL - step count stays within budget",
    },
  });
  pushAt(0.78, {
    type: "RUN_TESTS",
    payload: {
      passed: true,
      stdout: "ok  - tool result reaches the final answer\nok  - docs lookup surfaces\nok  - max steps guard fires cleanly\nok  - step count stays within budget",
    },
  });
  pushAt(0.92, { type: "SUBMIT", payload: { source: "editor" } });

  return events;
}

/**
 * Provision a fresh demo account with a populated org, seeded sessions,
 * rubric scores, AI grades, and a logged-in session cookie. Returns the
 * URL the caller should redirect to (the recruiter dashboard).
 */
export async function provisionDemoAccount(): Promise<{
  userId: string;
  orgId: string;
  redirectTo: string;
}> {
  const suffix = crypto.randomBytes(4).toString("hex");
  const email = `demo+${suffix}@buildscore.dev`;

  const user = await prisma.user.create({
    data: {
      email,
      name: "Demo Recruiter",
      role: "owner",
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: "Demo Workspace",
      plan: "pro",
      defaultAiMode: "mock",
      members: { connect: { id: user.id } },
    },
  });

  const scenarios = await prisma.scenario.findMany();
  const scenarioBySlug = new Map(scenarios.map((s) => [s.slug, s]));

  for (const seed of CANDIDATE_SEEDS) {
    const scenario = scenarioBySlug.get(seed.scenarioSlug);
    if (!scenario) continue;

    const endedAt = new Date(Date.now() - seed.submittedMinutesAgo * 60 * 1000);
    const startedAt = new Date(endedAt.getTime() - seed.durationMin * 60 * 1000);
    const createdAt = new Date(startedAt.getTime() - 60 * 1000);
    const publicToken = crypto.randomBytes(12).toString("hex");
    const publicReportToken = crypto.randomBytes(16).toString("hex");

    const session = await prisma.interviewSession.create({
      data: {
        scenarioId: scenario.id,
        createdById: user.id,
        publicToken,
        publicReportToken,
        candidateName: seed.name,
        candidateEmail: seed.email,
        position: seed.position,
        durationMinutes: scenario.timeLimitMin ?? 45,
        status: "completed",
        startedAt,
        endedAt,
        createdAt,
      },
    });

    const events = buildEvents(seed.scenarioSlug, startedAt, endedAt, seed.aiHeavy);
    if (events.length > 0) {
      await prisma.event.createMany({
        data: events.map((e) => ({
          sessionId: session.id,
          type: e.type,
          payload: e.payload as object,
          createdAt: e.createdAt,
        })),
      });
    }

    await prisma.submission.create({
      data: {
        sessionId: session.id,
        snapshot: { files: [] } as object,
        diffText: DIFFS[seed.scenarioSlug] || "",
        clarificationNotes: NOTES[seed.scenarioSlug] || "",
        createdAt: new Date(endedAt.getTime() - 30 * 1000),
      },
    });

    const copy = decisionCopy(seed.outcome);
    const scores = decisionScores(seed.outcome);

    await prisma.rubricScore.create({
      data: {
        sessionId: session.id,
        scores: scores as object,
        comments: copy.summary,
        decision: seed.outcome,
        createdAt: new Date(endedAt.getTime() + 10 * 60 * 1000),
      },
    });

    await prisma.aIGrade.create({
      data: {
        sessionId: session.id,
        scores: scores as object,
        decision: seed.outcome,
        summary: copy.summary,
        strengths: copy.strengths as object,
        improvements: copy.improvements as object,
        model: "mock",
        createdAt: new Date(endedAt.getTime() + 60 * 1000),
      },
    });
  }

  // Log the user in
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await prisma.sessionToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: DEMO_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });

  return { userId: user.id, orgId: org.id, redirectTo: "/app" };
}
