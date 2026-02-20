import { describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/run-tests/route";

vi.mock("../lib/prisma", () => ({
  prisma: {
    interviewSession: {
      findUnique: vi.fn().mockResolvedValue({ id: "sess-1", scenario: { slug: "bugfix" } }),
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
  safePath: (_root: string, p: string) => p,
}));

vi.mock("fs/promises", () => {
  const readFile = vi.fn().mockResolvedValue("console.log('hi')");
  return {
    default: { readFile },
    readFile,
  };
});

describe("POST /api/run-tests", () => {
  it("returns test result", async () => {
    const req = new Request("http://localhost/api/run-tests", {
      method: "POST",
      body: JSON.stringify({ token: "tok" }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
  });
});
