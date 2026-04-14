# Changelog

All notable changes to Buildscore. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project does not yet follow strict semver — main ships continuously to production.

## [Unreleased]

### Added
- `design.md` — architecture and design reference
- `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, GitHub issue + PR templates

## 2026-04-14 — Analytics upgrade (#17)
### Changed
- `/app/analytics` rewritten with Recharts-powered visuals (area, donut, bar) against the existing `/api/analytics` data source.
- New `components/analytics/` module: `KpiCard` (with ↑/↓ week-over-week trend), `ChartCard`, `WeeklyTrendChart`, `DecisionsDonut`, `ScenarioBarChart`.

### Added
- `recharts@^3.8.1` dependency.

## 2026-04-14 — Login polish (#16)
### Fixed
- Login page had a light-theme gradient with low-contrast captions on the dark `.card` surface. Rewritten to use dark design tokens.

### Changed
- Collapsed the quick/magic-link tab switcher into a linear primary + secondary button layout.

## 2026-04-14 — Advanced interview scenarios (#15)
### Added
- Two new scenario fixtures: `review-summary-bug` (backend bug-hunt) and `needs-review-status` (fullstack derived-status task).
- `prisma/scenarios.js` — shared scenario seed catalog consumed by the seed script and `tests/scenario-seeds.test.ts`.

### Changed
- `vitest.config.ts` excludes `seeds/scenarios/**` so candidate-facing failing tests don't break app CI.

## 2026-04-14 — Production hardening (#14)
### Added
- Security headers in `next.config.mjs`: HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy.
- `lib/env.ts` — zod-validated environment variables (crashes in production, warns in dev).
- `lib/logger.ts` — structured JSON logger with recursive redaction of sensitive keys.
- Zod input schema on `/api/submit` with per-IP rate limit.
- Per-user invite rate limit on `POST /api/team`.
- `/api/health` endpoint with database readiness check.
- Branded `app/not-found.tsx` 404 page.

## 2026-04-14 — Landing + pricing (#13)
### Added
- Marketing landing page (`/`) with hero, outcomes, workflow, differentiators, pricing teaser.
- `/pricing` page with audience bands, plan cards, comparison table, FAQs.
- Shared content catalog `lib/marketing.ts` consumed by both pages.
- Marketing components under `components/marketing/`.

## 2026-04-14 — Session limits + candidate results (#12)
### Added
- `canCreateSession(orgId)` billing gate on `POST /api/sessions`; returns 403 with `code: "SESSION_LIMIT_REACHED"` when plan limit reached.
- Candidate submission confirmation overlay on `/s/[publicToken]`.

## 2026-04-14 — Team management (#11)
### Added
- `TeamInvite` model with one-time token, 7-day expiry.
- `/api/team` CRUD — list members + invites, invite, change role, remove.
- `/api/team/accept` transactional invite acceptance.
- `/app/team` page with invite form, member list, role management.
- `/invite/[token]` auto-acceptance page.
- Role-based access control: owner / admin / member.

## 2026-04-14 — Stripe billing (#10)
### Added
- `lib/stripe.ts` with Free / Pro ($49) / Enterprise ($199) plans.
- `/api/billing/checkout` and `/api/billing/portal`.
- `/api/webhooks/stripe` with signature verification.
- Organization-level subscription fields (`plan`, `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus`, `currentPeriodEnd`, `cancelAtPeriodEnd`).
- `/app/billing` UI.

## 2026-04-14 — Multi-tenancy (#9)
### Added
- `Organization` model with default AI mode, duration, rubric config.
- `ensureOrg(userId)` lazy-creates an org on first recruiter action.
- `/app/settings` page for org defaults.

## 2026-04-14 — AI auto-grading (#8)
### Added
- `/api/auto-grade` feeds rubric + submission diff + prompt timeline to Claude, returns structured scores, decision, summary, strengths, improvements.
- `AIGrade` model (1:1 with session).
- `AIGradePanel` component surfacing AI verdicts alongside the manual rubric.

## 2026-04-14 — Phase 1 hardening (#7)
### Added
- In-memory sliding-window rate limiter (`lib/rate-limit.ts`).
- `/app/analytics` dashboard (pre-Recharts).
- GitHub Actions CI: test + build on every push.

## 2026-04-14 — Dark theme refresh (#6)
### Changed
- Switched the entire app to the operator-grade dark theme with CSS custom properties in `app/globals.css`.

## 2026-04-14 — Production readiness (#5)
### Added
- SDK, magic-link auth, error handling, baseline test suite.

## Earlier
- PostgreSQL migration (#3), JsonValue serialization fix (#4), SSR + collab fixes, initial landing page, BUILDSCORE_NEXT_STEPS feature set, MVP scaffolding.
