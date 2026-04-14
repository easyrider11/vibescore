# Buildscore — Design

> AI-native technical interview platform. Candidates work on real codebases with AI assistance; recruiters review structured evidence (prompt timeline, diffs, rubric) instead of whiteboard impressions.

---

## 1. Product shape

Three primary personas, three primary surfaces:

| Persona     | Surface                                | What they do                                                                 |
|-------------|----------------------------------------|------------------------------------------------------------------------------|
| Visitor     | `/` (landing), `/pricing`              | Learn the product, compare plans, book a demo                                |
| Recruiter   | `/app/*`                               | Create sessions, invite candidates, review evidence, score rubrics, analytics |
| Candidate   | `/s/[publicToken]`                     | Work in a web IDE, use AI, submit a snapshot                                  |

The core loop: **recruiter picks a scenario → invites candidate via email → candidate works in the IDE (with AI) for N minutes → submission captured (files, diff, prompt timeline, events) → recruiter (or AI auto-grader) scores the rubric → session appears in analytics**.

---

## 2. Architecture

### 2.1 Tech stack

- **Runtime:** Next.js 16 (App Router) + React 18 + TypeScript, deployed on Vercel
- **Database:** PostgreSQL via Supabase (pooler for runtime, direct for migrations). SQLite supported for local dev.
- **ORM:** Prisma 5
- **Editor:** Monaco + CodeMirror (dual — Monaco for live sessions, CodeMirror for diff/preview)
- **Realtime collab:** Yjs + Hocuspocus (separate `server/collaboration.ts` process)
- **AI:** Anthropic Claude (primary) and OpenAI (fallback). `AI_MODE=mock` for local dev.
- **Payments:** Stripe (subscriptions + webhook)
- **Email:** Resend (magic links, candidate invites, team invites)
- **Charts:** Recharts
- **Testing:** Vitest (unit + route handlers)
- **CI:** GitHub Actions — test + build on every PR

### 2.2 Process topology

```
┌────────────────────┐   HTTPS   ┌──────────────────────┐
│  Next.js (Vercel)  │──────────▶│  Postgres (Supabase) │
│  app/ + app/api/*  │           └──────────────────────┘
│  middleware.ts     │
│  (auth gate,       │           ┌──────────────────────┐
│   security hdrs)   │──────────▶│  Anthropic / OpenAI  │
└────────────────────┘           └──────────────────────┘
        ▲                        ┌──────────────────────┐
        │ webhooks               │  Stripe              │
        └────────────────────────└──────────────────────┘

┌────────────────────┐  WebSocket ┌──────────────────────┐
│  Hocuspocus        │◀──────────▶│  Candidate browsers  │
│  server/collab.ts  │            │  (Yjs doc, Monaco)   │
└────────────────────┘            └──────────────────────┘
```

Two deployment units: the Next.js app (stateless, horizontal) and the Hocuspocus collab server (single-instance, stateful — held in-memory Yjs docs per session).

### 2.3 Directory layout

