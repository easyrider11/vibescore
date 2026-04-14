import { NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getAIConfig, getAnthropicClient } from "../../../../lib/ai";
import { rateLimit, AI_RATE_LIMIT, rateLimitResponse } from "../../../../lib/rate-limit";

export async function POST(req: NextRequest) {
  const body = await req.json();
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

  const rl = rateLimit(`ai:${token}`, AI_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl);

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
  const config = getAIConfig();

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

  if (config.isReal) {
    const selectedModel = "claude-haiku-4-5-20251001";
    try {
      const client = getAnthropicClient();
      const message = await client.messages.create({
        model: selectedModel,
        max_tokens: 150,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.2,
      });

      const textBlock = message.content.find((b) => b.type === "text");
      completion = textBlock && "text" in textBlock ? textBlock.text : "";
      model = selectedModel;
      tokensUsed = (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0);
    } catch {
      // Fall through to mock
    }
  }

  if (!completion) {
    completion = generateMockCompletion(filePath, prefix, currentLine);
    model = "mock";
  }

  const responseTimeMs = Date.now() - startMs;

  await prisma.event.create({
    data: {
      sessionId: session.id,
      type: "AI_INLINE_SUGGEST",
      payload: {
        filePath,
        cursorLine,
        cursorColumn,
        completion: completion.slice(0, 200),
        model,
        tokensUsed,
        responseTimeMs,
      },
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
    return "";
  }

  return "";
}
