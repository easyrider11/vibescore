import { describe, expect, it, vi } from "vitest";

const mockQueryRaw = vi.fn();

vi.mock("../lib/prisma", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

describe("GET /api/health", () => {
  it("returns ok when database reachable", async () => {
    mockQueryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    const { GET } = await import("../app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.checks.database.ok).toBe(true);
  });

  it("returns degraded when database fails", async () => {
    mockQueryRaw.mockRejectedValueOnce(new Error("connection refused"));
    const { GET } = await import("../app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.status).toBe("degraded");
    expect(data.checks.database.ok).toBe(false);
    expect(data.checks.database.error).toContain("connection refused");
  });
});
