import Link from "next/link";
import type { MarketingCta } from "../../lib/marketing";

interface PricingPackageCardProps {
  name: string;
  priceLabel: string;
  cadenceLabel: string;
  audience: string;
  description: string;
  features: readonly string[];
  cta: MarketingCta;
  highlight?: string;
  highlighted?: boolean;
}

export function PricingPackageCard({
  name,
  priceLabel,
  cadenceLabel,
  audience,
  description,
  features,
  cta,
  highlight,
  highlighted = false,
}: PricingPackageCardProps) {
  return (
    <article
      className="flex h-full flex-col rounded-[24px] p-6 md:p-7"
      style={{
        background: highlighted ? "linear-gradient(180deg, rgba(22,27,34,1), rgba(20,25,33,1))" : "var(--bg-surface)",
        border: `1px solid ${highlighted ? "rgba(59,130,246,0.7)" : "var(--border-default)"}`,
        boxShadow: highlighted ? "0 24px 80px rgba(59,130,246,0.12)" : "none",
      }}
    >
      <div className="mb-5">
        {highlight && (
          <div
            className="mb-4 inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ background: "rgba(59,130,246,0.14)", color: "var(--accent-cyan)" }}
          >
            {highlight}
          </div>
        )}
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
          {name}
        </div>
        <div className="mt-3 flex items-end gap-2">
          <div className="font-display text-4xl font-semibold tracking-tight">{priceLabel}</div>
          <div className="pb-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
            {cadenceLabel}
          </div>
        </div>
        <div className="mt-3 text-xs font-semibold" style={{ color: "var(--accent-cyan)" }}>
          {audience}
        </div>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      </div>

      <ul className="mb-6 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span
              className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ background: "rgba(63,185,80,0.14)", color: "var(--accent-green)" }}
            >
              +
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={cta.href}
        className="inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
        style={{
          background: highlighted ? "var(--accent-blue)" : "transparent",
          color: highlighted ? "#fff" : "var(--text-primary)",
          border: highlighted ? "none" : "1px solid var(--border-default)",
        }}
      >
        {cta.label}
      </Link>
    </article>
  );
}
