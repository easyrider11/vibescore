# Deploying Buildscore

This doc covers the two things you need to ship: the app (Vercel) and the
optional collab server (Hocuspocus).

## TL;DR

1. Create a Supabase project → copy both pooled + direct Postgres URLs.
2. Create a Vercel project, connect this GitHub repo.
3. Paste env vars from `.env.example` into Vercel → Settings → Environment
   Variables. Mark secrets `Encrypted`.
4. Run `npx prisma migrate deploy` once against `DIRECT_URL`, then seed:
   `npx prisma db seed`.
5. Ship. Every PR after this gets an automatic preview URL.

## 1. Supabase

- Create a project in the closest region to your users.
- **Database → Connect**: copy the "Transaction pooler" string (port 6543,
  ends with `?pgbouncer=true`) into `DATABASE_URL`. Copy the "Direct
  connection" (port 5432) into `DIRECT_URL`. Prisma migrations require
  the direct connection.

## 2. Vercel (app + preview deploys)

Vercel's GitHub integration handles preview deploys automatically. You do
not need a GitHub Actions workflow for deploy — CI in this repo gates
merges, and Vercel deploys on every push.

Setup:

1. Go to https://vercel.com/new → import this repo.
2. Framework preset: **Next.js** (auto-detected).
3. Build command: from `vercel.json` — `prisma generate && next build`.
4. Add environment variables. The minimal set is:

   | Variable | Required | Notes |
   |---|---|---|
   | `DATABASE_URL` | yes | Supabase pooled URL |
   | `DIRECT_URL` | yes | Supabase direct URL (migrations) |
   | `NEXT_PUBLIC_APP_URL` | yes | `https://yourdomain.com` — used in invite emails |
   | `ANTHROPIC_API_KEY` | for AI mode | leave blank + set `AI_MODE=mock` for demos |
   | `ANTHROPIC_MODEL` | optional | default `claude-sonnet-4-20250514` |
   | `AI_MODE` | yes | `mock` or `real` |
   | `RESEND_API_KEY` | yes | required for magic-link auth + invites |
   | `RESEND_FROM_EMAIL` | yes | must be a verified Resend domain |
   | `UPSTASH_REDIS_REST_URL` | optional | enables distributed rate limiting |
   | `UPSTASH_REDIS_REST_TOKEN` | optional | pairs with the URL above |
   | `OBSERVABILITY_WEBHOOK_URL` | optional | Sentry/Axiom/Slack etc. |
   | `STRIPE_*` | optional | leave blank to disable billing |

5. First deploy may fail until migrations run. SSH into any box with
   `DIRECT_URL` reachable and run:

   ```sh
   npx prisma migrate deploy
   npx prisma db seed
   ```

6. Preview deploys: every PR to `main` gets a unique URL
   (`https://<branch>-<project>.vercel.app`). The URL is posted as a
   GitHub check. Preview deploys share production env vars unless you
   mark a variable "Production-only" or add a separate "Preview" value.

## 3. Custom domain (optional)

- Vercel → Project → Settings → Domains → add `buildscore.dev`.
- Update `NEXT_PUBLIC_APP_URL` to the custom domain.
- Update `STRIPE_WEBHOOK_SECRET` if you re-create the webhook endpoint
  for the new domain.

## 4. Distributed rate limiting (Upstash)

By default the rate limiter uses per-instance in-memory counters. Fine
for a single-region pilot. For multi-region or higher-trust deployments:

1. Create a Redis database at https://console.upstash.com.
2. Copy **REST URL** + **REST Token** from the database page.
3. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel.

The code auto-detects both vars and switches to Redis-backed fixed-window
rate limiting. If Upstash hiccups, it falls back to in-memory for that
request so nothing blocks on a transient Redis failure.

## 5. Observability

Set `OBSERVABILITY_WEBHOOK_URL` to any endpoint that accepts POST+JSON:

- **Sentry**: use a Sentry envelope endpoint URL.
- **Axiom**: a dataset ingest URL with token query-string.
- **Logflare** / **BetterStack** / **Datadog**: any ingest that speaks JSON.
- **Slack / Discord**: works for low-volume error alerts.

All `captureException()` calls + error-level `captureMessage()` calls ship
to this endpoint. Client-side errors are forwarded via `/api/client-error`.

## 6. Collab server (optional)

`server/collaboration.ts` is a separate Node process (Hocuspocus) for
live pair programming. If the WebSocket is unreachable, candidate
sessions still work — Monaco just runs without real-time collaboration.

Options:

- **Railway**: point at the repo, start command `npx tsx server/collaboration.ts`.
- **Fly.io**: same pattern with a dockerfile.
- **Skip for pilot**: leave `NEXT_PUBLIC_WS_URL` pointing at localhost;
  live view in `/app/sessions/[id]/live` polls every 3s.

After deploy, update `NEXT_PUBLIC_WS_URL` to the WebSocket URL
(`wss://...`).

## 7. Stripe (when you turn on billing)

1. Create products + prices in Stripe dashboard.
2. Copy price IDs into `STRIPE_PRO_PRICE_ID` / `STRIPE_ENTERPRISE_PRICE_ID`.
3. Create a webhook endpoint pointing at `/api/webhooks/stripe`. Listen
   to `customer.subscription.{created,updated,deleted}`.
4. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## 8. Post-deploy smoke test

- Hit `/` — landing loads.
- Hit `/api/health` — returns 200.
- Click **Try the interactive demo** → lands in `/app` with 9 seeded
  sessions.
- Open any seeded session → **View Report** → **Share report** → **Copy
  link** → open the copied URL in a private window. It should render.
- Hit `/privacy` and `/terms` — both load as static pages.
- Hit `/changelog` — static page with four entries.
- Tail logs for any `captureException` firings.
