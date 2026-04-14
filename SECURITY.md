# Security policy

## Reporting a vulnerability

**Please do not open a public GitHub issue for security problems.**

Email **security@buildscore.dev** with:
- A description of the issue and its impact
- Steps to reproduce (or a proof-of-concept)
- Affected versions / deployment (production, self-hosted, specific commit)
- Your contact info for follow-up

We aim to respond within **2 business days** and to ship a fix or mitigation within **30 days** for confirmed high-severity issues.

## Scope

In scope:
- The hosted production app at https://buildscore.dev and its preview deployments
- The Next.js codebase in this repository (API routes, middleware, auth, billing)
- The Hocuspocus collab server (`server/collaboration.ts`)
- Database access patterns (SQL injection, authorization bypass)
- Stripe webhook handling
- Candidate session public-token handling

Out of scope:
- Denial-of-service via unbounded legitimate traffic
- Social engineering of Buildscore staff
- Issues in third-party dependencies that have been disclosed to their maintainers (please report there first)
- Self-XSS requiring a victim to paste content into their own console
- Missing security headers that don't lead to a concrete exploit (our baseline is enforced in `next.config.mjs`)

## Safe harbor

We won't pursue legal action against researchers who:
- Follow this policy in good faith
- Don't exfiltrate more data than needed to demonstrate the issue
- Don't disrupt production for other users
- Give us a reasonable window to fix before public disclosure (typically 90 days)

## Current security posture

For reference, see `design.md` §8 "Production hardening". In brief:
- httpOnly, SameSite=Lax session cookies; Secure in production
- Magic-link tokens are one-time use with a 15-minute expiry
- All state-changing API routes re-check `getCurrentUser()` server-side (middleware is not the authorization boundary)
- Rate limits on login, AI, team invites, and candidate submissions
- Stripe webhook signature verification via `stripe.webhooks.constructEvent`
- Security headers: HSTS (with preload), X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy restricting camera/mic/geolocation
- Structured logs redact `password | token | secret | apiKey | authorization | cookie | sessionToken`
- Env validated at boot against a zod schema (crashes in production on misconfiguration)

## Dependency updates

We monitor CVEs via GitHub's Dependabot alerts. Critical-severity advisories are patched within 7 days; high within 30 days.
