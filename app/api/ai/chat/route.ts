import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "../../../../lib/prisma";

const fallback = [
  "Start by summarizing the repo structure and identify key modules.",
  "Focus on the failing behavior: check the calculation function for edge cases.",
  "Propose a minimal test: one passing case, one edge case.",
  "For architecture notes, highlight queues, retries, and idempotency.",
];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = body.token?.toString();
  const question = body.question?.toString();
  const context = body.context?.toString() ?? "";

  if (!token || !question) {
    return NextResponse.json({ error: "Missing token/question" }, { status: 400 });
  }

  const session = await prisma.interviewSession.findUnique({ where: { publicToken: token } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let response = "";
  let mocked = true;

  if (process.env.AI_MODE === "real" && process.env.OPENAI_API_KEY) {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5.2-codex",
      messages: [
        { role: "system", content: "You are an interview assistant. Be concise and practical." },
        { role: "user", content: `Question: ${question}\n\nContext:\n${context}` },
      ],
      temperature: 0.3,
    });
    response = completion.choices[0]?.message?.content ?? "";
    mocked = false;
  } else {
    const index = Math.abs(question.length + context.length) % fallback.length;
    response = fallback[index];
  }

  await prisma.event.create({
    data: {
      sessionId: session.id,
      type: "AI_CHAT",
      payload: { question, response, mocked },
    },
  });

  return NextResponse.json({ response, mocked });
}
