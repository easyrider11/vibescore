"use client";

import { useRouter } from "next/navigation";

interface Scenario {
  id: string;
  title: string;
  description: string;
}

export function ScenarioGrid({ scenarios }: { scenarios: Scenario[] }) {
  const router = useRouter();

  async function createSession(scenarioId: string) {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId }),
    });
    if (!res.ok) return;
    const data = await res.json();
    router.push(`/app/sessions/${data.id}`);
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {scenarios.map((scenario) => (
        <div key={scenario.id} className="card p-5 space-y-2">
          <h3 className="font-display text-lg font-semibold">{scenario.title}</h3>
          <p className="text-sm text-slate-600">{scenario.description}</p>
          <button
            className="mt-3 rounded-md bg-ink px-3 py-2 text-xs font-semibold text-white"
            onClick={() => createSession(scenario.id)}
          >
            Create Session
          </button>
        </div>
      ))}
    </div>
  );
}
