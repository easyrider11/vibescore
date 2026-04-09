"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Scenario {
  id: string;
  title: string;
  description: string;
}

export function ScenarioGrid({ scenarios }: { scenarios: Scenario[] }) {
  const router = useRouter();
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function createSession(scenarioId: string) {
    setCreatingId(scenarioId);
    setError("");

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create session");
      }

      const data = await res.json();
      router.push(`/app/sessions/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session. Please try again.");
      setCreatingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="card p-5 space-y-2">
            <h3 className="font-display text-lg font-semibold">{scenario.title}</h3>
            <p className="text-sm text-slate-600">{scenario.description}</p>
            <button
              className="mt-3 rounded-md bg-ink px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 transition-colors"
              onClick={() => createSession(scenario.id)}
              disabled={creatingId !== null}
            >
              {creatingId === scenario.id ? "Creating..." : "Create Session"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
