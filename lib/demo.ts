import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { Decision } from "./rubric";

const DEMO_COOKIE = "vibe_session";
const SESSION_EXPIRY_DAYS = 30;

export const DEMO_EMAIL_PREFIX = "demo+";
export const DEMO_EMAIL_DOMAIN = "buildscore.dev";

export function isDemoUser(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.startsWith(DEMO_EMAIL_PREFIX) && email.endsWith(`@${DEMO_EMAIL_DOMAIN}`);
}

// ───────────────────────── Candidate seeds ─────────────────────────

type DemoOutcome = Extract<Decision, "strong_hire" | "hire" | "no_hire">;

// Tuple: [name, email, position, scenarioSlug, outcome, durationMin, aiHeavy, submittedHoursAgo]
type CandidateTuple = [string, string, string, string, DemoOutcome, number, boolean, number];

const CANDIDATE_TUPLES: CandidateTuple[] = [
  ["Alex Chen", "alex@example.com", "Senior Backend Engineer", "agent-loop-fix", "strong_hire", 38, true, 4],
  ["Sarah K.", "sarah@example.com", "AI Engineer", "agent-loop-fix", "hire", 52, true, 26],
  ["Jordan Park", "jordan@example.com", "Full-Stack Engineer", "needs-review-status", "hire", 44, false, 50],
  ["Alex Chen", "alex@example.com", "Senior Full-Stack Engineer", "needs-review-status", "strong_hire", 41, true, 74],
  ["Test Candidate 2", "test2@example.com", "Backend Engineer", "review-summary-bug", "no_hire", 28, false, 98],
  ["Jordan Park", "jordan@example.com", "Backend Engineer", "review-summary-bug", "hire", 47, true, 122],
  ["Sarah K.", "sarah@example.com", "Senior Engineer", "bugfix", "strong_hire", 22, true, 150],
  ["Test Candidate 3", "test3@example.com", "Engineer II", "feature-add", "hire", 55, false, 180],
  ["Alex Chen", "alex@example.com", "Staff Engineer", "refactor", "strong_hire", 46, true, 220],
];

// ───────────────────────── Scenario fixtures ─────────────────────────

interface ScenarioFixture {
  convos: Array<{ mode: string; q: string; a: string; tokens: number }>;
  diff: string;
  notes: string;
}

