type Level = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "apiKey",
  "api_key",
  "authorization",
  "cookie",
  "stripeSecretKey",
  "sessionToken",
];

function redact(value: unknown, depth = 0): unknown {
  if (depth > 5 || value == null) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s.toLowerCase()))) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = redact(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

function emit(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...(meta ? { meta: redact(meta) as Record<string, unknown> } : {}),
  };
  const fn =
    level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(JSON.stringify(entry));
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "production") emit("debug", message, meta);
  },
  info: (message: string, meta?: Record<string, unknown>) => emit("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit("error", message, meta),
};