```
app/
  page.tsx                    Landing page (marketing)
  pricing/page.tsx            Pricing page
  login/page.tsx              Magic-link + quick sign-in
  invite/[token]/page.tsx     Team invite acceptance
  s/[publicToken]/page.tsx    Candidate workspace (IDE)
  app/                        Recruiter app (requires auth — enforced by middleware.ts)
    page.tsx                    Dashboard
    new-session/page.tsx        Session creation wizard
    sessions/[id]/*             Session detail + live view
    analytics/page.tsx          Recharts-powered analytics
    team/page.tsx               Members + invites
    billing/page.tsx            Stripe plan / usage
    settings/page.tsx           Org defaults (AI mode, rubric)
    templates/page.tsx          Scenario templates
  api/                        Route handlers
    auth/magic-link/           Email a sign-in link
    login/                     Quick sign-in (dev-friendly)
    logout/
    sessions/                  CRUD + live tick + lookup
    ai/                        AI assistant (summary/explain/tests/review)
    submit/                    Candidate submits snapshot
    run-tests/                 Run scenario tests against workspace
    workspace/                 File read/write, search
    rubric/                    Recruiter scoring
    auto-grade/                AI auto-grader
    events/                    Timeline event recording
    analytics/                 Aggregate stats for /app/analytics
    export/                    Session export
    scenarios/                 Scenario catalog
    team/                      Members + invites + accept
    settings/                  Org settings
    billing/                   Stripe checkout + portal
    webhooks/stripe/           Stripe subscription webhook
    health/                    Liveness + DB readiness

components/
  marketing/                  Landing + pricing UI (shared catalog in lib/marketing.ts)
  analytics/                  KpiCard, ChartCard, 3 Recharts visuals
  DashboardSidebar, TopBar, ScenarioGrid, SessionsTable, DiffViewer,
  RubricForm, AIGradePanel

lib/
  auth.ts          Session tokens, magic-link flow, getCurrentUser
  prisma.ts        Prisma client singleton
  org.ts           ensureOrg, getOrgMembers (multi-tenancy helper)
  billing.ts       canCreateSession (plan-based gating)
  stripe.ts        PLANS, price IDs, webhook constructEvent wrapper
  ai.ts            Provider router (mock | anthropic | openai)
  auto-grade.ts    AI rubric scoring
  email.ts         Resend wrappers (magic, candidate invite, team invite)
  workspace.ts     Per-session workspace on disk (seeds/scenarios/<slug>)
  diff.ts          File snapshot diff
  rate-limit.ts    Sliding-window limiter + presets
  env.ts           Zod-validated env (crashes prod, warns dev)
  logger.ts        Structured JSON logger with key redaction
  marketing.ts     Shared catalog for landing + pricing content

prisma/
  schema.prisma
  scenarios.js     Shared scenario seed catalog
  seed.js

seeds/scenarios/
  bugfix/                     Scenario fixtures — each with mock data,
  feature-add/                lib/, api/, tests/ that start failing for the
  needs-review-status/        candidate to fix. Vitest config excludes these
  refactor/                   so they don't break app CI.
  review-summary-bug/

server/
  collaboration.ts            Hocuspocus + Yjs server

tests/                        21 Vitest files — auth, billing, API routes,
                              rate-limit, rubric, auto-grade, scenarios, UI.
```

---

## 3. Data model

### 3.1 Core entities

```
User ──(orgId)──▶ Organization ──▶ TeamInvite
  │                    │
  │                    └──▶ plan, stripeCustomerId, stripeSubscriptionId
  │
  ├──▶ SessionToken (30-day auth cookies)
  └──▶ InterviewSession (as createdBy)

Scenario ──▶ InterviewSession ──┬──▶ Event (timeline: ai_query, file_edit, test_run, submit, …)
                                ├──▶ Submission (snapshot + diff + notes)
                                ├──▶ RubricScore (human review)
                                └──▶ AIGrade (1:1 auto-grader output)

MagicLinkToken (15-min ephemeral, separate from SessionToken)
```

### 3.2 Key design choices

- **JSON blobs for flexibility, indexes for access paths.** `Scenario.tasks/hints/evaluationPoints/rubric/aiPolicy` and `Submission.snapshot` are `Json` columns. Rubric dimensions are semi-structured and evolve — a relational table would churn with every product change.
- **`publicToken` for candidate access, no auth required.** A candidate link is the capability. Tokens are `crypto.randomBytes(12).toString("hex")` (96 bits).
- **Org is optional at the user level.** A user signs up without an org, `ensureOrg(userId)` creates one lazily on first recruiter action. This keeps onboarding one-click.
- **`SessionStatus` enum** keeps status transitions auditable — `pending → active → completed | cancelled`.
- **`AIGrade` is 1:1 with session**; `RubricScore` is 1:many (multiple reviewers).

---

## 4. Auth & multi-tenancy

### 4.1 Authentication

Two flows, both email-only:

