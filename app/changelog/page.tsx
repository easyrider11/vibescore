import Link from "next/link";
import { MarketingNav } from "../../components/marketing/MarketingNav";
import { marketingCtas } from "../../lib/marketing";

interface Entry {
  date: string;
  title: string;
  body: string[];
}

const entries: Entry[] = [
  {
    date: "2026-04-17",
    title: "Interactive demo, shareable reports, AI-native scenario",
    body: [
      "One-click demo workspace on the landing page. Spins up nine seeded candidates with AI grades, rubric scores, and shareable report links.",
      "New scenario: debug a broken LLM agent tool-calling loop. Two real bugs, failing tests, fix in under an hour.",
      "Session reports now render the hire decision first. Public report permalinks at /r/[token] with OG metadata for sharing.",
      "Removed a lot of AI-smell from the marketing pages: tighter copy, fewer gradients, one border-radius system.",
    ],
  },
  {
    date: "2026-04-13",
    title: "Analytics upgrade + production hardening",
    body: [
      "Analytics page rewritten with Recharts. Weekly trend, decision breakdown, per-scenario bar chart, rubric averages.",
      "Security headers, env validation, structured logger, rate limiting, magic-link auth.",
      "Landing + pricing pages ship.",
    ],
  },
  {
    date: "2026-04-08",
    title: "Multi-tenancy, billing, team invites",
    body: [
      "Organizations with roles (owner/admin/member). Invite flow with email links.",
      "Stripe integration with per-org subscription status and session limits.",
      "AI auto-grading runs after submissions land.",
    ],
  },
  {
    date: "2026-03-28",
    title: "First live interviews",
    body: ["Ran the first real interviews with internal candidates. Everything broke and then we fixed it."],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen font-body" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <div className="fixed inset-x-0 top-0 z-50">
        <MarketingNav primaryCta={marketingCtas.primary} secondaryCta={marketingCtas.secondary} scrolled />
      </div>

      <main className="px-6 pt-28 pb-24 md:px-12 md:pt-32">
        <div className="mx-auto max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--accent-cyan)" }}>
            Changelog
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            What we shipped.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
            Honest log. Updated when things land, not when a marketing cadence says so.
          </p>

          <ol className="mt-12 space-y-10">
            {entries.map((entry) => (
              <li key={entry.date} className="relative pl-6">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-2 block h-2 w-2 rounded-full"
                  style={{ background: "var(--accent-cyan)" }}
                />
                <div className="text-xs font-mono tabular" style={{ color: "var(--text-tertiary)" }}>
                  {entry.date}
                </div>
                <h2 className="mt-1 font-display text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {entry.title}
                </h2>
                <ul className="mt-3 space-y-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                  {entry.body.map((line, i) => (
                    <li key={i}>· {line}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <div className="mt-16 pt-6" style={{ borderTop: "1px solid var(--border-default)" }}>
            <Link
              href="/"
              className="text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
