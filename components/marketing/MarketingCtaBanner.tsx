import Link from "next/link";
import type { MarketingCta } from "../../lib/marketing";

interface MarketingCtaBannerProps {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: MarketingCta;
  secondaryCta?: MarketingCta;
}

export function MarketingCtaBanner({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
}: MarketingCtaBannerProps) {
  return (
    <section
      className="rounded-2xl px-8 py-12 md:px-12"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="max-w-3xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--accent-cyan)" }}>
          {eyebrow}
        </div>
        <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 md:text-base" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href={primaryCta.href}
            className="rounded-lg px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--accent-blue)" }}
          >
            {primaryCta.label}
          </Link>
          {secondaryCta && (
            <Link
              href={secondaryCta.href}
              className="rounded-lg px-5 py-3 text-sm font-semibold transition-colors"
              style={{ color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
            >
              {secondaryCta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
