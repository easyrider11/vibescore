import type { ReactNode } from "react";

interface TopBarProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  meta?: string[];
  actions?: ReactNode;
}

export function TopBar({ eyebrow, title, subtitle, meta = [], actions }: TopBarProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-col gap-1">
        {eyebrow ? (
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--accent-cyan)" }}>
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
        {subtitle ? <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{subtitle}</p> : null}
        {meta.length > 0 ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {meta.map((item) => (
              <span key={item} className="chip chip-muted">
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
