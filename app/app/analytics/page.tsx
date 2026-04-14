"use client";

import { useEffect, useState } from "react";

interface Analytics {
  total: number;
  byStatus: Record<string, number>;
  byDecision: Record<string, number>;
  byScenario: { title: string; count: number; completed: number }[];
  avgDurationMin: number | null;
  totalAiQueries: number;
  totalEvents: number;
  totalSubmissions: number;
  rubricDimensions: Record<string, number>;
  weeklyTrend: { week: string; count: number; completed: number }[];
  passRate: number | null;
}

const DECISION_LABELS: Record<string, string> = {
  strong_hire: "Strong Hire",
  hire: "Hire",
  no_hire: "No Hire",
  strong_no_hire: "Strong No Hire",
};

const RUBRIC_LABELS: Record<string, string> = {
  repo_understanding: "Repo Understanding",
  requirement_clarity: "Requirement Clarity",
  delivery_quality: "Delivery Quality",
  architecture_tradeoffs: "Architecture Tradeoffs",
  ai_usage_quality: "AI Usage Quality",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="font-display text-xl font-semibold mb-6" style={{ color: "var(--text-primary)" }}>Analytics</h1>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "var(--bg-surface)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxWeekly = Math.max(...data.weeklyTrend.map((w) => w.count), 1);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Analytics</h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Aggregate metrics across all your sessions.</p>
      </div>

      {/* ── Top stats row ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Sessions" value={data.total} />
        <StatCard label="Completed" value={data.byStatus.completed || 0} accent="green" />
        <StatCard label="Pass Rate" value={data.passRate !== null ? `${data.passRate}%` : "—"} accent="blue" />
        <StatCard label="Avg Duration" value={data.avgDurationMin !== null ? `${data.avgDurationMin}m` : "—"} />
        <StatCard label="AI Queries" value={data.totalAiQueries} accent="purple" />
      </div>

      {/* ── Weekly trend ── */}
      <section>
        <h2 className="section-header">Weekly Trend</h2>
        <div className="rounded-xl p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
          <div className="flex items-end gap-1.5" style={{ height: 120 }}>
            {data.weeklyTrend.map((w) => (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5" style={{ height: 100 }}>
                  <div
                    className="w-full rounded-sm transition-all"
                    style={{
                      height: `${(w.count / maxWeekly) * 100}%`,
                      background: w.count > 0 ? "var(--accent-blue)" : "var(--bg-surface-alt)",
                      minHeight: 2,
                      opacity: w.count > 0 ? 1 : 0.3,
                    }}
                  />
                </div>
                <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>{w.week}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            <span>
              <span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: "var(--accent-blue)" }} />
              Sessions created
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Decision breakdown ── */}
        <section>
          <h2 className="section-header">Decisions</h2>
          <div className="rounded-xl p-5 space-y-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            {Object.keys(data.byDecision).length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>No evaluations submitted yet.</p>
            ) : (
              Object.entries(DECISION_LABELS).map(([key, label]) => {
                const count = data.byDecision[key] || 0;
                const totalDecisions = Object.values(data.byDecision).reduce((a, b) => a + b, 0);
                const pct = totalDecisions > 0 ? (count / totalDecisions) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                      <span style={{ color: "var(--text-tertiary)" }}>{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-inset)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background:
                            key === "strong_hire" ? "var(--accent-green)" :
                            key === "hire" ? "var(--accent-blue)" :
                            key === "no_hire" ? "var(--accent-orange)" :
                            "var(--accent-red)",
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ── Rubric averages ── */}
        <section>
          <h2 className="section-header">Avg Rubric Scores</h2>
          <div className="rounded-xl p-5 space-y-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            {Object.keys(data.rubricDimensions).length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>No rubric data yet.</p>
            ) : (
              Object.entries(RUBRIC_LABELS).map(([key, label]) => {
                const avg = data.rubricDimensions[key];
                if (avg === undefined) return null;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                      <span className="font-mono" style={{ color: "var(--accent-blue)" }}>{avg}/5</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-inset)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(avg / 5) * 100}%`, background: "var(--accent-blue)" }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* ── Scenario breakdown ── */}
      <section>
        <h2 className="section-header">By Scenario</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {data.byScenario.map((sc) => (
            <div
              key={sc.title}
              className="rounded-xl p-4"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
            >
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{sc.title}</h3>
              <div className="flex gap-3 text-xs">
                <span style={{ color: "var(--text-tertiary)" }}>
                  <strong style={{ color: "var(--text-secondary)" }}>{sc.count}</strong> sessions
                </span>
                <span style={{ color: "var(--text-tertiary)" }}>
                  <strong style={{ color: "var(--accent-green)" }}>{sc.completed}</strong> completed
                </span>
                <span style={{ color: "var(--text-tertiary)" }}>
                  {sc.count > 0 ? Math.round((sc.completed / sc.count) * 100) : 0}% rate
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Status breakdown ── */}
      <section>
        <h2 className="section-header">Session Status</h2>
        <div className="flex gap-3 flex-wrap">
          {Object.entries(data.byStatus).map(([status, count]) => (
            <div
              key={status}
              className="rounded-lg px-4 py-3 flex items-center gap-3"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background:
                    status === "completed" ? "var(--accent-green)" :
                    status === "active" ? "var(--accent-blue)" :
                    status === "pending" ? "var(--accent-orange)" :
                    "var(--text-tertiary)",
                }}
              />
              <div>
                <div className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{count}</div>
                <div className="text-[10px] capitalize" style={{ color: "var(--text-tertiary)" }}>{status}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  const color = accent === "green" ? "var(--accent-green)" :
                accent === "blue" ? "var(--accent-blue)" :
                accent === "purple" ? "var(--accent-purple)" :
                "var(--text-primary)";
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</div>
      <div className="text-2xl font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}

