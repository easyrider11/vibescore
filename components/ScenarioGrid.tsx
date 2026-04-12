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
        <div className="action-status error">{error}</div>
      )}
      <div className="grid gap-3 md:grid-cols-3">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="card p-4 flex flex-col gap-2">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{scenario.title}</h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{scenario.description}</p>
            <button
              className="btn btn-primary btn-xs mt-2 self-start"
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
