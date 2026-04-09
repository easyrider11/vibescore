export default function DashboardLoading() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-md" style={{ background: "var(--bg-surface-alt)" }} />
          <div className="h-4 w-72 rounded-md" style={{ background: "var(--bg-surface-alt)" }} />
        </div>
        <div className="h-9 w-32 rounded-lg" style={{ background: "var(--bg-surface-alt)" }} />
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-3">
        <div className="h-9 w-64 rounded-lg" style={{ background: "var(--bg-surface-alt)" }} />
        <div className="h-9 w-32 rounded-lg" style={{ background: "var(--bg-surface-alt)" }} />
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
        {/* Header */}
        <div className="flex gap-4 px-4 py-3" style={{ borderBottom: "1px solid var(--border-default)" }}>
          {[120, 80, 100, 60, 70, 80, 80].map((w, i) => (
            <div key={i} className="h-3 rounded" style={{ width: w, background: "var(--bg-surface-alt)" }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4" style={{ borderBottom: "1px solid var(--border-default)" }}>
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-32 rounded" style={{ background: "var(--bg-surface-alt)" }} />
              <div className="h-2.5 w-44 rounded" style={{ background: "var(--bg-surface-alt)" }} />
            </div>
            <div className="h-3 w-20 rounded" style={{ background: "var(--bg-surface-alt)" }} />
            <div className="h-3 w-24 rounded" style={{ background: "var(--bg-surface-alt)" }} />
            <div className="h-5 w-16 rounded-full" style={{ background: "var(--bg-surface-alt)" }} />
            <div className="h-5 w-16 rounded-full" style={{ background: "var(--bg-surface-alt)" }} />
            <div className="h-3 w-20 rounded" style={{ background: "var(--bg-surface-alt)" }} />
            <div className="h-6 w-16 rounded" style={{ background: "var(--bg-surface-alt)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
