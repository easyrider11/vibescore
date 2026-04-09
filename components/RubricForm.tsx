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
    { value: "strong_hire", label: "Strong Hire", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
    { value: "hire", label: "Hire", color: "bg-green-50 text-green-700 border-green-300" },
    { value: "no_hire", label: "No Hire", color: "bg-orange-50 text-orange-700 border-orange-300" },
    { value: "strong_no_hire", label: "Strong No Hire", color: "bg-red-50 text-red-700 border-red-300" },
  ];

  const rubricDimensions = [
    ["repo_understanding", "Repo Understanding", "How well did they navigate and understand the codebase?"],
    ["requirement_clarity", "Requirement Clarification", "Did they ask good questions and document assumptions?"],
    ["delivery_quality", "Delivery Quality", "Is the code correct, clean, and well-structured?"],
    ["architecture_tradeoffs", "Architecture Tradeoffs", "Did they consider scalability, maintainability, edge cases?"],
    ["ai_usage_quality", "AI Usage Quality", "How effectively did they leverage the AI copilot?"],
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Rubric scores */}
      <div className="grid gap-3 md:grid-cols-2">
        {rubricDimensions.map(([key, label, desc]) => (
          <label key={key} className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">{label}</span>
            <p className="text-xs text-slate-400 mt-0.5 mb-1">{desc}</p>
            <div className="flex items-center gap-2">
              <input
                name={key}
                type="range"
                min={1}
                max={5}
                value={sliderValues[key]}
                onChange={(e) => setSliderValues((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                className="flex-1"
              />
              <span className="text-xs font-mono text-slate-500 w-4 text-center">{sliderValues[key]}</span>
            </div>
          </label>
        ))}
      </div>

      {/* Hire decision */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Decision</h3>
        <div className="flex gap-2">
          {decisions.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDecision(d.value)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                decision === d.value ? d.color + " ring-2 ring-offset-1" : "border-slate-200 text-slate-400 hover:border-slate-300"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comments */}
      <label className="block text-sm text-slate-600">
        <span className="font-medium text-slate-800">Interviewer Notes</span>
        <textarea
          name="comments"
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm"
          placeholder="Free-form notes about the candidate's performance..."
        />
      </label>

      <button
        className="rounded-lg bg-ink px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink/90 transition-colors disabled:opacity-50"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Submit Evaluation"}
      </button>
    </form>
  );
}