1. **Magic link** (`/api/auth/magic-link` → email → `/api/auth/verify?token=…`)
   - `MagicLinkToken` row with 15-min expiry, one-time use (`usedAt`)
   - On verify: issue a `SessionToken` (30 days), set `vibe_session` httpOnly/SameSite=Lax cookie
2. **Quick sign-in** (`/api/login`) — rate-limited (10/15min per IP), creates-or-finds user by email. Dev-friendly; production deployments can disable.

`getCurrentUser()` reads the cookie, loads the `SessionToken`, checks expiry, returns the `User`.

### 4.2 Authorization

- `middleware.ts` redirects unauthed requests to `/app/*` to `/login`.
- API routes re-check `getCurrentUser()` server-side — middleware only gates the shell.
- **Roles:** `owner`, `admin`, `member`. Enforced at the route level:
  - `owner`: full — can change roles, remove members, cancel subscription
  - `admin`: can invite, remove members (not owner), configure org
  - `member`: can create/review their own sessions
- Data scoped by `orgId`. `canCreateSession(orgId)` in `lib/billing.ts` gates session creation on plan limits.

---

## 5. Domain flows

### 5.1 Scenario → Session → Submission

```
Recruiter                         Candidate                      System
────────────────────────────────────────────────────────────────────────
Select scenario                                                  Scenario row
Enter candidate name/email
POST /api/sessions        ─────▶                                 canCreateSession? (billing)
                                                                 InterviewSession.create
                                                                 ensureWorkspace (copies
                                                                   seeds/scenarios/<slug>
                                                                   to /tmp/work/<sessionId>)
                                                                 sendCandidateInviteEmail
                          ◀───── GET /s/[publicToken]
                                  (start button)
                                 POST sessions/[token]/start ──▶ status: active, startedAt
                                 Edit files, ask AI, run tests   Event rows (ai_query, edit, …)
                                 POST /api/submit           ──▶ Submission.create (snapshot + diff)
                                                                 Event.create (SUBMIT)
                                                                 status: completed, endedAt
Review timeline + diff    ◀───── (session detail page)
POST /api/rubric                                                 RubricScore.create
(optional) POST /api/auto-grade                                  AIGrade.upsert (Claude scores)
```

### 5.2 Scenario fixtures

Each scenario under `seeds/scenarios/<slug>/`:
```
bugfix/
  lib/           Source files the candidate edits
  tests/         Failing tests (pass when the bug is fixed)
  api/           Supporting handlers
  notes.md       Background for the candidate
```
The scenario catalog (`prisma/scenarios.js`) is the single source of truth — the seed script and `tests/scenario-seeds.test.ts` both read from it. `vitest.config.ts` excludes `seeds/scenarios/**` so candidate-facing failing tests don't break app CI.

### 5.3 AI assistant

`/api/ai/route.ts` dispatches by `mode`:
- `summary` — summarize a file or diff
- `explain` — explain a code region
- `tests` — generate/extend tests
- `review` — code-review style feedback

`lib/ai.ts` routes to provider (mock / Anthropic / OpenAI) based on `AI_MODE` + available keys. Every call writes an `Event{type:"ai_query", payload:{mode, prompt, response}}` so the recruiter sees the prompt timeline.

Rate-limited: `AI_RATE_LIMIT = 20/min per user`.

### 5.4 Auto-grading

`/api/auto-grade` feeds the scenario rubric + submission diff + prompt timeline to Claude with a structured prompt. Returns a 0–5 score per rubric dimension, a hire/no-hire decision, a summary, strengths, and improvements. Stored as `AIGrade` (1:1 with session). Recruiter can override with a manual `RubricScore`.

---

## 6. Billing (Stripe)

Plans defined in `lib/stripe.ts`:

