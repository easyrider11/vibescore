"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<"quick" | "magic" | null>(null);

  const errorParam = searchParams.get("error");
  const redirect = searchParams.get("redirect") || "/app";

  const errorMessage = errorParam
    ? errorParam === "missing_token"
      ? "Invalid sign-in link."
      : errorParam === "Link expired"
        ? "This sign-in link has expired. Please request a new one."
        : errorParam === "Link already used"
          ? "This sign-in link has already been used."
          : errorParam
    : null;

  async function handleQuickLogin() {
    if (!email) return;
    setBusy("quick");
    setStatus("Signing in…");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setStatus("Login failed. Please check your email and try again.");
        return;
      }
      router.push(redirect);
    } finally {
      setBusy(null);
    }
  }

  async function handleMagicLink() {
    if (!email) return;
    setBusy("magic");
    setStatus("Sending magic link…");
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatus(body.error || "Failed to send magic link. Please try again.");
        return;
      }
      setStatus("Check your email for a sign-in link. It expires in 15 minutes.");
    } catch {
      setStatus("Failed to send magic link. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const isError = status.toLowerCase().includes("fail");

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6 font-body"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
      >
        <div
          className="text-xs font-semibold uppercase tracking-[0.24em]"
          style={{ color: "var(--accent-cyan)" }}
        >
          Sign in
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
          Enter your work email to access your sessions.
        </p>

        {errorMessage && (
          <div
            className="mt-5 rounded-md px-3 py-2 text-sm"
            style={{
              background: "rgba(248,81,73,0.08)",
              border: "1px solid rgba(248,81,73,0.32)",
              color: "var(--accent-red)",
            }}
          >
            {errorMessage}
          </div>
        )}

        <label className="mt-6 block">
          <span
            className="text-xs font-semibold uppercase tracking-[0.22em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Work email
          </span>
          <input
            className="mt-2 w-full rounded-md px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--border-focus)]"
            style={{
              background: "var(--bg-inset)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            }}
            placeholder="you@company.com"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuickLogin()}
          />
        </label>

        <button
          type="button"
          className="mt-5 w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--accent-blue)" }}
          onClick={handleQuickLogin}
          disabled={!email || busy !== null}
        >
          {busy === "quick" ? "Signing in…" : "Sign in"}
        </button>

        <button
          type="button"
          className="mt-2 w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
          style={{
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
            background: "transparent",
          }}
          onClick={handleMagicLink}
          disabled={!email || busy !== null}
        >
          {busy === "magic" ? "Sending…" : "Email me a magic link"}
        </button>

        {status && !busy && (
          <p
            className="mt-4 text-xs leading-5"
            style={{ color: isError ? "var(--accent-red)" : "var(--text-secondary)" }}
          >
            {status}
          </p>
        )}
      </div>
    </main>
  );
}
