"use client";

import { useState } from "react";

export function RubricForm({ sessionId }: { sessionId: string }) {
  const [decision, setDecision] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const scores = {
      repo_understanding: Number(data.get("repo_understanding")),
      requirement_clarity: Number(data.get("requirement_clarity")),
      delivery_quality: Number(data.get("delivery_quality")),
      architecture_tradeoffs: Number(data.get("architecture_tradeoffs")),
      ai_usage_quality: Number(data.get("ai_usage_quality")),
    };
    await fetch("/api/rubric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        scores,
        comments: data.get("comments"),
        decision,
      }),
    });
    window.location.reload();
  }

  const decisions = [
    { value: "strong_hire", label: "Strong Hire", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
    { value: "hire", label: "Hire", color: "bg-green-50 text-green-700 border-green-300" },
    { value: "no_hire", label: "No Hire", color: "bg-orange-50 text-orange-700 border-orange-300" },
    { value: "strong_no_hire", label: "Strong No Hire", color: "bg-red-50 text-red-700 border-red-300" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rubric scores */}
      <div className="grid gap-3 md:grid-cols-2">
        {[
          ["repo_understanding", "Repo Understanding", "How well did they navigate and understand the codebase?"],
          ["requirement_clarity", "Requirement Clarification", "Did they ask good questions and document assumptions?"],
          ["delivery_quality", "Delivery Quality", "Is the code correct, clean, and well-structured?"],
          ["architecture_tradeoffs", "Architecture Tradeoffs", "Did they consider scalability, maintainability, edge cases?"],
          ["ai_usage_quality", "AI Usage Quality", "How effectively did they leverage the AI copilot?"],
        ].map(([key, label, desc]) => (
          <label key={key} className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">{label}</span>
            <p className="text-xs text-slate-400 mt-0.5 mb-1">{desc}</p>
            <div className="flex items-center gap-2">
              <input name={key} type="range" min={1} max={5} defaultValue={3} className="flex-1" />
              <span className="text-xs font-mono text-slate-500 w-4 text-center">3</span>
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

      <button className="rounded-lg bg-ink px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink/90 transition-colors" type="submit">
        Submit Evaluation
      </button>
    </form>
  );
}
