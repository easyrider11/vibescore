import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 font-body"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <div className="max-w-md text-center">
        <div
          className="text-xs font-semibold uppercase tracking-[0.24em]"
          style={{ color: "var(--accent-cyan)" }}
        >
          404
        </div>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          This page isn&apos;t part of the interview.
        </h1>
        <p
          className="mt-4 text-base leading-7"
          style={{ color: "var(--text-secondary)" }}
        >
          The link may be stale or the session may have ended. Head back to the dashboard or the landing page to continue.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--accent-blue)" }}
          >
            Back to home
          </Link>
          <Link
            href="/app"
            className="rounded-lg px-5 py-3 text-sm font-semibold transition-colors"
            style={{
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
            }}
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
