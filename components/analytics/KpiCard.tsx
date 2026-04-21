import type { ReactNode } from "react";

export interface Trend {
  direction: "up" | "down" | "flat";
  percent: number;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: Trend | null;
  accent?: "blue" | "green" | "purple" | "cyan" | "orange";
  icon?: ReactNode;
}

const ACCENT: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  blue: "var(--accent-blue)",
  green: "var(--accent-green)",
  purple: "var(--accent-purple)",
  cyan: "var(--accent-cyan)",
  orange: "var(--accent-orange)",
};

export function KpiCard({ label, value, subtitle, trend, accent, icon }: KpiCardProps) {
  const valueColor = accent ? ACCENT[accent] : "var(--text-primary)";
  const isUp = trend?.direction === "up";
  const isDown = trend?.direction === "down";

  return (
    <div
      className="card p-5 transition-colors hover:border-[var(--border-focus)]"
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className="text-xs font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          {label}
        </p>
        {icon && <span style={{ color: "var(--text-tertiary)" }}>{icon}</span>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="font-display text-3xl font-semibold tracking-tight" style={{ color: valueColor }}>
          {value}
        </p>
        {trend && trend.direction !== "flat" && (
          <span
            className="text-xs font-semibold"
            style={{ color: isUp ? "var(--accent-green)" : "var(--accent-red)" }}
            aria-label={`${isUp ? "Up" : "Down"} ${trend.percent} percent week over week`}
          >
            {isUp ? "↑" : "↓"} {trend.percent}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
