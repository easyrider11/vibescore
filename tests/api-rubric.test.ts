import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "../app/api/rubric/route";

const mockGetCurrentUser = vi.fn();
const mockFindFirst = vi.fn();
const mockCreate = vi.fn().mockResolvedValue({
  id: "rubric-1",
  sessionId: "sess-1",
  scores: {},
  comments: "Good",
  decision: "",
});

vi.mock("../lib/auth", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

vi.mock("../lib/prisma", () => ({
  prisma: {
    interviewSession: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    rubricScore: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

function makeReq(body: Record<string, unknown>) {
  return new Request("http://localhost/api/rubric", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

describe("POST /api/rubric", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ id: "user-1" });
    mockFindFirst.mockResolvedValue({ id: "sess-1", createdById: "user-1" });
  });

  it("creates a rubric score", async () => {
    const scores = {
      repo_understanding: 4,
      requirement_clarity: 3,
      delivery_quality: 5,
      architecture_tradeoffs: 3,
      ai_usage_quality: 4,
    };
    const res = await POST(makeReq({ sessionId: "sess-1", scores, comments: "Good work" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("rubric-1");
  });

  it("returns 401 if not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const res = await POST(makeReq({ sessionId: "sess-1", scores: {} }));
    expect(res.status).toBe(401);
  });

  it("returns 400 if required fields are missing", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 if session not owned by user", async () => {
    mockFindFirst.mockResolvedValue(null);
    const res = await POST(makeReq({ sessionId: "sess-other", scores: { a: 1 } }));
    expect(res.status).toBe(404);
  });
});
