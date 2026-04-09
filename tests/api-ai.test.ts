import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "../app/api/ai/chat/route";

const mockFindUnique = vi.fn();
const mockEventCreate = vi.fn().mockResolvedValue({ id: "event-1" });

vi.mock("../lib/prisma", () => ({
  prisma: {
    interviewSession: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    event: {
      create: (...args: unknown[]) => mockEventCreate(...args),
    },
  },
}));

vi.mock("../lib/ai", () => ({
  getAIConfig: () => ({ apiKey: undefined, mode: "mock", model: "mock", isReal: false }),
  getAnthropicClient: () => { throw new Error("No client in test"); },
}));

function makeReq(body: Record<string, unknown>) {
  return new Request("http://localhost/api/ai/chat", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

describe("POST /api/ai/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUnique.mockResolvedValue({
      id: "sess-1",
      status: "active",
      scenario: { aiPolicy: { allowedModes: ["summary", "explain", "tests", "review"] } },
    });
  });

  it("returns mock response in mock mode", async () => {
    const res = await POST(makeReq({ token: "tok", question: "Summarize repo", mode: "summary" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.response).toBeTruthy();
    expect(data.mocked).toBe(true);
    expect(data.model).toBe("mock");
  });

  it("returns 400 if token or question is missing", async () => {
    const res = await POST(makeReq({ token: "tok" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 if session not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    const res = await POST(makeReq({ token: "bad", question: "hello" }));
    expect(res.status).toBe(404);
  });

  it("returns 403 if session is completed", async () => {
    mockFindUnique.mockResolvedValue({
      id: "sess-1",
      status: "completed",
      scenario: { aiPolicy: {} },
    });
    const res = await POST(makeReq({ token: "tok", question: "hello" }));
    expect(res.status).toBe(403);
  });

  it("returns 403 if mode is not allowed", async () => {
    mockFindUnique.mockResolvedValue({
      id: "sess-1",
      status: "active",
      scenario: { aiPolicy: { allowedModes: ["summary"] } },
    });
    const res = await POST(makeReq({ token: "tok", question: "hello", mode: "review" }));
    expect(res.status).toBe(403);
  });

  it("logs event to database", async () => {
    await POST(makeReq({ token: "tok", question: "test", mode: "summary" }));
    expect(mockEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sessionId: "sess-1",
          type: "AI_CHAT",
        }),
      })
    );
  });

  it("returns mock streaming response", async () => {
    const res = await POST(makeReq({ token: "tok", question: "hello", mode: "summary", stream: true }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
  });
});
