"use client";

import { useState } from "react";

export function RubricForm({ sessionId }: { sessionId: string }) {
  const [decision, setDecision] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({
    repo_understanding: 3,
    requirement_clarity: 3,
    delivery_quality: 3,
    architecture_tradeoffs: 3,
    ai_usage_quality: 3,
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const form = e.currentTarget;
      const data = new FormData(form);
      const res = await fetch("/api/rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          scores: sliderValues,
          comments: data.get("comments"),
          decision,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to submit evaluation");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit evaluation. Please try again.");
      setSubmitting(false);
    }
  }

  const decisions = [
    { value: "strong_hire", label: "Strong Hire", chipClass: "chip-green" },
    { value: "hire", label: "Hire", chipClass: "chip-blue" },
    { value: "no_hire", label: "No Hire", chipClass: "chip-orange" },
    { value: "strong_no_hire", label: "Strong No Hire", chipClass: "chip-red" },
  ];

  const rubricDimensions = [
    ["repo_understanding", "Repo Understanding", "How well did they navigate and understand the codebase?"],
    ["requirement_clarity", "Requirement Clarification", "Did they ask good questions and document assumptions?"],
    ["delivery_quality", "Delivery Quality", "Is the code correct, clean, and well-structured?"],
    ["architecture_tradeoffs", "Architecture Tradeoffs", "Did they consider scalability, maintainability, edge cases?"],
    ["ai_usage_quality", "AI Usage Quality", "How effectively did they leverage the AI copilot?"],
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="action-status error">{error}</div>
      )}

      {/* Rubric scores */}
      <div className="space-y-4">
        {rubricDimensions.map(([key, label, desc]) => (
          <div key={key}>
            <div className="text-xs font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>{label}</div>
            <p className="text-[10px] mb-1.5" style={{ color: "var(--text-tertiary)" }}>{desc}</p>
            <div className="flex items-center gap-2">
              <input
                name={key}
                type="range"
                min={1}
                max={5}
                value={sliderValues[key]}
                onChange={(e) => setSliderValues((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                className="flex-1 accent-[var(--accent-blue)]"
              />
              <span className="text-xs font-mono w-4 text-center" style={{ color: "var(--accent-blue)" }}>
                {sliderValues[key]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Hire decision */}
      <div>
        <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Decision</h3>
        <div className="flex flex-wrap gap-2">
          {decisions.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDecision(d.value)}
              className={`chip ${decision === d.value ? d.chipClass : "chip-muted"} cursor-pointer transition-all`}
              style={decision === d.value ? { outline: "2px solid var(--border-focus)", outlineOffset: "1px" } : {}}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div>
        <label className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
          Interviewer Notes
        </label>
        <textarea
          name="comments"
          rows={3}
          className="mt-1.5 w-full rounded-md p-3 text-xs"
          style={{
            background: "var(--bg-inset)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
          placeholder="Free-form notes about the candidate's performance..."
        />
      </div>

      <button className="btn btn-primary w-full" type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Evaluation"}
      </button>
    </form>
  );
}
