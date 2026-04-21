"use client";

import { useState } from "react";

export function DemoBanner() {
  const [loading, setLoading] = useState(false);

  async function exitDemo() {
    setLoading(true);
    try {
      await fetch("/api/demo/end", { method: "POST" });
    } catch {
      // ignore — we redirect regardless
    }
    window.location.href = "/";
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs border-b"
      style={{
        background:
          "linear-gradient(90deg, rgba(88,166,255,0.08), rgba(163,113,247,0.08))",
        borderColor: "rgba(88,166,255,0.25)",
        color: "var(--text-secondary)",
      }}
    >
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <span
          className="chip chip-cyan shrink-0"
          style={{ fontSize: 10, padding: "2px 8px" }}
        >
          Demo
        </span>
        <span className="truncate">
          Fake workspace. 9 seeded candidates. Break anything &mdash; you&rsquo;ll get a fresh copy next time.
        </span>
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-xs shrink-0"
        onClick={exitDemo}
        disabled={loading}
      >
        {loading ? "Exiting…" : "Exit demo"}
      </button>
    </div>
  );
}
