import { NextRequest } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { parseJsonOr } from "../../../../lib/json";
import { getAIConfig, getAnthropicClient } from "../../../../lib/ai";
import { rateLimit, AI_RATE_LIMIT, rateLimitResponse } from "../../../../lib/rate-limit";
import { captureException } from "../../../../lib/observability";

const fallbackByMode: Record<string, string[]> = {
  summary: [
    "This codebase is a small Node.js application with an entry point at `app.js` that imports a `totalCost` function from `lib/calc.js`. The main function creates a cart with items containing price and quantity, then logs the total.\n\nKey files:\n- `app.js` — entry point, creates sample cart data\n- `lib/calc.js` — contains the `totalCost()` calculation logic\n\nThe architecture is straightforward: a single utility module pattern.",
    "The repository contains a simple JavaScript project structured as:\n\n```\napp.js          → Main entry, runs totalCost()\nlib/calc.js     → Core calculation logic\n```\n\nThe `totalCost` function processes an array of cart items. Each item has `price` and `qty` properties.",
  ],
  explain: [
    "Let me walk through this file:\n\n1. **Imports**: The file imports `totalCost` from `./lib/calc`\n2. **Main function**: Creates a `cart` array with two items, each having `price` and `qty`\n3. **Output**: Calls `totalCost(cart)` and logs the result\n\nThe key logic to examine is inside `lib/calc.js` where the actual calculation happens. The bug likely lives there — check how it handles the `qty` field.",
    "This function processes the cart items by iterating through them. Look at how it accumulates the total — does it multiply `price * qty` for each item, or does it only sum prices?\n\nThat's where the bug would be if the total doesn't account for quantity.",
  ],
  tests: [
    "Here are test suggestions for this code:\n\n```javascript\n// test/calc.test.js\nconst { totalCost } = require('./lib/calc');\n\n// Happy path\nconsole.assert(totalCost([{ price: 10, qty: 2 }]) === 20, 'single item with qty');\n\n// Multiple items\nconsole.assert(totalCost([{ price: 10, qty: 2 }, { price: 5, qty: 4 }]) === 40, 'multiple items');\n\n// Edge cases\nconsole.assert(totalCost([]) === 0, 'empty cart');\nconsole.assert(totalCost([{ price: 0, qty: 5 }]) === 0, 'zero price');\nconsole.assert(totalCost([{ price: 10, qty: 0 }]) === 0, 'zero quantity');\n```\n\nThese cover the critical paths: single item, multiple items, empty cart, and zero values.",
    "I'd suggest these test cases:\n\n1. **Basic**: Cart with one item → verify `price * qty`\n2. **Multiple items**: Two items → verify sum of `price * qty` for each\n3. **Empty cart**: `[]` → should return `0`\n4. **Edge case**: Item with `qty: 0` → should contribute `0`",
  ],
  review: [
    "Looking at the code:\n\n**Issues found:**\n1. The `totalCost` function likely doesn't multiply by quantity — it probably only sums `item.price` instead of `item.price * item.qty`\n2. No input validation for missing `qty` or `price` fields\n3. No handling for negative values\n\n**Suggestions:**\n- Fix the calculation to `item.price * item.qty`\n- Add a guard: `if (!Array.isArray(cart)) return 0`\n- Consider using `reduce()` for a cleaner implementation",
    "**Code Review:**\n\nThe main issue is in the calculation logic. The cart items have `qty` (quantity) but the total appears to ignore it.\n\n**Recommended fix:**\n```javascript\nfunction totalCost(cart) {\n  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);\n}\n```\n\nThis ensures each item's price is multiplied by its quantity before summing.",
  ],
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = body.token?.toString();
  const question = body.question?.toString();
  const context = body.context?.toString() ?? "";
  const mode = body.mode?.toString() ?? "summary";
  const stream = body.stream === true;

  if (!token || !question) {
    return new Response(JSON.stringify({ error: "Missing token/question" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Rate limit by session token
  const rl = rateLimit(`ai:${token}`, AI_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl);

  const session = await prisma.interviewSession.findUnique({ where: { publicToken: token }, include: { scenario: true } });
  if (!session) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });

  if (session.status === "completed" || session.status === "cancelled") {
    return new Response(JSON.stringify({ error: "Session ended" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const aiPolicy = parseJsonOr<{ allowedModes?: string[] }>(session.scenario.aiPolicy, {});
  const allowedModes: string[] = aiPolicy.allowedModes || ["summary", "explain", "tests", "review"];
  if (!allowedModes.includes(mode)) {
    return new Response(JSON.stringify({ error: "Mode not allowed" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const startMs = Date.now();
  const config = getAIConfig();

  const systemPrompt = `You are an AI coding assistant embedded in a technical interview on Buildscore.
You are helping the candidate understand and work with the following codebase.

## Task
${session.scenario.description}

## Current File Context
${context}

## Instructions
- Help the candidate understand the codebase structure and existing code
- Answer questions about the code, architecture, and technologies used
- Generate code solutions when asked
- Explain bugs, suggest fixes, and help debug
- Be helpful but don't volunteer the complete solution unprompted
- Format code blocks with the appropriate language tag
- Be concise and practical

Mode: ${mode}`;

  // ─── Streaming mode (real API via SDK) ───
  if (stream && config.isReal) {
    try {
      const client = getAnthropicClient();
      const sdkStream = client.messages.stream({
        model: config.model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: question }],
        temperature: 0.3,
      });

      let fullResponse = "";
      let inputTokens = 0;
      let outputTokens = 0;

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of sdkStream) {
              if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                fullResponse += event.delta.text;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", text: event.delta.text })}\n\n`));
              } else if (event.type === "message_start" && event.message?.usage) {
                inputTokens = event.message.usage.input_tokens || 0;
              } else if (event.type === "message_delta") {
                outputTokens = (event as unknown as { usage?: { output_tokens?: number } }).usage?.output_tokens || 0;
              }
            }
          } catch {
            // Stream error — send what we have
          }

          const responseTimeMs = Date.now() - startMs;
          const tokensUsed = inputTokens + outputTokens;

          await prisma.event.create({
            data: {
              sessionId: session.id,
              type: "AI_CHAT",
              payload: { question, response: fullResponse, mocked: false, mode, model: config.model, tokensUsed, responseTimeMs },
            },
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", tokensUsed, responseTimeMs, model: config.model })}\n\n`));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch {
      // Fallback to mock on SDK error
      return mockStreamResponse(mode, question, context, session.id, startMs);
    }
  }

  // ─── Streaming mode (mock) ───
  if (stream) {
    return mockStreamResponse(mode, question, context, session.id, startMs);
  }

  // ─── Non-streaming mode ───
  let response = "";
  let mocked = true;
  let model = "mock";
  let tokensUsed = 0;

  if (config.isReal) {
    try {
      const client = getAnthropicClient();
      const message = await client.messages.create({
        model: config.model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: question }],
        temperature: 0.3,
      });

      const textBlock = message.content.find((b) => b.type === "text");
      response = textBlock && "text" in textBlock ? textBlock.text : "";
      model = config.model;
      tokensUsed = (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0);
      mocked = false;
    } catch (err) {
      captureException(err, {
        sessionId: session.id,
        route: "/api/ai/chat",
        tags: { mode, model: config.model },
      });
      const fallback = fallbackByMode[mode] || fallbackByMode.summary;
      response = fallback[(question.length + context.length) % fallback.length];
    }
  } else {
    const fallback = fallbackByMode[mode] || fallbackByMode.summary;
    response = fallback[(question.length + context.length) % fallback.length];
  }

  const responseTimeMs = Date.now() - startMs;

  await prisma.event.create({
    data: {
      sessionId: session.id,
      type: "AI_CHAT",
      payload: { question, response, mocked, mode, model, tokensUsed, responseTimeMs },
    },
  });

  return new Response(JSON.stringify({ response, mocked, model, tokensUsed, responseTimeMs }), {
    headers: { "Content-Type": "application/json" },
  });
}

/* ── Mock streaming helper ── */
async function mockStreamResponse(mode: string, question: string, context: string, sessionId: string, startMs: number) {
  const fallback = fallbackByMode[mode] || fallbackByMode.summary;
  const fullResponse = fallback[(question.length + context.length) % fallback.length];
  const words = fullResponse.split(/(\s+)/);

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for (const word of words) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", text: word })}\n\n`));
        await new Promise((r) => setTimeout(r, 15 + Math.random() * 25));
      }

      const responseTimeMs = Date.now() - startMs;
      await prisma.event.create({
        data: {
          sessionId,
          type: "AI_CHAT",
          payload: { question, response: fullResponse, mocked: true, mode, model: "mock", tokensUsed: 0, responseTimeMs },
        },
      });

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", tokensUsed: 0, responseTimeMs, model: "mock" })}\n\n`));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
