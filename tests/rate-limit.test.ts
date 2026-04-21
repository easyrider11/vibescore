import { describe, expect, it } from "vitest";
import { rateLimit, type RateLimitConfig } from "../lib/rate-limit";

const config: RateLimitConfig = { limit: 3, windowMs: 1000 };

describe("rateLimit (in-memory fallback)", () => {
  it("allows requests within the limit", async () => {
    const key = `test-${Date.now()}-allow`;
    expect((await rateLimit(key, config)).allowed).toBe(true);
    expect((await rateLimit(key, config)).allowed).toBe(true);
    expect((await rateLimit(key, config)).allowed).toBe(true);
  });

  it("blocks requests exceeding the limit", async () => {
    const key = `test-${Date.now()}-block`;
    await rateLimit(key, config);
    await rateLimit(key, config);
    await rateLimit(key, config);
    const result = await rateLimit(key, config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetMs).toBeGreaterThan(0);
  });

  it("tracks remaining count correctly", async () => {
    const key = `test-${Date.now()}-remaining`;
    expect((await rateLimit(key, config)).remaining).toBe(2);
    expect((await rateLimit(key, config)).remaining).toBe(1);
    expect((await rateLimit(key, config)).remaining).toBe(0);
  });

  it("allows requests after window expires", async () => {
    const shortConfig: RateLimitConfig = { limit: 1, windowMs: 50 };
    const key = `test-${Date.now()}-expire`;
    expect((await rateLimit(key, shortConfig)).allowed).toBe(true);
    expect((await rateLimit(key, shortConfig)).allowed).toBe(false);
    await new Promise((r) => setTimeout(r, 60));
    expect((await rateLimit(key, shortConfig)).allowed).toBe(true);
  });

  it("isolates different keys", async () => {
    const key1 = `test-${Date.now()}-a`;
    const key2 = `test-${Date.now()}-b`;
    await rateLimit(key1, config);
    await rateLimit(key1, config);
    await rateLimit(key1, config);
    expect((await rateLimit(key1, config)).allowed).toBe(false);
    expect((await rateLimit(key2, config)).allowed).toBe(true);
  });
});
