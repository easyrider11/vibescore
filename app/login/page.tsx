"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit() {
    setStatus("Signing in...");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      setStatus("Login failed.");
      return;
    }
    setStatus("Signed in.");
    router.push("/app");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6 bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="card p-8 space-y-4">
        <h1 className="font-display text-3xl font-semibold text-ink">Recruiter sign in</h1>
        <p className="text-sm text-slate-600">Enter your work email to access your sessions.</p>
        <input
          className="w-full rounded-md border border-slate-200 px-3 py-2"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
          onClick={handleSubmit}
          disabled={!email}
        >
          Sign in
        </button>
        <p className="text-xs text-slate-500">{status}</p>
      </div>
    </main>
  );
}
