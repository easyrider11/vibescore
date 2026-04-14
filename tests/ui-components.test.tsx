import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DiffViewer } from "../components/DiffViewer";
import { ScenarioGrid } from "../components/ScenarioGrid";
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
