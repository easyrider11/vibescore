interface ProofStripProps {
  items: readonly string[];
}

export function ProofStrip({ items }: ProofStripProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-3 rounded-2xl px-5 py-4"
      style={{
        background: "rgba(22,27,34,0.88)",
        border: "1px solid rgba(42,49,66,0.7)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }}
    >
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
          style={{ background: "var(--bg-surface-alt)", color: "var(--text-secondary)" }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))" }}
          />
          {item}
        </span>
      ))}
    </div>
  );
}
