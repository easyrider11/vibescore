import { getAIConfig, getAnthropicClient } from "./ai";
import { parseJsonOr } from "./json";

export interface GradingInput {
  scenario: {
    title: string;
    description: string;
    tasks: string[];
    evaluationPoints: string[];
  };
  events: {
    type: string;
    payload: Record<string, unknown>;
    createdAt: Date | string;
  }[];
  submissions: {
    diffText: string;
    clarificationNotes?: string | null;
    snapshot: Record<string, string>;
  }[];
  durationMinutes: number;
  actualMinutes: number | null;
}

export interface GradingResult {
  scores: {
    repo_understanding: number;
    requirement_clarity: number;
    delivery_quality: number;
    architecture_tradeoffs: number;
    ai_usage_quality: number;
  };
  decision: "strong_hire" | "hire" | "no_hire" | "strong_no_hire";
  summary: string;
  strengths: string[];
  improvements: string[];
}

const MOCK_RESULT: GradingResult = {
  scores: {
    repo_understanding: 3,
    requirement_clarity: 3,
    delivery_quality: 3,
    architecture_tradeoffs: 3,
    ai_usage_quality: 3,
  },
  decision: "hire",
  summary: "Candidate demonstrated adequate understanding of the codebase and completed the core task. AI usage was reasonable but could be more strategic.",
  strengths: [
    "Identified the root cause efficiently",
    "Clean, readable code changes",
    "Good use of AI for exploration",
  ],
  improvements: [
    "Could have documented assumptions more clearly",
    "Edge cases not fully addressed",
    "Test coverage could be more comprehensive",
  ],
};

function buildPrompt(input: GradingInput): string {
  // Summarize events
  const aiQueries = input.events.filter((e) => e.type === "ai_query");
  const fileViews = input.events.filter((e) => e.type === "file_open");
  const searches = input.events.filter((e) => e.type === "search");

  const aiSummary = aiQueries.length > 0
    ? aiQueries
        .slice(0, 15) // Cap to avoid token overflow
        .map((e) => {
          const p = e.payload;
          return `- [${p.mode || "unknown"}] Q: ${String(p.question || "").slice(0, 200)}`;
        })
        .join("\n")
    : "(no AI queries made)";

  const filesViewed = fileViews
    .map((e) => String(e.payload.path || ""))
    .filter(Boolean);
  const uniqueFiles = [...new Set(filesViewed)];

  const latestSubmission = input.submissions[input.submissions.length - 1];
  const diff = latestSubmission?.diffText?.slice(0, 4000) || "(no submission)";
  const notes = latestSubmission?.clarificationNotes || "(none)";

  return `You are an expert technical interviewer evaluating a candidate's performance on a coding assessment.

## Scenario
**${input.scenario.title}**
${input.scenario.description}

### Tasks
${input.scenario.tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}

### Evaluation Criteria
${input.scenario.evaluationPoints.map((p) => `- ${p}`).join("\n")}

## Candidate's Session Data

### Time
- Allowed: ${input.durationMinutes} minutes
- Actual: ${input.actualMinutes !== null ? `${input.actualMinutes} minutes` : "unknown"}

### Files Explored (${uniqueFiles.length} unique)
${uniqueFiles.slice(0, 20).join(", ") || "(none)"}

### AI Copilot Usage (${aiQueries.length} queries)
${aiSummary}

### Searches Made
${searches.length > 0 ? searches.slice(0, 10).map((e) => `- "${e.payload.query}"`).join("\n") : "(none)"}

### Clarification Notes
${notes}

### Code Diff (final submission)
\`\`\`diff
${diff}
\`\`\`

## Your Task

Evaluate the candidate across these 5 dimensions (score 1-5 each):
1. **repo_understanding** — How well did they navigate and understand the codebase?
2. **requirement_clarity** — Did they ask good questions, document assumptions?
3. **delivery_quality** — Is the code correct, clean, well-structured?
4. **architecture_tradeoffs** — Did they consider scalability, maintainability, edge cases?
5. **ai_usage_quality** — How effectively and strategically did they use the AI copilot?

Then provide:
- An overall **decision**: strong_hire, hire, no_hire, or strong_no_hire
- A 2-3 sentence **summary** of the candidate's performance
- 3 bullet-point **strengths**
- 3 bullet-point **improvements** (areas to grow)

Respond in this exact JSON format (no markdown, no code fences):
{
  "scores": {
    "repo_understanding": <1-5>,
    "requirement_clarity": <1-5>,
    "delivery_quality": <1-5>,
    "architecture_tradeoffs": <1-5>,
    "ai_usage_quality": <1-5>
  },
  "decision": "<strong_hire|hire|no_hire|strong_no_hire>",
  "summary": "<2-3 sentences>",
  "strengths": ["<bullet 1>", "<bullet 2>", "<bullet 3>"],
  "improvements": ["<bullet 1>", "<bullet 2>", "<bullet 3>"]
}`;
}

export async function autoGrade(input: GradingInput): Promise<GradingResult> {
  const config = getAIConfig();

  if (!config.isReal) {
    // Mock mode — return default scores
    return MOCK_RESULT;
  }

  const client = getAnthropicClient();
  const prompt = buildPrompt(input);

  const message = await client.messages.create({
    model: config.model,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => "text" in b);
  const text = textBlock && "text" in textBlock ? textBlock.text : "";

  try {
    // Strip any accidental code fences
    const cleaned = text
      .replace(/^```json?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as GradingResult;

    // Validate and clamp scores
    const dims = [
      "repo_understanding",
      "requirement_clarity",
      "delivery_quality",
      "architecture_tradeoffs",
      "ai_usage_quality",
    ] as const;

    for (const dim of dims) {
      const val = parsed.scores[dim];
      parsed.scores[dim] = typeof val === "number" ? Math.max(1, Math.min(5, Math.round(val))) : 3;
    }

    // Validate decision
    const validDecisions = ["strong_hire", "hire", "no_hire", "strong_no_hire"];
    if (!validDecisions.includes(parsed.decision)) {
      parsed.decision = "no_hire";
    }

    // Ensure arrays
    if (!Array.isArray(parsed.strengths)) parsed.strengths = [];
    if (!Array.isArray(parsed.improvements)) parsed.improvements = [];

    return parsed;
  } catch {
    console.error("Failed to parse AI grading response:", text.slice(0, 500));
    return MOCK_RESULT;
  }
}
