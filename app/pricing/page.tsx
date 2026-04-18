import { MarketingCtaBanner } from "../../components/marketing/MarketingCtaBanner";
import { MarketingFAQ } from "../../components/marketing/MarketingFAQ";
import { MarketingNav } from "../../components/marketing/MarketingNav";
import { PricingPackageCard } from "../../components/marketing/PricingPackageCard";
import { TryDemoButton } from "../../components/marketing/TryDemoButton";
import {
  marketingCtas,
  pricingAudienceBands,
  pricingComparison,
  pricingFaqs,
  pricingPackages,
} from "../../lib/marketing";

export default function PricingPage() {
  return (
    <div className="min-h-screen font-body" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <MarketingNav primaryCta={marketingCtas.primary} secondaryCta={marketingCtas.secondary} scrolled />

      <main>
        <section className="relative overflow-hidden px-6 pb-16 pt-16 md:px-12 md:pb-20 md:pt-24">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at top left, rgba(88,166,255,0.12), transparent 25%), radial-gradient(circle at right center, rgba(163,113,247,0.12), transparent 24%)",
            }}
          />
          <div className="relative mx-auto max-w-5xl text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--accent-cyan)" }}>
              Pricing
            </div>
            <h1 className="mx-auto mt-4 max-w-4xl font-display text-5xl font-semibold tracking-tight md:text-6xl">
              Packages for every hiring motion, from early validation to enterprise rollout.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-7 md:text-lg" style={{ color: "var(--text-secondary)" }}>
              Buildscore is priced to support serious buying conversations. Start free if you want to validate the workflow, then move into Pro or Enterprise when hiring volume, security, and rollout complexity increase.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <TryDemoButton label="Try an interactive demo" variant="primary" />
              <a
                href={marketingCtas.primary.href}
                className="rounded-lg px-5 py-3 text-sm font-semibold transition-colors"
                style={{ color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
              >
                {marketingCtas.primary.label}
              </a>
              <a
                href={marketingCtas.secondary.href}
                className="rounded-lg px-5 py-3 text-sm font-semibold transition-colors"
                style={{ color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
              >
                {marketingCtas.secondary.label}
              </a>
            </div>
            <p className="mx-auto mt-3 max-w-2xl text-xs" style={{ color: "var(--text-tertiary)" }}>
              Spins up a populated workspace with 9 sample candidate sessions, AI-graded, in about two seconds. No signup.
            </p>
          </div>
        </section>

        <section className="px-6 pb-8 md:px-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Who each plan is for</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {pricingAudienceBands.map((band) => (
                <div
                  key={band.title}
                  className="rounded-[22px] p-5"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--accent-cyan)" }}>
                    {band.title}
                  </div>
                  <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                    {band.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:px-12">
          <div className="mx-auto grid max-w-6xl gap-5 xl:grid-cols-3">
            {pricingPackages.map((pkg) => (
              <PricingPackageCard key={pkg.name} {...pkg} />
            ))}
          </div>
        </section>

        <section className="px-6 py-16 md:px-12" style={{ background: "linear-gradient(180deg, rgba(22,27,34,0), rgba(22,27,34,0.48))" }}>
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--accent-cyan)" }}>
                Compare the rollout
              </div>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
                Decision-critical differences, without the feature-table fog.
              </h2>
            </div>

            <div
              className="mt-10 overflow-hidden rounded-[24px]"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
            >
              <div
                className="grid grid-cols-[1.5fr_repeat(3,1fr)] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.22em]"
                style={{ borderBottom: "1px solid rgba(42,49,66,0.65)", color: "var(--text-tertiary)" }}
              >
                <div>Category</div>
                <div className="text-center">Free</div>
                <div className="text-center" style={{ color: "var(--accent-cyan)" }}>
                  Pro
                </div>
                <div className="text-center">Enterprise</div>
              </div>

              {pricingComparison.map((row, index) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[1.5fr_repeat(3,1fr)] items-center gap-3 px-5 py-4 text-sm"
                  style={{
                    borderBottom:
                      index < pricingComparison.length - 1 ? "1px solid rgba(42,49,66,0.45)" : "none",
                  }}
                >
                  <div style={{ color: "var(--text-primary)" }}>{row.label}</div>
                  <ComparisonCell value={row.free} />
                  <ComparisonCell value={row.pro} />
                  <ComparisonCell value={row.enterprise} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:px-12">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--accent-cyan)" }}>
                FAQ
              </div>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
                Questions teams ask before rollout.
              </h2>
            </div>
            <div className="mt-10 space-y-4">
              {pricingFaqs.map((faq) => (
                <MarketingFAQ key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 pt-8 md:px-12">
          <div className="mx-auto max-w-6xl">
            <MarketingCtaBanner
              eyebrow="Need a rollout recommendation?"
              title="Book a demo and we will help map Buildscore to your hiring process."
              description="Use the demo if you want help deciding which package matches your hiring volume, evaluation rigor, reviewer setup, and security expectations."
              primaryCta={marketingCtas.primary}
              secondaryCta={marketingCtas.secondary}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function ComparisonCell({ value }: { value: string }) {
  return (
    <div className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
      {value}
    </div>
  );
}
