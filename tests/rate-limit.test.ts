import { describe, expect, it, vi, beforeEach } from "vitest";
import { rateLimit, type RateLimitConfig } from "../lib/rate-limit";

const config: RateLimitConfig = { limit: 3, windowMs: 1000 };

describe("rateLimit", () => {
  beforeEach(() => {
    // Reset by using unique keys per test
  });

  it("allows requests within the limit", () => {
    const key = `test-${Date.now()}-allow`;
    expect(rateLimit(key, config).allowed).toBe(true);
    expect(rateLimit(key, config).allowed).toBe(true);
    expect(rateLimit(key, config).allowed).toBe(true);
  });

  it("blocks requests exceeding the limit", () => {
    const key = `test-${Date.now()}-block`;
    rateLimit(key, config);
    rateLimit(key, config);
    rateLimit(key, config);
    const result = rateLimit(key, config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetMs).toBeGreaterThan(0);
  });

  it("tracks remaining count correctly", () => {
    const key = `test-${Date.now()}-remaining`;
    expect(rateLimit(key, config).remaining).toBe(2);
    expect(rateLimit(key, config).remaining).toBe(1);
    expect(rateLimit(key, config).remaining).toBe(0);
  });

  it("allows requests after window expires", async () => {
    const shortConfig: RateLimitConfig = { limit: 1, windowMs: 50 };
    const key = `test-${Date.now()}-expire`;
    expect(rateLimit(key, shortConfig).allowed).toBe(true);
    expect(rateLimit(key, shortConfig).allowed).toBe(false);
    await new Promise((r) => setTimeout(r, 60));
    expect(rateLimit(key, shortConfig).allowed).toBe(true);
  });

  it("isolates different keys", () => {
    const key1 = `test-${Date.now()}-a`;
    const key2 = `test-${Date.now()}-b`;
    rateLimit(key1, config);
    rateLimit(key1, config);
    rateLimit(key1, config);
    expect(rateLimit(key1, config).allowed).toBe(false);
    expect(rateLimit(key2, config).allowed).toBe(true);
  });
});
