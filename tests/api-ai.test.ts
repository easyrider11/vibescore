import { describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/ai/chat/route";

vi.mock("../lib/prisma", () => ({
  prisma: {
    interviewSession: {
      findUnique: vi.fn().mockResolvedValue({ id: "sess-1" }),
    },
    event: {
      create: vi.fn().mockResolvedValue({ id: "event-1" }),
    },
  },
}));

describe("POST /api/ai/chat", () => {
  it("returns mock response", async () => {
    const req = new Request("http://localhost/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ token: "tok", question: "Summarize repo" }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
  });
});