| Plan       | Price       | Sessions/month  | Features                                          |
|-----------|-------------|------------------|---------------------------------------------------|
| Free      | $0          | 5                | Core workflow, 1 reviewer                         |
| Pro       | $49/mo      | 50               | Unlimited reviewers, auto-grade, email invites    |
| Enterprise| $199/mo     | Unlimited (-1)   | SSO, SLA, onboarding, custom rollout              |

Flow: `POST /api/billing/checkout` → Stripe Checkout → webhook `/api/webhooks/stripe` (signature verified) → update `Organization.plan, stripeSubscriptionId, subscriptionStatus, currentPeriodEnd`. `POST /api/billing/portal` for plan changes.

`canCreateSession(orgId)` counts sessions in the current billing period and compares to `PLANS[plan].sessionsPerMonth`. Returns 403 with `code: "SESSION_LIMIT_REACHED"` when hit — the `/new-session` page renders an upgrade banner.

---

## 7. Design system

### 7.1 Tokens (`app/globals.css`)

Dark theme is the default (`:root`). A light-theme variant is declared but not yet surfaced as a user preference.

```
--bg-primary     #0e1117    canvas
--bg-surface     #161b22    cards
--bg-inset       #0a0d12    nested panels / inputs
--border-default #2a3142
--border-focus   #3b82f6
--text-primary   #e6edf3
--text-secondary #8b949e
--text-tertiary  #484f58
--accent-blue    #3b82f6    primary actions, info
--accent-cyan    #58a6ff    eyebrow labels
--accent-green   #3fb950    success, completed
--accent-orange  #d29922    warnings, pending
--accent-red     #f85149    destructive, errors
--accent-purple  #a371f7    AI-related accents
```

### 7.2 Conventions

- **Inline style attributes referencing CSS variables**, not Tailwind color classes. Keeps the theme centralized — dark/light switching is a single `:root` override.
- **Eyebrow labels**: `text-[11px] font-semibold uppercase tracking-[0.24em]` + `--accent-cyan`. Used to introduce every section and KPI.
- **Cards**: `rounded-[18px]–[24px]` + `background: var(--bg-surface)` + `border: 1px solid var(--border-default)`. Larger radii on marketing, smaller on app.
- **Fonts**: `DM Sans` body, `font-display` (via Tailwind) for headlines.
- **CTAs**: primary = `--accent-blue` filled; secondary = outlined with `--border-default`.
- **Charts** (Recharts): axis/grid `#1e2535`, tick labels `#8b949e`, tooltip bg `#161b22`/border `#2a3142`. Series colors from the accent palette.

### 7.3 Marketing content

`lib/marketing.ts` is a shared catalog consumed by `/` and `/pricing`:
- `marketingCtas` — `primary` ("Book a demo") and `secondary` ("Start free")
- `pricingPackages` — props for `PricingPackageCard`
- `pricingComparison` — rows for the comparison table
- `pricingAudienceBands`, `pricingFaqs`, `teamOutcomes`, `workflowSteps`, `differentiators`, `proofPoints`

Keeping this centralized means copy edits don't ripple across both pages.

---

## 8. Production hardening

Implemented in PR #14:

- **Security headers** (`next.config.mjs`): HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy: camera=()/microphone=()/geolocation=()/interest-cohort=(). `poweredByHeader: false`.
- **Env validation** (`lib/env.ts`): zod schema parsed on boot — crashes in production, warns in dev.
- **Structured logging** (`lib/logger.ts`): JSON entries with timestamp + level; redacts keys matching `password|token|secret|apiKey|authorization|cookie|sessionToken` (recursive, depth-capped).
- **Input validation**: zod schemas on candidate-facing routes (`/api/submit` schema-validates token + clarificationNotes).
- **Rate limiting** (`lib/rate-limit.ts`): sliding-window, in-memory (swap for Redis at multi-instance scale). Presets applied:
  - Login: 10 per 15 min per IP
  - AI: 20/min per user
  - Team invite: 20/hour per user
  - Submit: 30/hour per IP
