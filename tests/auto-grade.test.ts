import { describe, expect, it, vi, beforeEach } from "vitest";
import { autoGrade, type GradingInput } from "../lib/auto-grade";

const baseInput: GradingInput = {
  scenario: {
    title: "Bugfix: Cart total incorrect",
    description: "Fix a bug in totalCost so it accounts for quantity.",
    tasks: ["Identify bug", "Fix to account for qty", "Add tests"],
    evaluationPoints: ["Locates root cause quickly", "Fix includes qty"],
  },
  events: [
    { type: "file_open", payload: { path: "lib/calc.js" }, createdAt: new Date() },
    { type: "ai_query", payload: { mode: "explain", question: "What does totalCost do?" }, createdAt: new Date() },
  ],
  submissions: [
    {
      diffText: `--- a/lib/calc.js\n+++ b/lib/calc.js\n-  return items.reduce((s, i) => s + i.price, 0);\n+  return items.reduce((s, i) => s + i.price * i.qty, 0);`,
      clarificationNotes: "Bug was in calc.js, price wasn't multiplied by quantity.",
      snapshot: { "lib/calc.js": "fixed content" },
    },
  ],
  durationMinutes: 45,
  actualMinutes: 32,
};

describe("autoGrade", () => {
  beforeEach(() => {
    vi.stubEnv("AI_MODE", "mock");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
  });

  it("returns mock scores when AI_MODE is mock", async () => {
    const result = await autoGrade(baseInput);
    expect(result.scores).toBeDefined();
    expect(result.scores.repo_understanding).toBeGreaterThanOrEqual(1);
    expect(result.scores.repo_understanding).toBeLessThanOrEqual(5);
    expect(result.decision).toBeDefined();
    expect(["strong_hire", "hire", "no_hire", "strong_no_hire"]).toContain(result.decision);
    expect(result.summary).toBeTruthy();
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.improvements)).toBe(true);
  });

  it("returns all 5 rubric dimensions", async () => {
    const result = await autoGrade(baseInput);
    const dims = ["repo_understanding", "requirement_clarity", "delivery_quality", "architecture_tradeoffs", "ai_usage_quality"];
    for (const dim of dims) {
      expect(result.scores).toHaveProperty(dim);
      expect(result.scores[dim as keyof typeof result.scores]).toBeGreaterThanOrEqual(1);
      expect(result.scores[dim as keyof typeof result.scores]).toBeLessThanOrEqual(5);
    }
  });

  it("handles empty events and submissions gracefully", async () => {
    const emptyInput: GradingInput = {
      ...baseInput,
      events: [],
      submissions: [],
    };
    const result = await autoGrade(emptyInput);
    expect(result.scores).toBeDefined();
    expect(result.decision).toBeDefined();
  });
});
