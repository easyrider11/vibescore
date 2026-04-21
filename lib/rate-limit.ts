/**
 * Rate limiter with two backends:
 *
 * 1. In-memory sliding window (default) — fine for a single serverless
 *    instance, but counters don't survive a cold start and aren't shared
 *    between regions.
 *
 * 2. Upstash Redis fixed window (when UPSTASH_REDIS_REST_URL +
 *    UPSTASH_REDIS_REST_TOKEN are set) — shared across all instances.
 *    Uses their REST pipeline API so there's no TCP pool to manage and
 *    no new npm dependency.
 *
 * If Redis is misconfigured or unreachable, we fall back to in-memory
 * rather than failing the request — observability must never break the
 * product.
 */

import { NextRequest, NextResponse } from "next/server";

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

// ─── Backend selection ─────────────────────────────────────────

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = Boolean(REDIS_URL && REDIS_TOKEN);

// ─── In-memory sliding-window store ────────────────────────────

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

function rateLimitLocal(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const cutoff = now - config.windowMs;

  cleanup(config.windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= config.limit) {
    const oldest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetMs: oldest + config.windowMs - now,
    };
  }

  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: config.limit - entry.timestamps.length,
    resetMs: config.windowMs,
  };
}

// ─── Upstash Redis fixed-window backend ────────────────────────

type PipelineResult = Array<{ result?: number; error?: string }>;

async function rateLimitRedis(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowSec = Math.max(1, Math.ceil(config.windowMs / 1000));
  const bucket = Math.floor(now / config.windowMs);
  const redisKey = `rl:${key}:${bucket}`;
  const nextBucketMs = (bucket + 1) * config.windowMs;
  const resetMs = Math.max(nextBucketMs - now, 0);

  try {
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSec.toString()],
      ]),
      // Short timeout so a slow Redis doesn't stall every request.
      signal: AbortSignal.timeout(1500),
    });

    if (!res.ok) throw new Error(`Upstash pipeline failed: ${res.status}`);
    const data = (await res.json()) as PipelineResult;
    const count = data[0]?.result ?? 0;

    if (count > config.limit) {
      return { allowed: false, remaining: 0, resetMs };
    }
    return {
      allowed: true,
      remaining: Math.max(0, config.limit - count),
      resetMs,
    };
  } catch {
    // Upstash REST hiccup — fall back to in-memory for this call so we
    // never block a user on a transient Redis failure.
    return rateLimitLocal(key, config);
  }
}

// ─── Public API ────────────────────────────────────────────────

/**
 * Check and consume a rate limit token.
 *
 * @param key - Unique identifier (e.g. `ai:${userId}` or `login:${ip}`)
 * @param config - Rate limit configuration
 */
export async function rateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  if (useRedis) return rateLimitRedis(key, config);
  return rateLimitLocal(key, config);
}

// ─── Preset configs ─────────────────────────────────────────────

/** AI endpoints: 20 requests per minute per user */
export const AI_RATE_LIMIT: RateLimitConfig = {
  limit: 20,
  windowMs: 60 * 1000,
};

/** Login endpoints: 10 attempts per 15 minutes per IP */
export const LOGIN_RATE_LIMIT: RateLimitConfig = {
  limit: 10,
  windowMs: 15 * 60 * 1000,
};

/** General API: 60 requests per minute per user */
export const API_RATE_LIMIT: RateLimitConfig = {
  limit: 60,
  windowMs: 60 * 1000,
};

/** Team invite: 20 invites per hour per user */
export const INVITE_RATE_LIMIT: RateLimitConfig = {
  limit: 20,
  windowMs: 60 * 60 * 1000,
};

/** Candidate submission: 30 per hour per token */
export const SUBMIT_RATE_LIMIT: RateLimitConfig = {
  limit: 30,
  windowMs: 60 * 60 * 1000,
};

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Extract a client identifier for rate limiting.
 * Uses x-forwarded-for (Vercel/proxy) or falls back to a generic key.
 */
export function getClientId(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Returns a 429 response with rate limit headers.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(result.resetMs / 1000)),
        "X-RateLimit-Remaining": "0",
      },
    },
  );
}
