"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { isAiNativeSlug } from "../lib/scenarios";

interface Scenario {
  id: string;
  slug?: string;
  title: string;
  description: string;
  timeLimitMin?: number | null;
  allowedModes?: string[];
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
        {scenarios.map((scenario) => {
          const isAiNative = isAiNativeSlug(scenario.slug);
          return (
            <div
              key={scenario.id}
              className="card p-4 flex flex-col gap-2 min-w-0"
              style={
                isAiNative
                  ? { borderColor: "rgba(88,166,255,0.35)", background: "linear-gradient(135deg, rgba(59,130,246,0.05), rgba(163,113,247,0.04))" }
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{scenario.title}</h3>
                {isAiNative && (
                  <span className="chip chip-cyan shrink-0" style={{ fontSize: 10 }}>
                    AI-native
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{scenario.description}</p>
              {(scenario.timeLimitMin || scenario.allowedModes?.length) ? (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {scenario.timeLimitMin ? <span className="chip chip-muted">{scenario.timeLimitMin} min</span> : null}
                  {scenario.allowedModes?.map((mode) => (
                    <span key={mode} className="chip chip-blue">
                      {mode}
                    </span>
                  ))}
                </div>
              ) : null}
              <button
                className="btn btn-primary btn-xs mt-2 self-start"
                onClick={() => createSession(scenario.id)}
                disabled={creatingId !== null}
                aria-label={`Create session for ${scenario.title}`}
              >
                {creatingId === scenario.id ? "Creating…" : "Create Session"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
