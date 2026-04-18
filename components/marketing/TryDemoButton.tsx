"use client";

import { useState } from "react";

interface Props {
  label?: string;
  variant?: "primary" | "ghost";
  className?: string;
}

export function TryDemoButton({
  label = "Try the demo",
  variant = "primary",
  className,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/demo/provision", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Demo failed to load");
      }
      const data = await res.json();
      window.location.href = data.redirectTo || "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo failed to load");
      setLoading(false);
    }
  }

  const baseStyle =
    variant === "primary"
      ? {
          background: "var(--accent-blue)",
          color: "white",
        }
      : {
          background: "transparent",
          color: "var(--text-primary)",
          border: "1px solid var(--border-default)",
        };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={start}
        disabled={loading}
        aria-busy={loading || undefined}
        aria-live="polite"
        className="rounded-lg px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
        style={{ ...baseStyle, outlineColor: "var(--accent-cyan)" }}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-3 h-3 rounded-full border-2 animate-spin"
              style={{
                borderColor: "rgba(255,255,255,0.35)",
                borderTopColor: variant === "primary" ? "white" : "var(--text-primary)",
              }}
            />
            Setting Up Your Workspace…
          </span>
        ) : (
          label
        )}
      </button>
      <p
        role="status"
        aria-live="polite"
        className="mt-2 text-xs"
        style={{ color: "var(--status-error)", minHeight: error ? undefined : 0 }}
      >
        {error}
      </p>
    </div>
  );
}
