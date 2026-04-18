import Link from "next/link";
import type { Metadata } from "next";
import { MarketingNav } from "../../components/marketing/MarketingNav";
import { marketingCtas } from "../../lib/marketing";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of service for Buildscore.",
};

const LAST_UPDATED = "2026-04-18";
const CONTACT_EMAIL = "support@buildscore.dev";

export default function TermsPage() {
  return (
    <div className="min-h-screen font-body" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <div className="fixed inset-x-0 top-0 z-50">
        <MarketingNav primaryCta={marketingCtas.primary} secondaryCta={marketingCtas.secondary} scrolled />
      </div>

      <main className="px-6 pt-28 pb-24 md:px-12 md:pt-32">
        <div className="mx-auto max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--accent-cyan)" }}>
            Terms
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Terms of service.
          </h1>
          <p className="mt-3 text-xs font-mono tabular" style={{ color: "var(--text-tertiary)" }}>
            Last updated: {LAST_UPDATED}
          </p>

          <div className="mt-10 space-y-8 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
            <section>
              <h2 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Who this applies to
              </h2>
              <p>
                These terms apply to anyone using Buildscore — recruiters and hiring managers
                who create sessions, and candidates who take them.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                What we promise
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Reasonable-effort availability. We will tell you about scheduled downtime.</li>
                <li>Your data is yours. You can export it at any time (JSON export is built in).</li>
                <li>We will not use your candidate data to train AI models.</li>
                <li>We will handle security incidents in good faith and tell you within 72 hours if your data was affected.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                What we need from you
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>You will not use Buildscore to do anything illegal, or to interview candidates without their knowledge.</li>
                <li>You own the content you put in (source code, rubrics, notes). You grant us the right to process it to deliver the service.</li>
                <li>If you are a recruiter, you are responsible for your candidates&rsquo; consent to being recorded during interviews.</li>
                <li>You will not try to reverse-engineer the product, scrape it, or use it for competitive analysis without asking first.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Billing
              </h2>
              <p>
                Paid plans auto-renew monthly. You can cancel at any time from
                <code className="font-mono text-xs">/app/billing</code>. No refunds for partial
                months, but you keep access until the period ends.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Termination
              </h2>
              <p>
                You can close your account any time. We can terminate accounts for misuse or
                non-payment, with 7 days&rsquo; notice where reasonable. We will export your data
                on request after termination.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Liability
              </h2>
              <p>
                The service is provided as-is. We cap our liability at the fees you paid us in
                the 12 months before the claim. This is standard and non-negotiable for
                self-serve plans. Enterprise contracts can negotiate separately.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Changes
              </h2>
              <p>
                We will tell you by email before material changes take effect. Keep using the
                service after a change and you accept the new terms.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Contact
              </h2>
              <p>
                <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--accent-cyan)" }}>{CONTACT_EMAIL}</a>.
                Real person replies.
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
