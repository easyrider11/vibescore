import { logger } from "./logger";

// Thin, dependency-free observability layer. Point OBSERVABILITY_WEBHOOK_URL
// at Sentry's store/envelope endpoint, Axiom, Logflare, or a Slack/Discord
// webhook and errors + messages will be shipped there in addition to stdout.
//
// Not a full APM. For deeper instrumentation, install @sentry/nextjs and
// replace `captureException` with `Sentry.captureException`.

const WEBHOOK = process.env.OBSERVABILITY_WEBHOOK_URL;
const SERVICE = process.env.OBSERVABILITY_SERVICE || "buildscore";
const ENV = process.env.NODE_ENV || "development";

interface Context {
  userId?: string;
  sessionId?: string;
  route?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

async function ship(payload: Record<string, unknown>): Promise<void> {
  if (!WEBHOOK) return;
  try {
    // Fire-and-forget; never block the request.
    await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Swallow — observability must never break the product.
    });
  } catch {
    // Same.
  }
}

function contextToMeta(context: Context): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (context.userId) out.userId = context.userId;
  if (context.sessionId) out.sessionId = context.sessionId;
  if (context.route) out.route = context.route;
  if (context.tags) out.tags = context.tags;
  if (context.extra) out.extra = context.extra;
  return out;
}

export function captureException(err: unknown, context: Context = {}): void {
  const e = err instanceof Error ? err : new Error(String(err));
  logger.error(e.message, {
    name: e.name,
    stack: e.stack,
    ...contextToMeta(context),
  });

  if (WEBHOOK) {
    void ship({
      type: "exception",
      service: SERVICE,
      environment: ENV,
      timestamp: new Date().toISOString(),
      message: e.message,
      name: e.name,
      stack: e.stack,
      ...contextToMeta(context),
    });
  }
}

export function captureMessage(
  message: string,
  level: "info" | "warn" | "error" = "info",
  context: Context = {},
): void {
  logger[level](message, contextToMeta(context));

  if (WEBHOOK && level !== "info") {
    void ship({
      type: "message",
      service: SERVICE,
      environment: ENV,
      timestamp: new Date().toISOString(),
      level,
      message,
      ...contextToMeta(context),
    });
  }
}
