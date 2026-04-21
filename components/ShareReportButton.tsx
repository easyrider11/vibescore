"use client";

import { useState } from "react";

interface Props {
  sessionId: string;
  initialToken: string | null;
}

export function ShareReportButton({ sessionId, initialToken }: Props) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const shareUrl =
    typeof window !== "undefined" && token ? `${window.location.origin}/r/${token}` : "";

  async function toggle(enabled: boolean) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed");
      }
      const data = await res.json();
      setToken(data.publicReportToken || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
    setLoading(false);
  }

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed");
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => toggle(true)}
          disabled={loading}
        >
          {loading ? "Creating link…" : "Share report"}
        </button>
        {error && (
          <span className="text-xs" style={{ color: "var(--status-error)" }}>
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={copy}
          disabled={!shareUrl}
          aria-live="polite"
        >
          {copied ? "Copied" : "Copy Link"}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => toggle(false)}
          disabled={loading}
          aria-label="Revoke public share link"
        >
          {loading ? "…" : "Revoke"}
        </button>
      </div>
      <span
        className="inline-flex items-center gap-1 max-w-[280px] text-[10px] font-mono tabular truncate"
        style={{ color: "var(--text-tertiary)" }}
        title={shareUrl}
      >
        <span aria-hidden="true">🔗</span>
        <span className="truncate">{shareUrl.replace(/^https?:\/\//, "")}</span>
      </span>
    </div>
  );
}
