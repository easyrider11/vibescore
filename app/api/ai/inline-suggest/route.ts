import { NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { toJsonString } from "../../../../lib/json";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sessionId = body.sessionId?.toString();
  const token = body.token?.toString();
  const filePath = body.filePath?.toString() ?? "";
  const fileContent = body.fileContent?.toString() ?? "";
  const cursorLine = Number(body.cursorLine) || 1;
  const cursorColumn = Number(body.cursorColumn) || 1;

  if (!token) {
    return new Response(JSON.stringify({ error: "Missing token" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = await prisma.interviewSession.findUnique({
    where: { publicToken: token },
  });
  if (!session)
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });

  if (session.status === "completed" || session.status === "cancelled") {
    return new Response(JSON.stringify({ error: "Session ended" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const startMs = Date.now();

  // Split content into lines and build context around cursor
  const lines = fileContent.split("\n");
  const beforeCursor = lines.slice(0, cursorLine).join("\n");
  const afterCursor = lines.slice(cursorLine).join("\n");
  const currentLine = lines[cursorLine - 1] || "";
  const prefix = currentLine.slice(0, cursorColumn - 1);

  const systemPrompt = `You are an inline code completion engine. Complete the code at the cursor position.
Rules:
- Return ONLY the completion text with no explanation, no markdown, no code fences
- The completion should naturally continue from the cursor position
- Keep completions short (1-3 lines typically)
- Match the coding style and indentation of the surrounding code
- If unsure, return an empty string`;

  const userPrompt = `File: ${filePath}

Code before cursor:
${beforeCursor.slice(-1500)}

Cursor is here (after "${prefix}")

Code after cursor:
${afterCursor.slice(0, 500)}

Complete the code at the cursor position:`;

  let completion = "";
  let model = "mock";
  let tokensUsed = 0;

  if (process.env.AI_MODE === "real" && process.env.ANTHROPIC_API_KEY) {
    // Use Haiku for speed
    const selectedModel = "claude-haiku-4-5-20251001";
    try {
      const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 150,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
          temperature: 0.2,
        }),
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        completion = data.content?.[0]?.text ?? "";
        model = selectedModel;
        tokensUsed =
          (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);
      }
    } catch {
      // Fall through to mock
    }
  }

  // Mock fallback: generate contextual completions
  if (!completion) {
    completion = generateMockCompletion(filePath, prefix, currentLine);
    model = "mock";
  }

  const responseTimeMs = Date.now() - startMs;

  // Log the suggestion event
  await prisma.event.create({
    data: {
      sessionId: session.id,
      type: "AI_INLINE_SUGGEST",
      payload: toJsonString({
        filePath,
        cursorLine,
        cursorColumn,
        completion: completion.slice(0, 200),
        model,
        tokensUsed,
        responseTimeMs,
      }),
    },
  });

  return new Response(
    JSON.stringify({ completion, model, tokensUsed, responseTimeMs }),
    { headers: { "Content-Type": "application/json" } }
  );
}

function generateMockCompletion(
  filePath: string,
  prefix: string,
  currentLine: string
): string {
  const trimmed = prefix.trim();

  // Context-aware mock completions
  if (trimmed.startsWith("function ") || trimmed.startsWith("const ")) {
    if (trimmed.includes("(") && !trimmed.includes(")"))
      return ") {\n  \n}";
    if (trimmed.endsWith("=")) return " () => {\n  \n};";
  }

  if (trimmed.startsWith("if ") || trimmed.startsWith("if(")) {
    if (!trimmed.includes("{")) return " {\n  \n}";
  }

  if (trimmed.startsWith("for ")) {
    if (!trimmed.includes("{"))
      return "(let i = 0; i < items.length; i++) {\n  \n}";
  }

  if (trimmed.startsWith("import ")) {
    if (trimmed.includes("from"))
      return filePath.endsWith(".ts") ? '";' : "';";
    return '{ } from "./";';
  }

  if (trimmed.startsWith("console.")) {
    return "log();";
  }

  if (trimmed.startsWith("return ")) {
    return "null;";
  }

  if (trimmed === "" && currentLine.trim() === "") {
    // Empty line — suggest a comment or newline
    return "";
  }

  return "";
}
