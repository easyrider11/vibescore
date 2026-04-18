export function HeroProductPreview() {
  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 24px 60px -28px rgba(0,0,0,0.7)",
      }}
    >
      <div
        className="flex items-center px-4 py-2"
        style={{ borderBottom: "1px solid var(--border-default)" }}
      >
        <div
          className="flex-1 truncate text-[11px] font-mono"
          style={{ color: "var(--text-tertiary)" }}
        >
          buildscore.dev/r/alex-chen · agent-loop-fix
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div
          className="rounded-xl p-4"
          style={{
            background: "var(--bg-inset)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div
                className="text-[9px] font-semibold uppercase tracking-[0.2em] mb-1"
                style={{ color: "var(--accent-cyan)" }}
              >
                AI Assessment
              </div>
              <div
                className="text-sm font-semibold leading-snug"
                style={{ color: "var(--text-primary)" }}
              >
                Diagnosed both bugs without AI-guessing, iterated on tests, outlined follow-ups.
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span
                className="chip chip-green"
                style={{ fontSize: 10, padding: "2px 8px" }}
              >
                Strong Hire
              </span>
              <span
                className="text-[10px] font-mono tabular"
                style={{ color: "var(--text-tertiary)" }}
              >
                Avg 4.6/5
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2" data-tabular>
          {[
            { label: "AI Queries", value: "8" },
            { label: "Test Runs", value: "4" },
            { label: "Files", value: "12" },
            { label: "Tokens", value: "2,418" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg p-2.5"
              style={{
                background: "var(--bg-inset)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div
                className="font-mono text-sm font-semibold tabular"
                style={{ color: "var(--text-primary)" }}
              >
                {kpi.value}
              </div>
              <div
                className="text-[9px] mt-0.5"
                style={{ color: "var(--text-tertiary)" }}
              >
                {kpi.label}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          {[
            { label: "Repo understanding", val: 5 },
            { label: "Delivery quality", val: 5 },
            { label: "AI usage quality", val: 5 },
            { label: "Architecture tradeoffs", val: 4 },
          ].map((r) => (
            <div key={r.label}>
              <div className="flex items-center justify-between text-[10px] mb-0.5">
                <span style={{ color: "var(--text-secondary)" }}>{r.label}</span>
                <span
                  className="font-mono tabular"
                  style={{ color: "var(--accent-blue)" }}
                >
                  {r.val}/5
                </span>
              </div>
              <div
                className="h-1 rounded-full"
                style={{ background: "var(--bg-inset)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(r.val / 5) * 100}%`,
                    background:
                      r.val >= 4
                        ? "var(--accent-green)"
                        : "var(--accent-blue)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-lg p-3"
          style={{
            background: "var(--bg-inset)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className="chip chip-purple"
              style={{ fontSize: 9, padding: "1px 6px" }}
            >
              Explain
            </span>
            <span
              className="text-[10px] font-mono tabular"
              style={{ color: "var(--text-tertiary)" }}
            >
              00:04:12 · 420 tokens
            </span>
          </div>
          <div
            className="text-[11px] leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            "Walk me through the loop in lib/agent.js — where could this go infinite?"
          </div>
        </div>
      </div>
    </div>
  );
}
