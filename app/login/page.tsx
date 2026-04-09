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
  const [mode, setMode] = useState<"quick" | "magic">("quick");

  const errorParam = searchParams.get("error");
  const redirect = searchParams.get("redirect") || "/app";

  async function handleQuickLogin() {
    setStatus("Signing in...");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      setStatus("Login failed. Please check your email and try again.");
      return;
    }
    setStatus("Signed in.");
    router.push(redirect);
  }

  async function handleMagicLink() {
    setStatus("Sending magic link...");
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
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6 bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="card p-8 space-y-4">
        <h1 className="font-display text-3xl font-semibold text-ink">Recruiter sign in</h1>
        <p className="text-sm text-slate-600">Enter your work email to access your sessions.</p>

        {errorParam && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {errorParam === "missing_token" && "Invalid sign-in link."}
            {errorParam === "Link expired" && "This sign-in link has expired. Please request a new one."}
            {errorParam === "Link already used" && "This sign-in link has already been used."}
            {!["missing_token", "Link expired", "Link already used"].includes(errorParam) && errorParam}
          </div>
        )}

        <input
          className="w-full rounded-md border border-slate-200 px-3 py-2"
          placeholder="you@company.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && email && (mode === "quick" ? handleQuickLogin() : handleMagicLink())}
        />

        {/* Mode tabs */}
        <div className="flex gap-2 border-b border-slate-200 text-sm">
          <button
            className={`px-3 py-1.5 -mb-px border-b-2 transition-colors ${
              mode === "quick" ? "border-ink text-ink font-medium" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
            onClick={() => setMode("quick")}
            type="button"
          >
            Quick sign in
          </button>
          <button
            className={`px-3 py-1.5 -mb-px border-b-2 transition-colors ${
              mode === "magic" ? "border-ink text-ink font-medium" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
            onClick={() => setMode("magic")}
            type="button"
          >
            Magic link
          </button>
        </div>

        {mode === "quick" ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Instantly sign in with your email (no password required).</p>
            <button
              className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink/90 transition-colors disabled:opacity-50"
              onClick={handleQuickLogin}
              disabled={!email}
            >
              Sign in
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">We'll send a secure sign-in link to your email.</p>
            <button
              className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink/90 transition-colors disabled:opacity-50"
              onClick={handleMagicLink}
              disabled={!email}
            >
              Send magic link
            </button>
          </div>
        )}

        {status && (
          <p className={`text-xs ${status.includes("failed") || status.includes("Failed") ? "text-red-500" : "text-slate-500"}`}>
            {status}
          </p>
        )}
      </div>
    </main>
  );
}
