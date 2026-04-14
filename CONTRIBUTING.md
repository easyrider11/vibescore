# Contributing

Thanks for working on Buildscore. This doc covers the dev loop, project conventions, and the PR workflow.

For product + architectural context, read [`design.md`](./design.md) first.

---

## 1. Local setup

```bash
# 1. Dependencies
npm install

# 2. Env — copy the example and fill in what you need
cp .env.example .env
# At minimum: DATABASE_URL (a local Postgres or SQLite works)
# Optional:   ANTHROPIC_API_KEY, RESEND_API_KEY, STRIPE_SECRET_KEY

# 3. Database
npx prisma db push           # apply schema
npx prisma db seed           # scenarios + demo data

# 4. Run
npm run dev                  # Next.js on :3000
npm run collab               # Hocuspocus collab server on :3002 (separate terminal)
```

Open http://localhost:3000.

### Env modes

| Var            | Values                 | Effect                                                        |
|----------------|------------------------|---------------------------------------------------------------|
| `AI_MODE`      | `mock` (default) \| `live` | `live` calls Anthropic; `mock` returns canned responses    |
| `NODE_ENV`     | `development` \| `production` | Env validation crashes in prod, warns in dev        |

---

## 2. Project conventions

### Structure
- **Server work** → `app/api/*` route handlers + `lib/*` helpers
- **Pages** → `app/*` (App Router). Pages under `app/app/*` require auth — middleware redirects to `/login`.
- **Client components** → `"use client"` at the top. Server components by default.
- **Shared UI** → `components/<area>/` (e.g. `components/marketing/`, `components/analytics/`)

### Styling
- Use **CSS variables from `app/globals.css`**, not Tailwind color classes. The dark theme is centralized — swapping themes = one `:root` override.
- Inline `style={{ background: "var(--bg-surface)", … }}` is the pattern across the codebase.
- Typography: `font-display` for headlines, `DM Sans` (body default) elsewhere.
- Radii: `rounded-[18px]` for app cards, `rounded-[22px]–[24px]` for marketing.

### API handler pattern

```ts
// app/api/<resource>/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { rateLimit, API_RATE_LIMIT, getClientId, rateLimitResponse } from "../../../lib/rate-limit";

const Schema = z.object({ /* … */ });

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`resource:${user.id}`, API_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl);

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  // … business logic …
  return NextResponse.json({ /* result */ });
}
```

### Logging
```ts
import { logger } from "../../../lib/logger";
logger.info("session.created", { sessionId, orgId, scenarioSlug });
```
`lib/logger.ts` redacts `password | token | secret | apiKey | authorization | cookie | sessionToken` recursively — so you can pass whole objects without worrying.

### Never do
- Don't `console.log` secrets or tokens.
- Don't put colors as literal hex in components (except inside Recharts props, where variables don't work).
- Don't create new env vars without updating `lib/env.ts` and `.env.example`.
- Don't skip the billing gate on session creation — use `canCreateSession(orgId)`.

---

## 3. Testing

```bash
npx vitest run              # one-shot
npx vitest                  # watch mode
npx vitest run tests/auth   # single file
```

### Adding a route test

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockGetCurrentUser = vi.fn();
vi.mock("../lib/auth", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));
vi.mock("../lib/prisma", () => ({ prisma: { /* stub what the route uses */ } }));

import { POST } from "../app/api/<resource>/route";

describe("POST /api/<resource>", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ id: "u1", email: "x@y.com" });
  });

  it("returns 401 unauthenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const res = await POST(new Request("http://x", { method: "POST", body: "{}" }) as any);
    expect(res.status).toBe(401);
  });
});
```

Mock every external dep at the top of the file with `vi.mock`. Don't rely on the real database in unit tests — CI is Postgres-less.

### What to cover
- New routes: happy path + 401 + 400 + any domain-specific errors (403 on role, 404 on missing).
- New billing-affected flows: limit-reached + within-limit + enterprise-unlimited.
- New UI data modules (like `lib/marketing.ts`): assert the shape so copy edits don't silently break pages.

---

## 4. Branching & PR workflow

### Branch names
- `feature/<short-kebab>` — new capability
- `fix/<short-kebab>` — bug or regression fix
- `docs/<short-kebab>` — docs only
- `chore/<short-kebab>` — deps, CI, tooling

### Commit messages
Conventional-ish — imperative mood, no period:
```
Add session limit enforcement to POST /api/sessions
Fix login page contrast and simplify layout
Upgrade analytics with Recharts and KPI trends
```
Longer commits get a body explaining the *why*. Include `Co-Authored-By:` if you pair-programmed (with an AI, another dev, whatever).

### PR checklist
Before opening:
- `npx vitest run` passes
- `npx next build` passes
- No `console.log` left behind
- New env vars added to `lib/env.ts` + `.env.example`
- UI changes visually verified on the Vercel preview

PR description template is auto-applied — fill in `## Summary` and `## Test plan`.

### Merge strategy
- **Squash merge.** Clean linear history on main.
- **Delete branch on merge.** Keeps the branch list pruned.
- **Draft → ready → merge** — open as draft while you iterate, mark ready when CI is green.

---

## 5. Common tasks

### Add a new scenario
1. Create `seeds/scenarios/<slug>/` with `notes.md`, `lib/`, `tests/`, `api/` as appropriate.
2. Add an entry to `prisma/scenarios.js`.
3. Run `npx prisma db seed` to insert it.
4. The `tests/scenario-seeds.test.ts` catalog check will cover the new entry automatically.

### Add a new page
1. Create `app/<route>/page.tsx`. Use server components unless you need client state.
2. For auth-gated pages, put under `app/app/*` — `middleware.ts` already enforces the redirect.
3. Use the design tokens from `app/globals.css`; reuse `components/DashboardSidebar`, `TopBar`, etc.

### Add a new API route
1. Create `app/api/<resource>/route.ts` following the handler pattern above.
2. Add a Vitest file under `tests/`.
3. If rate-limited: add a preset to `lib/rate-limit.ts`.
4. If it touches billing or plans: gate it through `lib/billing.ts`.

### Update pricing copy
Edit `lib/marketing.ts`. Both `/` and `/pricing` read from this module.

---

## 6. Release

There's no formal release cadence — main is always deployable. Every merged PR to main ships to Vercel production automatically. If you want a notable change surfaced, add an entry to [`CHANGELOG.md`](./CHANGELOG.md) in the same PR.
