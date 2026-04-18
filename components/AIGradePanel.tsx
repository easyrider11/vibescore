"use client";

import { useState } from "react";
import {
  DECISION_CHIP_CLASSES as DECISION_COLORS,
  DECISION_LABELS,
  RUBRIC_LABELS,
  type Decision,
} from "../lib/rubric";
import { parseJsonOr } from "../lib/json";

interface AIGradeData {
  id: string;
  scores: Record<string, number>;
  decision: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  model: string;
  createdAt: string;
}

function parseGrade(raw: unknown): AIGradeData | null {
  if (!raw || typeof raw !== "object") return null;
  const g = raw as Record<string, unknown>;
  return {
    id: String(g.id || ""),
    scores: parseJsonOr<Record<string, number>>(g.scores, {}),
    decision: String(g.decision || ""),
    summary: String(g.summary || ""),
    strengths: parseJsonOr<string[]>(g.strengths, []),
    improvements: parseJsonOr<string[]>(g.improvements, []),
    model: String(g.model || ""),
    createdAt: String(g.createdAt || ""),
  };
}

export function AIGradePanel({
  sessionId,
  aiGrade: initialGrade,
}: {
  sessionId: string;
  aiGrade: unknown;
}) {
  const [grade, setGrade] = useState<AIGradeData | null>(parseGrade(initialGrade));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runGrade(force = false) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auto-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, force }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to grade");
      }
      const data = await res.json();
      setGrade(parseGrade(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Grading failed");
    }
    setLoading(false);
  }

  // No grade yet — show trigger button
  if (!grade) {
    return (
      <div className="evidence-block">
        <div className="evidence-block-header">
          <span>AI Assessment</span>
          <span className="chip chip-muted">Not graded</span>
        </div>
        <div className="evidence-block-body text-center py-4">
          <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
            Run AI analysis to auto-score this session.
          </p>
          {error && <p className="text-xs mb-2" style={{ color: "var(--status-error)" }}>{error}</p>}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => runGrade()}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing…
              </span>
            ) : (
              "Run AI Assessment"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Grade exists — show results
  const avgScore =
    Object.values(grade.scores).reduce((a, b) => a + b, 0) /
    Math.max(Object.values(grade.scores).length, 1);

  return (
    <div className="evidence-block">
      <div className="evidence-block-header">
        <span>AI Assessment</span>
        <span className={`chip ${DECISION_COLORS[grade.decision as Decision] || "chip-muted"}`}>
          {DECISION_LABELS[grade.decision as Decision] || grade.decision}
        </span>
      </div>
      <div className="evidence-block-body space-y-4">
        {/* Summary */}
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {grade.summary}
        </p>

        {/* Scores */}
        <div className="space-y-2">
          {Object.entries(RUBRIC_LABELS).map(([key, label]) => {
            const val = grade.scores[key];
            if (val === undefined) return null;
            return (
              <div key={key}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                  <span className="font-mono" style={{ color: "var(--accent-blue)" }}>{val}/5</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-inset)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(val / 5) * 100}%`,
                      background:
                        val >= 4 ? "var(--accent-green)" :
                        val >= 3 ? "var(--accent-blue)" :
                        val >= 2 ? "var(--accent-orange)" :
                        "var(--accent-red)",
                    }}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex justify-between text-[10px] pt-1" style={{ borderTop: "1px solid var(--border-default)" }}>
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>Average</span>
            <span className="font-mono font-medium" style={{ color: "var(--accent-blue)" }}>
              {avgScore.toFixed(1)}/5
            </span>
          </div>
        </div>

        {/* Strengths */}
        {grade.strengths.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--accent-green)" }}>
              Strengths
            </div>
            <ul className="space-y-1">
              {grade.strengths.map((s, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--accent-green)" }}>+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {grade.improvements.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--accent-orange)" }}>
              Areas to Improve
            </div>
            <ul className="space-y-1">
              {grade.improvements.map((s, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--accent-orange)" }}>-</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--border-default)" }}>
          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            {grade.model !== "mock" ? `Model: ${grade.model}` : "Mock mode"}
          </span>
          <button
            className="text-[10px] font-medium cursor-pointer"
            style={{ color: "var(--accent-blue)" }}
            onClick={() => runGrade(true)}
            disabled={loading}
          >
            {loading ? "Re-grading…" : "Re-grade"}
          </button>
        </div>
      </div>
    </div>
  );
}
