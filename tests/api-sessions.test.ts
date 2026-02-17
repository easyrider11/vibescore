import { describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/sessions/route";

vi.mock("../lib/auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ id: "user-1" }),
}));

vi.mock("../lib/prisma", () => ({
  prisma: {
    scenario: { findUnique: vi.fn().mockResolvedValue({ id: "scn-1", slug: "bugfix" }) },
    interviewSession: { create: vi.fn().mockResolvedValue({ id: "sess-1" }) },
  },
}));

vi.mock("../lib/workspace", () => ({
  ensureWorkspace: vi.fn().mockResolvedValue("/tmp/work"),
}));

describe("POST /api/sessions", () => {
  it("creates an interview session", async () => {
    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      body: JSON.stringify({ scenarioId: "scn-1" }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
  });
});
