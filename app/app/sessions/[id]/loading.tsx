export default function SessionDetailLoading() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-24 rounded" style={{ background: "var(--bg-surface-alt)" }} />

      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-64 rounded-md" style={{ background: "var(--bg-surface-alt)" }} />
        <div className="flex gap-3">
          <div className="h-5 w-16 rounded-full" style={{ background: "var(--bg-surface-alt)" }} />
          <div className="h-5 w-40 rounded" style={{ background: "var(--bg-surface-alt)" }} />
          <div className="h-5 w-32 rounded" style={{ background: "var(--bg-surface-alt)" }} />
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl p-6 space-y-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <div className="h-5 w-40 rounded" style={{ background: "var(--bg-surface-alt)" }} />
            <div className="space-y-2">
              <div className="h-3 w-full rounded" style={{ background: "var(--bg-surface-alt)" }} />
              <div className="h-3 w-3/4 rounded" style={{ background: "var(--bg-surface-alt)" }} />
              <div className="h-3 w-1/2 rounded" style={{ background: "var(--bg-surface-alt)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
