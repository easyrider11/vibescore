import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  accessory?: ReactNode;
}

export function ChartCard({ title, description, children, accessory }: ChartCardProps) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3
            className="font-display text-sm font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
              {description}
            </p>
          )}
        </div>
        {accessory}
      </div>
      {children}
    </div>
  );
}
