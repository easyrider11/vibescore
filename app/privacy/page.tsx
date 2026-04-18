import Link from "next/link";
import type { Metadata } from "next";
import { MarketingNav } from "../../components/marketing/MarketingNav";
import { marketingCtas } from "../../lib/marketing";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Buildscore handles interview data, AI prompts, and candidate information.",
};

const LAST_UPDATED = "2026-04-18";
const CONTACT_EMAIL = "privacy@buildscore.dev";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen font-body" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <div className="fixed inset-x-0 top-0 z-50">
        <MarketingNav primaryCta={marketingCtas.primary} secondaryCta={marketingCtas.secondary} scrolled />
      </div>

      <main className="px-6 pt-28 pb-24 md:px-12 md:pt-32">
        <div className="mx-auto max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--accent-cyan)" }}>
            Privacy
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Privacy policy.
          </h1>
          <p className="mt-3 text-xs font-mono tabular" style={{ color: "var(--text-tertiary)" }}>
            Last updated: {LAST_UPDATED}
          </p>

          <div className="mt-10 space-y-8 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
            <section>
              <h2 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                What we collect
              </h2>
              <p>
                When a recruiter creates a session, we store the candidate&rsquo;s name, email, and the
                role they are interviewing for. During the interview we record every keystroke,
                file open, AI prompt and response, test run, and submission. This is the evidence
                the recruiter evaluates, and it is the reason the product exists.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                How we use it
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To render the session report the recruiter reviews.</li>
                <li>To generate an AI second-opinion grade (no training — prompts are sent to model providers and not retained for training; see sub-processors).</li>
                <li>To compute organization-level analytics visible only to that organization.</li>
                <li>To run the service (logs, error tracking, billing). We do not sell data to third parties.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Sub-processors
              </h2>
              <p>We rely on a small set of vendors to operate:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Supabase (Postgres hosting, EU or US region depending on your workspace)</li>
                <li>Vercel (application hosting)</li>
                <li>Anthropic and/or OpenAI (AI grading and copilot — prompts are sent to these providers)</li>
                <li>Resend (transactional email)</li>
                <li>Stripe (billing, for paid plans)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Candidate rights
              </h2>
              <p>
                If you were interviewed through Buildscore and want to see or delete your data,
                email us at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--accent-cyan)" }}>{CONTACT_EMAIL}</a>.
                We respond within 30 days. We will confirm the request with the organization that
                ran the interview before acting.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Retention
              </h2>
              <p>
                Session data lives in the organization&rsquo;s workspace indefinitely unless the
                organization deletes it. Demo accounts are wiped when you click &ldquo;Exit demo.&rdquo;
                Deleted accounts remove all candidate data within 30 days.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Cookies
              </h2>
              <p>
                We use one first-party session cookie (<code className="font-mono text-xs">vibe_session</code>) for
                authentication. No third-party analytics, no ad tracking, no fingerprinting.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Contact
              </h2>
              <p>
                Questions: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--accent-cyan)" }}>{CONTACT_EMAIL}</a>.
                For EU data-subject requests, the same address reaches us.
              </p>
            </section>
          </div>

          <div className="mt-16 pt-6" style={{ borderTop: "1px solid var(--border-default)" }}>
            <Link href="/" className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
