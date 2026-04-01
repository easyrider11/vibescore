export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-6">
        <div className="skeleton h-7 w-56" />
        <div className="skeleton mt-2 h-4 w-80" />
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Filter bar skeleton */}
        <div className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="skeleton h-8 w-36" />
          <div className="skeleton h-8 w-32" />
        </div>

        {/* KPI cards skeleton */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="skeleton h-4 w-28" />
              <div className="skeleton mt-3 h-8 w-24" />
              <div className="skeleton mt-2 h-3 w-36" />
            </div>
          ))}
        </section>

        {/* Chart skeletons */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="skeleton mb-4 h-5 w-40" />
              <div className="skeleton h-[300px] w-full" />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
