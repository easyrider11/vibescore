"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="rounded-xl p-8 text-center max-w-md" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
        <div className="text-4xl mb-4" style={{ color: "var(--status-error)" }}>!</div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          Something went wrong
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        {error.digest && (
          <p className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          style={{ background: "var(--accent-blue)", color: "#fff" }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
