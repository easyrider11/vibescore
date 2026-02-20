import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "../../../../lib/prisma";

const fallbackByMode: Record<string, string[]> = {
  summary: [
    "Summarize repo: focus on entry point files and core modules.",
    "List key files and describe their responsibilities.",
  ],
  explain: [
    "Explain this file by walking through functions and data flow.",
    "Highlight the main logic path and dependencies.",
  ],
  tests: [
    "Suggest tests: add one happy path and one edge case.",
    "Create a minimal unit test covering the critical function.",
  ],
  review: [
    "Review patch: check for missing validation and edge cases.",
    "Review patch: confirm error handling and log coverage.",
  ],
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = body.token?.toString();
  const question = body.question?.toString();
  const context = body.context?.toString() ?? "";
  const mode = body.mode?.toString() ?? "summary";

  if (!token || !question) {
    return NextResponse.json({ error: "Missing token/question" }, { status: 400 });
  }

  const session = await prisma.interviewSession.findUnique({ where: { publicToken: token }, include: { scenario: true } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowedModes: string[] = (session.scenario.aiPolicy as any)?.allowedModes || ["summary", "explain", "tests", "review"];
  if (!allowedModes.includes(mode)) {
    return NextResponse.json({ error: "Mode not allowed" }, { status: 403 });
  }

  let response = "";
  let mocked = true;

  if (process.env.AI_MODE === "real" && process.env.OPENAI_API_KEY) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5.2-codex",
      messages: [
        { role: "system", content: "You are an interview assistant. Be concise and practical." },
        { role: "user", content: `Mode: ${mode}\nQuestion: ${question}\n\nContext:\n${context}` },
      ],
      temperature: 0.3,
    });
    response = completion.choices[0]?.message?.content ?? "";
    mocked = false;
  } else {
    const fallback = fallbackByMode[mode] || fallbackByMode.summary;
    response = fallback[(question.length + context.length) % fallback.length];
  }

  await prisma.event.create({
    data: {
      sessionId: session.id,
      type: "AI_CHAT",
      payload: { question, response, mocked, mode },
    },
  });

  return NextResponse.json({ response, mocked });
}
