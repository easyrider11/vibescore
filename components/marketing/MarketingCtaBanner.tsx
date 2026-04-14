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
      className="relative overflow-hidden rounded-[28px] px-8 py-12 md:px-12"
      style={{
        background: "linear-gradient(135deg, rgba(17,24,39,1), rgba(20,29,43,1) 54%, rgba(34,42,56,1))",
        border: "1px solid rgba(59,130,246,0.3)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: "radial-gradient(circle at top right, rgba(88,166,255,0.8), transparent 28%), radial-gradient(circle at bottom left, rgba(163,113,247,0.55), transparent 24%)",
        }}
      />
      <div className="relative max-w-3xl">
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