- **Health check** (`/api/health`): liveness + `SELECT 1` database readiness. Returns 503 on db failure.
- **404 page** (`app/not-found.tsx`): branded, matches the dark theme.
- **Auth hardening**: httpOnly cookies, SameSite=Lax, Secure flag in production, magic-link one-time use.
- **Stripe webhook**: signature verification via `stripe.webhooks.constructEvent`.

Not yet implemented (deliberately deferred): Sentry integration, CSRF tokens (SameSite=Lax covers the realistic surface), session rotation.

---

## 9. Testing

21 Vitest files in `tests/`, 82 tests passing on main. Coverage by area:

| Area              | File                              |
|-------------------|-----------------------------------|
| Auth              | `auth.test.ts`                    |
| Billing + plans   | `billing.test.ts`, `session-limits.test.ts` |
| API routes        | `api-sessions.test.ts`, `api-ai.test.ts`, `api-submit.test.ts`, `api-rubric.test.ts`, `api-run-tests.test.ts` |
| Team              | `team.test.ts`                    |
| Org settings      | `settings.test.ts`                |
| Auto-grade        | `auto-grade.test.ts`              |
| Email             | `email.test.ts`                   |
| Rate limit        | `rate-limit.test.ts`              |
| Scenario seeds    | `scenario-seeds.test.ts`          |
| Logger            | `logger.test.ts`                  |
| Health            | `health.test.ts`                  |
| UI                | `marketing-pages.test.tsx`, `marketing-components.test.tsx`, `marketing-data.test.ts`, `ui-components.test.tsx`, `ui-formatters.test.ts` |

Pattern: mock `lib/prisma`, `lib/auth`, `lib/stripe`, `lib/email` at the top of each route test; use `vi.mock` with factory functions; import the route handler and call it with a synthetic `Request`.

---

## 10. Deployment

- **Vercel** hosts the Next.js app. Preview deployments on every PR (checked into PR status).
- **Supabase** hosts Postgres; both pooler and direct URLs live in env.
- **Hocuspocus** collab server: run as a persistent service (Fly, Render, or self-hosted). Not on Vercel (stateful).
- **CI** (GitHub Actions): `Test & Build` workflow runs `npx vitest run` + `npx next build` on every push + PR.
- **Migrations:** `prisma db push` for dev, `prisma migrate deploy` for prod.

---

## 11. Roadmap

### Done (Phase 1–3)
- Core IDE loop, mock + real AI, scenario fixtures
- Auth (magic link + quick sign-in), org model, team invites, role-based access
- Stripe billing with plan-gated session creation
- Analytics (Recharts visuals, week-over-week KPI trends)
- Marketing site (landing + pricing) with shared content catalog
- Production hardening (headers, env, logger, rate limits, health, 404)

### Candidates for Phase 4
- **Sentry / error tracking** — route + unhandled
- **Analytics filters** — date range + scenario; requires `/api/analytics` query param support
- **Real-time collab polish** — reviewer-side live view, presence indicators
- **More scenarios** — extend the catalog; the pattern is established
- **SSO** for Enterprise (SAML / OIDC)
- **Scheduled reports** — weekly digest email to recruiters
- **Webhook export** — push completed sessions into an external ATS

---

## 12. Glossary

- **Scenario** — a pre-built repo + rubric + task description (e.g. `bugfix`, `feature-add`).
- **Session** — one candidate's attempt at one scenario.
- **Submission** — snapshot of the candidate's workspace at the moment they hit Submit. Includes full file contents, a text diff vs the base, and any clarification notes.
- **Event** — an entry on the session timeline (AI query, file edit, test run, submit). The recruiter's primary review surface.
- **Rubric** — the scoring schema. Default dimensions: Repo Understanding, Requirement Clarity, Delivery Quality, Architecture Tradeoffs, AI Usage Quality.
- **RubricScore** — a human reviewer's scores + decision.
- **AIGrade** — auto-grader output, stored 1:1 with a session.
- **Public token** — the opaque handle used in `/s/[publicToken]` to let a candidate into their session without authenticating.
