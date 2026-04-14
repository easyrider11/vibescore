import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // AI
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().optional(),
  AI_MODE: z.enum(["mock", "live"]).default("mock"),

  // Email
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),

  // Stripe (all optional — billing disabled when absent)
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),
  STRIPE_ENTERPRISE_PRICE_ID: z.string().optional(),

  // Collab
  NEXT_PUBLIC_WS_URL: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    // Log but don't crash in dev — crash in production
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Invalid environment variables:\n${issues}`);
    }
    console.warn(`[env] Invalid environment variables (continuing in dev):\n${issues}`);
    return envSchema.parse({ ...process.env, DATABASE_URL: process.env.DATABASE_URL ?? "postgres://localhost/dev" });
  }
  return parsed.data;
}

export const env = loadEnv();
