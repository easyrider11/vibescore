import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "../app/api/sessions/route";

const mockCreate = vi.fn().mockResolvedValue({ id: "sess-1", publicToken: "tok-abc" });
const mockFindUnique = vi.fn().mockResolvedValue({ id: "scn-1", slug: "bugfix", title: "Bugfix", timeLimitMin: 45 });
const mockGetCurrentUser = vi.fn();
const mockSendInvite = vi.fn().mockResolvedValue({ sent: true });

vi.mock("../lib/auth", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

vi.mock("../lib/prisma", () => ({
  prisma: {
    scenario: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
    interviewSession: { create: (...args: unknown[]) => mockCreate(...args) },
  },
}));

vi.mock("../lib/workspace", () => ({
  ensureWorkspace: vi.fn().mockResolvedValue("/tmp/work"),
}));

vi.mock("../lib/email", () => ({
  sendCandidateInviteEmail: (...args: unknown[]) => mockSendInvite(...args),
}));

function makeReq(body: Record<string, unknown>) {
  return new Request("http://localhost/api/sessions", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];
}

describe("POST /api/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ id: "user-1", email: "recruiter@test.com" });
    mockSendInvite.mockResolvedValue({ sent: true });
  });

  it("creates an interview session", async () => {
    const res = await POST(makeReq({ scenarioId: "scn-1" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("sess-1");
  });

  it("returns 401 if not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const res = await POST(makeReq({ scenarioId: "scn-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 if scenarioId is missing", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 if scenario does not exist", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    const res = await POST(makeReq({ scenarioId: "nonexistent" }));
    expect(res.status).toBe(404);
  });

  it("passes candidate details to create", async () => {
    await POST(makeReq({
      scenarioId: "scn-1",
      candidateName: "Jane Doe",
      candidateEmail: "jane@example.com",
      position: "Senior Engineer",
      durationMinutes: 60,
    }));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          candidateName: "Jane Doe",
          candidateEmail: "jane@example.com",
          position: "Senior Engineer",
          durationMinutes: 60,
        }),
      })
    );
  });

  it("sends invite email when candidate email is provided", async () => {
    const res = await POST(makeReq({
      scenarioId: "scn-1",
      candidateName: "Jane Doe",
      candidateEmail: "jane@example.com",
    }));
    const data = await res.json();

    expect(mockSendInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "jane@example.com",
        candidateName: "Jane Doe",
        scenarioTitle: "Bugfix",
        recruiterEmail: "recruiter@test.com",
        durationMinutes: 45,
      }),
    );
    expect(data.inviteEmail).toEqual({ sent: true });
  });

  it("skips invite email when sendInvite is false", async () => {
    await POST(makeReq({
      scenarioId: "scn-1",
      candidateEmail: "jane@example.com",
      sendInvite: false,
    }));
    expect(mockSendInvite).not.toHaveBeenCalled();
  });

  it("skips invite email when candidate email is missing", async () => {
    await POST(makeReq({ scenarioId: "scn-1" }));
    expect(mockSendInvite).not.toHaveBeenCalled();
  });

  it("returns inviteEmail error when sending fails", async () => {
    mockSendInvite.mockResolvedValueOnce({ sent: false, error: "SMTP down" });
    const res = await POST(makeReq({
      scenarioId: "scn-1",
      candidateEmail: "jane@example.com",
    }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.inviteEmail).toEqual({ sent: false, error: "SMTP down" });
  });
});
