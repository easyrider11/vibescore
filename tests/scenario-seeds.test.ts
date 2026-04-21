import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "..");

async function loadScenarioCatalog() {
  try {
    return await import("../prisma/scenarios");
  } catch {
    return { scenarios: [] as Array<{ slug: string }> };
  }
}

describe("scenario catalog", () => {
  it("includes the new backend bug hunt and fullstack behavior-change scenarios", async () => {
    const { scenarios } = await loadScenarioCatalog();
    const slugs = scenarios.map((scenario) => scenario.slug);

    expect(slugs).toContain("review-summary-bug");
    expect(slugs).toContain("needs-review-status");
  });

  it("ships the AI-native agent-loop-fix scenario", async () => {
    const { scenarios } = await loadScenarioCatalog();
    const slugs = scenarios.map((scenario) => scenario.slug);
    expect(slugs).toContain("agent-loop-fix");
  });

  it("ships the AI-native prompt-injection-defense and rag-retrieval-miss scenarios", async () => {
    const { scenarios } = await loadScenarioCatalog();
    const slugs = scenarios.map((scenario) => scenario.slug);
    expect(slugs).toContain("prompt-injection-defense");
    expect(slugs).toContain("rag-retrieval-miss");
  });
});

describe("scenario seed workspaces", () => {
  it("ships a multi-file backend bug-hunt workspace", () => {
    const scenarioRoot = path.join(repoRoot, "seeds", "scenarios", "review-summary-bug");
    const expectedFiles = [
      "notes.md",
      "api/end-session.js",
      "lib/mock-data.js",
      "lib/session-events.js",
      "lib/session-state.js",
      "lib/reviewer-summary.js",
      "tests/reviewer-summary.test.js",
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.join(scenarioRoot, file))).toBe(true);
    }
  });

  it("ships a multi-file AI-native agent-loop workspace", () => {
    const scenarioRoot = path.join(repoRoot, "seeds", "scenarios", "agent-loop-fix");
    const expectedFiles = [
      "notes.md",
      "api/run-agent.js",
      "lib/agent.js",
      "lib/mock-model.js",
      "lib/tools.js",
      "tests/agent.test.js",
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.join(scenarioRoot, file))).toBe(true);
    }
  });

  it("ships a multi-file prompt-injection-defense workspace", () => {
    const scenarioRoot = path.join(repoRoot, "seeds", "scenarios", "prompt-injection-defense");
    const expectedFiles = [
      "notes.md",
      "api/chat.js",
      "lib/agent.js",
      "lib/mock-model.js",
      "lib/tools.js",
      "tests/injection.test.js",
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.join(scenarioRoot, file))).toBe(true);
    }
  });

  it("ships a multi-file rag-retrieval-miss workspace", () => {
    const scenarioRoot = path.join(repoRoot, "seeds", "scenarios", "rag-retrieval-miss");
    const expectedFiles = [
      "notes.md",
      "api/ask.js",
      "lib/answer.js",
      "lib/docs.js",
      "lib/embed.js",
      "lib/retrieve.js",
      "tests/retrieve.test.js",
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.join(scenarioRoot, file))).toBe(true);
    }
  });

  it("ships a multi-file fullstack behavior-change workspace", () => {
    const scenarioRoot = path.join(repoRoot, "seeds", "scenarios", "needs-review-status");
    const expectedFiles = [
      "notes.md",
      "api/list-sessions.js",
      "lib/mock-data.js",
      "lib/session-list.js",
      "ui/status-badge.js",
      "ui/render-sessions-table.js",
      "tests/session-list.test.js",
      "tests/render-sessions-table.test.js",
    ];

    for (const file of expectedFiles) {
      expect(fs.existsSync(path.join(scenarioRoot, file))).toBe(true);
    }
  });
});