const scenarioFixtures: Record<string, ScenarioFixture> = {
  "agent-loop-fix": {
    convos: [
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
    diff: `--- a/lib/agent.js
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
    notes:
      "Two bugs: 1) steps == 'maxSteps' compares number to string so the guard never fires; 2) tool results were appended with role='assistant' so the model never saw them and kept re-calling. Fix is minimal — correct the comparison and use role='tool'.",
  },
  "needs-review-status": {
    convos: [
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
    diff: `--- a/lib/session-list.js
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
    notes:
      "Derived the needs_review state in the data layer rather than the UI so multiple surfaces stay consistent. Raw session.status is untouched; only reviewState is new.",
  },
  "review-summary-bug": {
    convos: [
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
    diff: `--- a/lib/reviewer-summary.js
+++ b/lib/reviewer-summary.js
@@
-  const endEvent = events.find((event) => event.type === "session_submitted");
-  const endEventIndex = events.findIndex((event) => event.type === "session_submitted");
+  const endEvent = events.find((event) => event.type === "session_ended");
+  const endEventIndex = events.findIndex((event) => event.type === "session_ended");
`,
    notes:
      "Root cause: end-session writes type='session_ended' but reviewer-summary looks for 'session_submitted'. Renamed on the reader side and left a TODO to centralize the event-name constant.",
  },
  bugfix: {
    convos: [
      {
        mode: "explain",
        q: "What is totalCost missing?",
        a: "It multiplies price by 1 instead of item.qty, so multi-quantity line items undercount. Replace `price` with `price * (item.qty || 1)` and add a guard for empty carts.",
        tokens: 110,
      },
    ],
    diff: `--- a/lib/calc.js
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
    notes: "Added quantity to totalCost and guarded empty cart.",
  },
  "feature-add": {
    convos: [
      {
        mode: "explain",
        q: "How should /notify validate its payload?",
        a: "For MVP require a `message` string and either `userId` or `channel`. Return 400 on missing fields, 202 with `{queued: true}` on success. Lean on a shared validator so server.js stays thin.",
        tokens: 180,
      },
    ],
    diff: `--- a/server.js
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
    notes: "Added /notify handler, 400 on missing message, 202 with queued payload otherwise.",
  },
  refactor: {
    convos: [
      {
        mode: "review",
        q: "Does extracting EmailAdapter / SmsAdapter help?",
        a: "Yes — you remove duplicated formatting code and gain testability (inject a MockAdapter). Prefer constructor injection over module-level defaults so tests stay isolated.",
        tokens: 150,
      },
    ],
    diff: `--- a/service.js
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
    notes: "Extracted createNotifier adapter and injected email/sms so tests can supply mocks.",
  },
};

// ───────────────────────── Decision profiles ─────────────────────────

interface DecisionProfile {
  scores: Record<string, number>;
  summary: string;
  strengths: string[];
  improvements: string[];
}

const DECISION_PROFILES: Record<DemoOutcome, DecisionProfile> = {
  strong_hire: {
    scores: {
      repo_understanding: 5,
      requirement_clarity: 4,
      delivery_quality: 5,
      architecture_tradeoffs: 4,
      ai_usage_quality: 5,
    },
    summary:
      "Candidate diagnosed the root cause quickly, validated their hypothesis with targeted test runs, and used AI as a thinking partner rather than a crutch. Fix is minimal, well-reasoned, and they articulated follow-up work.",
    strengths: [
      "Correctly identified both bugs without relying on AI to guess",
      "Verified the fix with multiple test iterations",
      "Outlined what they would add next: evals, tracing, cost ceiling",
    ],
    improvements: ["Could have added a regression test covering the max-steps guard edge case"],
  },
  hire: {
    scores: {
      repo_understanding: 4,
      requirement_clarity: 4,
      delivery_quality: 4,
      architecture_tradeoffs: 3,
      ai_usage_quality: 4,
    },
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
  },
  no_hire: {
    scores: {
      repo_understanding: 2,
      requirement_clarity: 2,
      delivery_quality: 2,
      architecture_tradeoffs: 2,
      ai_usage_quality: 2,
    },
    summary:
      "Candidate struggled to locate the root cause and submitted without running tests. AI usage was thin and the fix did not address the underlying issue.",
    strengths: ["Navigated the repo structure quickly"],
    improvements: [
      "Did not verify fix with test runs",
      "Relied on surface-level patches rather than diagnosing",
      "No concrete follow-up plan",
    ],
  },
};

// ───────────────────────── Event timeline ─────────────────────────

function buildEvents(opts: {
  scenarioSlug: string;
  startedAt: Date;
  endedAt: Date;
  aiHeavy: boolean;
}) {
  const { scenarioSlug, startedAt, endedAt, aiHeavy } = opts;
  const fixture = scenarioFixtures[scenarioSlug] ?? scenarioFixtures.bugfix;
  const convos = fixture.convos;
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

  const emittedConvos = aiHeavy ? convos : convos.slice(0, 1);
  emittedConvos.forEach((c, i) => {
    const slot = aiHeavy ? 0.18 + (i * 0.6) / Math.max(convos.length, 1) : 0.35;
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
      stdout:
        "ok  - tool result reaches the final answer\nok  - docs lookup surfaces\nok  - max steps guard fires cleanly\nok  - step count stays within budget",
    },
  });
  pushAt(0.92, { type: "SUBMIT", payload: { source: "editor" } });

  return events;
}

// ───────────────────────── Provision / end ─────────────────────────

export async function provisionDemoAccount(): Promise<{
  userId: string;
  orgId: string;
  redirectTo: string;
}> {
  const suffix = crypto.randomBytes(4).toString("hex");
  const email = `${DEMO_EMAIL_PREFIX}${suffix}@${DEMO_EMAIL_DOMAIN}`;

  const user = await prisma.user.create({
    data: { email, name: "Demo Recruiter", role: "owner" },
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

  // Create all sessions in parallel — each session's child rows are chained within.
  await Promise.all(
    CANDIDATE_TUPLES.map(async (tuple) => {
      const [name, seedEmail, position, scenarioSlug, outcome, durationMin, aiHeavy, submittedHoursAgo] = tuple;
      const scenario = scenarioBySlug.get(scenarioSlug);
      if (!scenario) return;

      const endedAt = new Date(Date.now() - submittedHoursAgo * 60 * 60 * 1000);
      const startedAt = new Date(endedAt.getTime() - durationMin * 60 * 1000);
      const createdAt = new Date(startedAt.getTime() - 60 * 1000);
      const fixture = scenarioFixtures[scenarioSlug] ?? scenarioFixtures.bugfix;
      const profile = DECISION_PROFILES[outcome];

      const session = await prisma.interviewSession.create({
        data: {
          scenarioId: scenario.id,
          createdById: user.id,
          publicToken: crypto.randomBytes(12).toString("hex"),
          publicReportToken: crypto.randomBytes(16).toString("hex"),
          candidateName: name,
          candidateEmail: seedEmail,
          position,
          durationMinutes: scenario.timeLimitMin ?? 45,
          status: "completed",
          startedAt,
          endedAt,
          createdAt,
        },
      });

      const events = buildEvents({ scenarioSlug, startedAt, endedAt, aiHeavy });

      await Promise.all([
        events.length > 0
          ? prisma.event.createMany({
              data: events.map((e) => ({
                sessionId: session.id,
                type: e.type,
                payload: e.payload as object,
                createdAt: e.createdAt,
              })),
            })
          : Promise.resolve(),
        prisma.submission.create({
          data: {
            sessionId: session.id,
            snapshot: { files: [] } as object,
            diffText: fixture.diff,
            clarificationNotes: fixture.notes,
            createdAt: new Date(endedAt.getTime() - 30 * 1000),
          },
        }),
        prisma.rubricScore.create({
          data: {
            sessionId: session.id,
            scores: profile.scores as object,
            comments: profile.summary,
            decision: outcome,
            createdAt: new Date(endedAt.getTime() + 10 * 60 * 1000),
          },
        }),
        prisma.aIGrade.create({
          data: {
            sessionId: session.id,
            scores: profile.scores as object,
            decision: outcome,
            summary: profile.summary,
            strengths: profile.strengths as object,
            improvements: profile.improvements as object,
            model: "mock",
            createdAt: new Date(endedAt.getTime() + 60 * 1000),
          },
        }),
      ]);
    }),
  );

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await prisma.sessionToken.create({ data: { token, userId: user.id, expiresAt } });

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

export async function endDemoSession(user: { id: string; email: string; orgId: string | null }): Promise<void> {
  if (!isDemoUser(user.email)) return;

  const sessions = await prisma.interviewSession.findMany({
    where: { createdById: user.id },
    select: { id: true },
  });
  const sessionIds = sessions.map((s) => s.id);

  if (sessionIds.length > 0) {
    // Child rows are independent siblings under interviewSession — parallelize.
    await Promise.all([
      prisma.event.deleteMany({ where: { sessionId: { in: sessionIds } } }),
      prisma.submission.deleteMany({ where: { sessionId: { in: sessionIds } } }),
      prisma.rubricScore.deleteMany({ where: { sessionId: { in: sessionIds } } }),
      prisma.aIGrade.deleteMany({ where: { sessionId: { in: sessionIds } } }),
      prisma.sessionToken.deleteMany({ where: { userId: user.id } }),
    ]);
    await prisma.interviewSession.deleteMany({ where: { id: { in: sessionIds } } });
  } else {
    await prisma.sessionToken.deleteMany({ where: { userId: user.id } });
  }

  if (user.orgId) {
    await prisma.user.update({ where: { id: user.id }, data: { orgId: null } });
    await prisma.organization.delete({ where: { id: user.orgId } }).catch(() => {});
  }
  await prisma.user.delete({ where: { id: user.id } }).catch(() => {});

  const cookieStore = await cookies();
  cookieStore.set({ name: DEMO_COOKIE, value: "", maxAge: 0, path: "/" });
}
