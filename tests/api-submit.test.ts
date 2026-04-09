import { describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/submit/route";

vi.mock("../lib/prisma", () => ({
  prisma: {
    interviewSession: {
      findUnique: vi.fn().mockResolvedValue({
        id: "sess-1",
        scenario: { slug: "bugfix" },
      }),
    },
    submission: {
      create: vi.fn().mockResolvedValue({ id: "sub-1" }),
    },
    event: {
      create: vi.fn().mockResolvedValue({ id: "event-1" }),
    },
  },
}));

vi.mock("../lib/workspace", () => ({
  ensureWorkspace: vi.fn().mockResolvedValue("/tmp/work"),
  getWorkspacePath: () => "/tmp/work",
  listFiles: vi.fn().mockResolvedValue(["app.js"]),
  safePath: (_root: string, p: string) => "/tmp/work/" + p,
}));

vi.mock("../lib/diff", () => ({
  diffFiles: vi.fn().mockReturnValue("--- a/app.js\n+++ b/app.js\n"),
}));

vi.mock("fs/promises", () => {
  const readFile = vi.fn().mockResolvedValue("console.log('hello')");
  return { default: { readFile }, readFile };
});

function makeReq(body: Record<string, unknown>) {
  return new Request("http://localhost/api/submit", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

describe("POST /api/submit", () => {
  it("creates a submission with snapshot and diff", async () => {
    const res = await POST(makeReq({ token: "tok" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.submissionId).toBe("sub-1");
  });

  it("returns 400 if token is missing", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it("accepts clarification notes", async () => {
    const res = await POST(makeReq({ token: "tok", clarificationNotes: "I chose approach X because..." }));
    expect(res.status).toBe(200);
  });
});
