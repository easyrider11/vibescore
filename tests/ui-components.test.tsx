import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DiffViewer } from "../components/DiffViewer";
import { ScenarioGrid } from "../components/ScenarioGrid";
import { SessionReport } from "../components/SessionReport";
import { TopBar } from "../components/TopBar";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("TopBar", () => {
  it("renders eyebrow, metadata chips, and action content", () => {
    const html = renderToStaticMarkup(
      <TopBar
        eyebrow="Operator Console"
        title="Candidate Session"
        subtitle="Public link active"
        meta={["45 min", "AI: summary, tests"]}
        actions={<a href="/app">Back</a>}
      />,
    );

    expect(html).toContain("Operator Console");
    expect(html).toContain("45 min");
    expect(html).toContain("AI: summary, tests");
    expect(html).toContain("Back");
  });
});

describe("ScenarioGrid", () => {
  it("shows scenario metadata chips alongside the launch action", () => {
    const html = renderToStaticMarkup(
      <ScenarioGrid
        scenarios={[
          {
            id: "scenario-1",
            title: "Bugfix: Cart total incorrect",
            description: "Fix incorrect totals for multi-quantity items.",
            timeLimitMin: 45,
            allowedModes: ["summary", "tests"],
          },
        ]}
      />,
    );

    expect(html).toContain("45 min");
    expect(html).toContain("summary");
    expect(html).toContain("tests");
    expect(html).toContain("Create Session");
  });
});

describe("SessionReport", () => {
  const baseSession = {
    id: "sess_1",
    status: "completed",
    candidateName: "Priya Patel",
    candidateEmail: "priya@example.com",
    position: "Senior Engineer",
    durationMinutes: 45,
    startedAt: new Date("2026-04-17T10:00:00Z"),
    endedAt: new Date("2026-04-17T10:40:00Z"),
    createdAt: new Date("2026-04-17T09:58:00Z"),
    scenario: {
      title: "AI-native: Fix a broken LLM agent loop",
      description: "Debug a tool-calling agent that runs away and ignores tool outputs.",
      background: "Agent product has two incidents in flight.",
      tasks: ["Diagnose bugs", "Fix the loop", "Describe next steps"],
      evaluationPoints: ["Correct diagnosis", "Minimal fix"],
      aiPolicy: { allowedModes: ["explain", "review"] },
      timeLimitMin: 60,
    },
    events: [
      {
        id: "e1",
        type: "AI_CHAT",
        payload: { mode: "explain", question: "walk me through", response: "answer", tokensUsed: 200 },
        createdAt: new Date("2026-04-17T10:05:00Z"),
      },
      {
        id: "e2",
        type: "RUN_TESTS",
        payload: { passed: true, stdout: "ok" },
        createdAt: new Date("2026-04-17T10:30:00Z"),
      },
    ],
    submissions: [
      {
        id: "sub1",
        diffText: "+ fixed\n- broken",
        clarificationNotes: "root cause explained",
        createdAt: new Date("2026-04-17T10:38:00Z"),
      },
    ],
    rubricScores: [],
    aiGrade: {
      scores: { repo_understanding: 5, requirement_clarity: 4, delivery_quality: 5, architecture_tradeoffs: 4, ai_usage_quality: 5 },
      decision: "strong_hire",
      summary: "Diagnosed root cause quickly.",
      strengths: ["Clear reasoning"],
      improvements: ["Add regression test"],
      model: "mock",
    },
  };

  it("renders the candidate header, KPIs, and grade summary", () => {
    const html = renderToStaticMarkup(<SessionReport session={baseSession} />);
    expect(html).toContain("Priya Patel");
    expect(html).toContain("AI-native: Fix a broken LLM agent loop");
    expect(html).toContain("Strong Hire");
    expect(html).toContain("AI Queries");
    expect(html).toContain("Strengths");
  });

  it("marks the public variant read-only", () => {
    const html = renderToStaticMarkup(<SessionReport session={baseSession} variant="public" />);
    expect(html).toContain("Shared read-only");
  });
});

describe("DiffViewer", () => {
  it("renders a change summary and semantic diff line styling", () => {
    const diffText = [
      "diff --git a/app.js b/app.js",
      "@@ -1 +1 @@",
      "-console.log('old')",
      "+console.log('new')",
    ].join("\n");

    const html = renderToStaticMarkup(<DiffViewer diffText={diffText} />);

    expect(html).toContain("1 addition");
    expect(html).toContain("1 deletion");
    expect(html).toContain("text-emerald");
    expect(html).toContain("text-rose");
    expect(html).toContain("text-amber");
  });
});
