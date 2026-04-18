"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MarketingCtaBanner } from "../components/marketing/MarketingCtaBanner";
import { MarketingNav } from "../components/marketing/MarketingNav";
import { PricingPackageCard } from "../components/marketing/PricingPackageCard";
import { ProofStrip } from "../components/marketing/ProofStrip";
import { TryDemoButton } from "../components/marketing/TryDemoButton";
import {
  differentiators,
  marketingCtas,
  pricingPackages,
  proofPoints,
  teamOutcomes,
  workflowSteps,
} from "../lib/marketing";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen font-body" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <div className="fixed inset-x-0 top-0 z-50">
        <MarketingNav primaryCta={marketingCtas.primary} secondaryCta={marketingCtas.secondary} scrolled={scrolled} />
      </div>

      <main>
        <section className="relative overflow-hidden px-6 pb-20 pt-28 md:px-12 md:pt-32">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at top right, rgba(88,166,255,0.18), transparent 28%), radial-gradient(circle at left center, rgba(163,113,247,0.14), transparent 26%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />

          <div className="relative mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ background: "rgba(59,130,246,0.12)", color: "var(--accent-cyan)" }}>
                  AI-native technical interviews
                </div>
                <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold tracking-tight md:text-7xl">
                  Evaluate real AI-assisted engineering work, not whiteboard performance.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-7 md:text-lg" style={{ color: "var(--text-secondary)" }}>
                  Buildscore gives hiring teams a structured way to watch how candidates navigate real code, collaborate with AI, and justify engineering decisions under realistic interview pressure.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <TryDemoButton label="Try the interactive demo" variant="primary" />
                  <Link
                    href={marketingCtas.primary.href}
                    className="rounded-lg px-5 py-3 text-sm font-semibold transition-colors"
                    style={{ color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
                  >
                    {marketingCtas.primary.label}
                  </Link>
                  <Link
                    href={marketingCtas.secondary.href}
                    className="rounded-lg px-5 py-3 text-sm font-semibold transition-colors"
                    style={{ color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
                  >
                    {marketingCtas.secondary.label}
                  </Link>
                </div>
                <p className="mt-3 max-w-xl text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Provisions a fully populated recruiter workspace — 9 sample candidate sessions, AI grades, shareable reports — in about two seconds. No signup.
                </p>

                <div className="mt-8 max-w-2xl">
                  <ProofStrip items={proofPoints} />
                </div>
              </div>

              <SignalPanel />
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:px-12">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Why teams switch"
              title="The interview moves from interviewer memory to reviewable evidence."
              description="Replace one-off coding puzzles with structured interview signals that are easier to compare, share, and defend."
            />

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {teamOutcomes.map((outcome) => (
                <div
                  key={outcome.title}
                  className="rounded-[24px] p-6"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                >
                  <h3 className="font-display text-2xl font-semibold tracking-tight">{outcome.title}</h3>
                  <p className="mt-4 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                    {outcome.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:px-12" style={{ background: "linear-gradient(180deg, rgba(22,27,34,0), rgba(22,27,34,0.48))" }}>
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="How it works"
              title="A hiring workflow designed for realistic technical work."
              description="From session setup to final review, each step is meant to create higher-confidence decisions without adding coordinator overhead."
            />

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {workflowSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-[24px] p-6"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--accent-cyan)" }}>
                    0{index + 1}
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-4 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:px-12">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Differentiators"
              title="Built for structured hiring loops, not generic coding challenges."
              description="The product stays close to how modern engineering teams actually interview: real tasks, AI in the loop, reviewer context preserved."
            />

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {differentiators.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[24px] p-6"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
                >
                  <h3 className="font-display text-xl font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:px-12">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Packages"
              title="Pricing built to qualify the right rollout conversation."
              description="Start free to evaluate the flow, move into Pro when your hiring volume grows, and use Enterprise when onboarding, security, and rollout support matter."
            />

            <div className="mt-12 grid gap-5 xl:grid-cols-3">
              {pricingPackages.map((pkg) => (
                <PricingPackageCard key={pkg.name} {...pkg} />
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <Link
                href="/pricing"
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                style={{ color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
              >
                Explore full pricing
              </Link>
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 pt-10 md:px-12">
          <div className="mx-auto max-w-6xl">
            <MarketingCtaBanner
              eyebrow="See the workflow live"
              title="Book a demo if you want to pressure-test the interview loop with your team."
              description="We will walk through how Buildscore fits your hiring process, what reviewers actually see, and how to decide whether Free, Pro, or Enterprise matches your rollout."
              primaryCta={marketingCtas.primary}
              secondaryCta={marketingCtas.secondary}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--accent-cyan)" }}>
        {eyebrow}
      </div>
      <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">{title}</h2>
      <p className="mt-5 text-sm leading-7 md:text-base" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>
    </div>
  );
}

function SignalPanel() {
  return (
    <div
      className="relative overflow-hidden rounded-[28px] p-5 md:p-6"
      style={{
        background: "linear-gradient(180deg, rgba(22,27,34,0.96), rgba(14,17,23,0.98))",
        border: "1px solid rgba(42,49,66,0.8)",
        boxShadow: "0 28px 90px rgba(0,0,0,0.38)",
      }}
    >
      <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid rgba(42,49,66,0.75)" }}>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
            Review surface
          </div>
          <div className="mt-1 font-display text-2xl font-semibold tracking-tight">Candidate session evidence</div>
        </div>
        <span className="chip chip-blue">Live demo</span>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="rounded-[20px] p-4" style={{ background: "var(--bg-inset)", border: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Prompt timeline</div>
            <span className="chip chip-purple">AI usage</span>
          </div>
          <div className="mt-4 space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            <div className="flex items-start gap-3">
              <span className="font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                08:14
              </span>
              <p>Candidate asks for a refactor path, then verifies the proposed data flow before editing.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-mono text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                12:09
              </span>
              <p>Prompt shifts toward test strategy instead of direct code generation, which is preserved for reviewer context.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[20px] p-4" style={{ background: "var(--bg-inset)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Code diff</div>
              <span className="chip chip-green">5 files changed</span>
            </div>
            <div className="mt-4 font-mono text-[12px] leading-6" style={{ color: "var(--text-secondary)" }}>
              <div>
                <span style={{ color: "var(--accent-red)" }}>-</span> inline inventory check
              </div>
              <div>
                <span style={{ color: "var(--accent-green)" }}>+</span> extracted stock validator
              </div>
              <div>
                <span style={{ color: "var(--accent-green)" }}>+</span> added notifier adapter tests
              </div>
            </div>
          </div>

          <div className="rounded-[20px] p-4" style={{ background: "var(--bg-inset)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Reviewer summary</div>
              <span className="chip chip-orange">Structured rubric</span>
            </div>
            <div className="mt-4 space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              <div className="flex items-center justify-between">
                <span>Problem solving</span>
                <strong style={{ color: "var(--text-primary)" }}>4 / 5</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>AI collaboration</span>
                <strong style={{ color: "var(--text-primary)" }}>5 / 5</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Code quality</span>
                <strong style={{ color: "var(--text-primary)" }}>4 / 5</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
