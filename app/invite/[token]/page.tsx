"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "accepting" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    // Check if user is logged in first
    fetch("/api/settings")
      .then((r) => {
        if (r.status === 401) {
          // Redirect to login, then back here
          window.location.href = `/login?redirect=/invite/${token}`;
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setStatus("accepting");
          acceptInvite();
        }
      })
      .catch(() => {
        window.location.href = `/login?redirect=/invite/${token}`;
      });
  }, [token]);

  async function acceptInvite() {
    try {
      const res = await fetch("/api/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(body.error || "Failed to accept invite");
        return;
      }

      setStatus("success");
      setOrgName(body.orgName);
      setTimeout(() => router.push("/app"), 2000);
    } catch {
      setStatus("error");
      setMessage("Something went wrong");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        className="rounded-xl p-8 max-w-md w-full text-center"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
      >
        {status === "loading" || status === "accepting" ? (
          <>
            <div className="h-10 w-10 mx-auto mb-4 rounded-full animate-pulse" style={{ background: "var(--bg-inset)" }} />
            <h1 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Accepting invitation...
            </h1>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Please wait while we add you to the team.
            </p>
          </>
        ) : status === "success" ? (
          <>
            <div
              className="h-10 w-10 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: "rgba(46,160,67,0.15)" }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--accent-green)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Welcome to {orgName}!
            </h1>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Redirecting to dashboard...
            </p>
          </>
        ) : (
          <>
            <div
              className="h-10 w-10 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: "rgba(248,81,73,0.15)" }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--accent-red)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="font-display text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Unable to accept invite
            </h1>
            <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>
              {message}
            </p>
            <button className="btn btn-primary text-xs" onClick={() => router.push("/app")}>
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
