import { describe, expect, it, vi, beforeEach } from "vitest";

describe("sendMagicLinkEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("logs to console in dev when no RESEND_API_KEY", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RESEND_API_KEY", "");
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { sendMagicLinkEmail } = await import("../lib/email");
    const result = await sendMagicLinkEmail("test@example.com", "http://localhost/verify?token=abc");

    expect(result.sent).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Magic link for test@example.com"));
    consoleSpy.mockRestore();
  });

  it("returns error in production when no RESEND_API_KEY", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");

    const { sendMagicLinkEmail } = await import("../lib/email");
    const result = await sendMagicLinkEmail("test@example.com", "http://localhost/verify?token=abc");

    expect(result.sent).toBe(false);
    expect(result.error).toBe("Email provider not configured");
  });
});

describe("sendCandidateInviteEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("logs to console in dev when no RESEND_API_KEY", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RESEND_API_KEY", "");
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { sendCandidateInviteEmail } = await import("../lib/email");
    const result = await sendCandidateInviteEmail({
      to: "alice@example.com",
      candidateName: "Alice",
      scenarioTitle: "Bugfix: Cart total",
      sessionUrl: "http://localhost:3000/s/abc123",
      durationMinutes: 45,
    });

    expect(result.sent).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Candidate invite for alice@example.com"),
    );
    consoleSpy.mockRestore();
  });

  it("returns error in production when no RESEND_API_KEY", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");

    const { sendCandidateInviteEmail } = await import("../lib/email");
    const result = await sendCandidateInviteEmail({
      to: "alice@example.com",
      candidateName: "Alice",
      scenarioTitle: "Bugfix",
      sessionUrl: "http://localhost:3000/s/abc",
      durationMinutes: 45,
    });

    expect(result.sent).toBe(false);
    expect(result.error).toBe("Email provider not configured");
  });
});
