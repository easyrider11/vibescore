export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h1>
      {subtitle ? <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{subtitle}</p> : null}
    </div>
  );
}
