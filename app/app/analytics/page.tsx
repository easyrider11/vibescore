"use client";

import { useEffect, useMemo, useState } from "react";
import { KpiCard, type Trend } from "../../../components/analytics/KpiCard";
import { ChartCard } from "../../../components/analytics/ChartCard";
import { WeeklyTrendChart } from "../../../components/analytics/WeeklyTrendChart";
import { DecisionsDonut } from "../../../components/analytics/DecisionsDonut";
import { ScenarioBarChart } from "../../../components/analytics/ScenarioBarChart";
import {
  DECISION_HEX,
  DECISION_LABELS,
  RUBRIC_LABELS,
  type Decision,
} from "../../../lib/rubric";

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

const DECISION_META: { key: Decision; label: string; color: string }[] = (
  Object.keys(DECISION_LABELS) as Decision[]
).map((key) => ({
  key,
  label: DECISION_LABELS[key],
  color: DECISION_HEX[key],
}));

function computeTrend(series: number[]): Trend | null {
  if (series.length < 2) return null;
  const current = series[series.length - 1];
  const prior = series[series.length - 2];
  if (prior === 0 && current === 0) return { direction: "flat", percent: 0 };
  if (prior === 0) return { direction: "up", percent: 100 };
  const delta = ((current - prior) / prior) * 100;
  if (Math.abs(delta) < 1) return { direction: "flat", percent: 0 };
  return {
    direction: delta > 0 ? "up" : "down",
    percent: Math.round(Math.abs(delta)),
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const trends = useMemo(() => {
    if (!data) return { created: null, completed: null } as const;
    return {
      created: computeTrend(data.weeklyTrend.map((w) => w.count)),
      completed: computeTrend(data.weeklyTrend.map((w) => w.completed)),
    };
  }, [data]);

  const decisionSlices = useMemo(() => {
    if (!data) return [];
    return DECISION_META.map((d) => ({
      key: d.key,
      label: d.label,
      color: d.color,
      value: data.byDecision[d.key] || 0,
    })).filter((d) => d.value > 0);
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <div>
          <h1
            className="font-display text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Analytics
          </h1>
          <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
            Aggregate metrics across all your sessions.
          </p>
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse card"
            />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-[300px] animate-pulse card"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const completedTotal = data.byStatus.completed || 0;

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1
          className="font-display text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Analytics
        </h1>
        <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
          Aggregate metrics across all your sessions. Trends compare the most recent week to the prior week.
        </p>
      </div>

      {/* ── KPI row ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Total Sessions" value={data.total} trend={trends.created} />
        <KpiCard label="Completed" value={completedTotal} trend={trends.completed} accent="green" />
        <KpiCard
          label="Pass Rate"
          value={data.passRate !== null ? `${data.passRate}%` : "—"}
          accent="blue"
        />
        <KpiCard
          label="Avg Duration"
          value={data.avgDurationMin !== null ? `${data.avgDurationMin}m` : "—"}
        />
        <KpiCard label="AI Queries" value={data.totalAiQueries} accent="purple" />
      </div>

      {/* ── Weekly trend (full width) ── */}
      <ChartCard
        title="Weekly trend"
        description="Sessions created and completed over the last 8 weeks."
      >
        <WeeklyTrendChart data={data.weeklyTrend} />
      </ChartCard>

      {/* ── Decisions + Rubric side by side ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Decisions" description="Distribution of recruiter decisions.">
          <DecisionsDonut data={decisionSlices} />
        </ChartCard>

        <ChartCard title="Avg rubric scores" description="Mean score per rubric dimension (0–5).">
          {Object.keys(data.rubricDimensions).length === 0 ? (
            <div
              className="flex h-[240px] items-center justify-center text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              No rubric data yet.
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {Object.entries(RUBRIC_LABELS).map(([key, label]) => {
                const avg = data.rubricDimensions[key];
                if (avg === undefined) return null;
                return (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                      <span className="font-mono" style={{ color: "var(--accent-cyan)" }}>
                        {avg}/5
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full"
                      style={{ background: "var(--bg-inset)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(avg / 5) * 100}%`,
                          background: "var(--accent-blue)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Scenario chart ── */}
      <ChartCard
        title="By scenario"
        description="Total vs. completed sessions per scenario."
      >
        <ScenarioBarChart data={data.byScenario} />
      </ChartCard>

      {/* ── Status chips ── */}
      <section>
        <h2
          className="mb-3 text-xs font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--text-tertiary)" }}
        >
          Session status
        </h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(data.byStatus).map(([status, count]) => (
            <div
              key={status}
              className="flex items-center gap-3 rounded-lg px-4 py-3"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  background:
                    status === "completed"
                      ? "var(--accent-green)"
                      : status === "active"
                        ? "var(--accent-blue)"
                        : status === "pending"
                          ? "var(--accent-orange)"
                          : "var(--text-tertiary)",
                }}
              />
              <div>
                <div
                  className="text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {count}
                </div>
                <div
                  className="text-[10px] capitalize"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
