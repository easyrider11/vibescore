"use client";

import { useRouter } from "next/navigation";

export default function SessionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="rounded-xl p-8 text-center max-w-md" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
          Failed to load session
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>
          {error.message || "Could not load the session details."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/app")}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ background: "var(--bg-surface-alt)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
          >
            Back to sessions
          </button>
          <button
            onClick={reset}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
            style={{ background: "var(--accent-blue)", color: "#fff" }}
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
