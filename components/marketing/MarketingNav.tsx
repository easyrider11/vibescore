import Link from "next/link";
import type { MarketingCta } from "../../lib/marketing";

interface MarketingNavProps {
  primaryCta: MarketingCta;
  secondaryCta: MarketingCta;
  scrolled?: boolean;
}

export function MarketingNav({ primaryCta, secondaryCta, scrolled = false }: MarketingNavProps) {
  return (
    <nav
      className="flex h-16 items-center justify-between px-6 md:px-12"
      style={{
        background: scrolled ? "rgba(14,17,23,0.82)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: `1px solid ${scrolled ? "rgba(42,49,66,0.55)" : "transparent"}`,
      }}
    >
      <Link href="/" className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl text-[11px] font-bold text-white"
          style={{ background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))" }}
        >
          B
        </div>
        <div>
          <div className="font-display text-base font-semibold tracking-tight">buildscore</div>
          <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
            AI-native hiring
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2 md:gap-3">
        <Link
          href={primaryCta.href}
          className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--accent-blue)" }}
        >
          {primaryCta.label}
        </Link>
        <Link
          href={secondaryCta.href}
          className="rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
          style={{ color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
        >
          {secondaryCta.label}
        </Link>
      </div>
    </nav>
  );
}
