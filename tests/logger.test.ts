import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { logger } from "../lib/logger";

describe("logger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("emits structured JSON for info", () => {
    logger.info("hello", { userId: "u1" });
    expect(logSpy).toHaveBeenCalledOnce();
    const entry = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(entry.level).toBe("info");
    expect(entry.message).toBe("hello");
    expect(entry.meta.userId).toBe("u1");
    expect(entry.time).toBeTruthy();
  });

  it("redacts sensitive keys", () => {
    logger.error("oops", {
      password: "secret",
      apiKey: "sk-123",
      sessionToken: "t",
      nested: { authorization: "bearer x" },
      safe: "visible",
    });
    const entry = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(entry.meta.password).toBe("[REDACTED]");
    expect(entry.meta.apiKey).toBe("[REDACTED]");
    expect(entry.meta.sessionToken).toBe("[REDACTED]");
    expect(entry.meta.nested.authorization).toBe("[REDACTED]");
    expect(entry.meta.safe).toBe("visible");
  });
});
