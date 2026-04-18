"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AI_NATIVE_SLUGS, isAiNativeSlug } from "../../../lib/scenarios";

interface Scenario {
  id: string;
  slug: string;
  title: string;
  description: string;
  timeLimitMin: number | null;
}

const steps = ["Template", "Candidate", "Configure", "Review"];

export default function NewSessionWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [inviteStatus, setInviteStatus] = useState<{ sent: boolean; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [createError, setCreateError] = useState<{ message: string; code?: string } | null>(null);

  // Form state
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [position, setPosition] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [sendInvite, setSendInvite] = useState(true);

  useEffect(() => {
    fetch("/api/scenarios")
      .then((r) => r.json())
      .then((data: Scenario[]) => {
        // Surface AI-native scenarios first.
        const sorted = [...data].sort((a, b) => {
          const aw = AI_NATIVE_SLUGS.has(a.slug) ? 0 : 1;
          const bw = AI_NATIVE_SLUGS.has(b.slug) ? 0 : 1;
          return aw - bw;
        });
        setScenarios(sorted);
        setLoading(false);
      });
  }, []);

  async function createSession() {
    if (!selectedScenario) return;
    setCreating(true);
    setCreateError(null);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: selectedScenario.id,
        candidateName,
        candidateEmail,
        position,
        durationMinutes,
        sendInvite,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setCreatedToken(data.publicToken);
      setInviteStatus(data.inviteEmail ?? null);
    } else {
      const body = await res.json().catch(() => ({}));
      setCreateError({ message: body.error || "Failed to create session", code: body.code });
    }
    setCreating(false);
  }

  function copyLink() {
    if (!createdToken) return;
    navigator.clipboard.writeText(`${window.location.origin}/s/${createdToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const canAdvance = () => {
    if (step === 0) return !!selectedScenario;
    if (step === 1) return candidateName.trim().length > 0 && candidateEmail.trim().length > 0;
    return true;
  };

  // Success state
  if (createdToken) {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/s/${createdToken}`;
    return (
      <div className="p-8 max-w-xl mx-auto mt-16">
        <div className="rounded-xl p-8 text-center" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
          <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(63,185,80,0.15)" }}>
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="var(--accent-green)" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Session Created</h2>
          {inviteStatus?.sent ? (
            <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
              Invite sent to <strong style={{ color: "var(--accent-green)" }}>{candidateEmail}</strong>.
            </p>
          ) : inviteStatus?.error ? (
            <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--status-error)" }}>Email failed:</span> {inviteStatus.error}. Share the link manually below.
            </p>
          ) : (
            <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
              Send this link to <strong>{candidateName}</strong> to start the interview.
            </p>
          )}
          <p className="text-xs mb-6" style={{ color: "var(--text-tertiary)" }}>
            You can also copy the link below.
          </p>
          <div className="flex items-center gap-2 rounded-lg p-3 mb-4" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-default)" }}>
            <code className="flex-1 text-xs truncate" style={{ color: "var(--accent-cyan)" }}>{url}</code>
            <button
              onClick={copyLink}
              className="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: copied ? "var(--accent-green)" : "var(--accent-blue)" }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/app")}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ background: "var(--bg-surface-alt)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
            >
              Back to Sessions
            </button>
            <button
              onClick={() => {
                setCreatedToken(null);
                setInviteStatus(null);
                setStep(0);
                setSelectedScenario(null);
                setCandidateName("");
                setCandidateEmail("");
                setPosition("");
                setDurationMinutes(45);
                setSendInvite(true);
              }}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--accent-blue)" }}
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        New Session
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
        Set up an interview session in a few steps.
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer"
              style={{
                background: i === step ? "rgba(59,130,246,0.15)" : i < step ? "rgba(63,185,80,0.1)" : "var(--bg-surface)",
                color: i === step ? "var(--accent-blue)" : i < step ? "var(--accent-green)" : "var(--text-tertiary)",
                border: `1px solid ${i === step ? "var(--accent-blue)" : "var(--border-default)"}`,
              }}
              onClick={() => { if (i < step) setStep(i); }}
            >
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: i < step ? "var(--accent-green)" : "transparent", color: i < step ? "white" : "inherit" }}>
                {i < step ? "✓" : i + 1}
              </span>
              {s}
            </div>
            {i < steps.length - 1 && (
              <div className="w-8 h-px" style={{ background: i < step ? "var(--accent-green)" : "var(--border-default)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Template selection */}
      {step === 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>Choose a template</h2>
          {loading ? (
            <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>Loading templates…</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {scenarios.map((sc) => {
                const isAiNative = isAiNativeSlug(sc.slug);
                const isSelected = selectedScenario?.id === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    className="rounded-xl p-4 text-left transition-colors min-w-0"
                    style={{
                      background: isSelected
                        ? "rgba(59,130,246,0.08)"
                        : isAiNative
                        ? "linear-gradient(135deg, rgba(59,130,246,0.05), rgba(163,113,247,0.04))"
                        : "var(--bg-surface)",
                      border: `1px solid ${
                        isSelected
                          ? "var(--accent-blue)"
                          : isAiNative
                          ? "rgba(88,166,255,0.35)"
                          : "var(--border-default)"
                      }`,
                    }}
                    onClick={() => {
                      setSelectedScenario(sc);
                      if (sc.timeLimitMin) setDurationMinutes(sc.timeLimitMin);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{sc.title}</h3>
                        {sc.timeLimitMin && (
                          <span className="text-[10px] rounded-full px-2 py-0.5 shrink-0 tabular" style={{ background: "var(--bg-surface-alt)", color: "var(--text-tertiary)" }}>
                            {sc.timeLimitMin}m
                          </span>
                        )}
                      </div>
                      {isAiNative && (
                        <span className="chip chip-cyan shrink-0" style={{ fontSize: 10 }}>
                          AI-native
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {sc.description}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Candidate details */}
      {step === 1 && (
        <div className="space-y-4 max-w-md">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>Candidate details</h2>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Name <span style={{ color: "var(--status-error)" }}>*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              placeholder="Jane Doe"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Email <span style={{ color: "var(--status-error)" }}>*</span>
            </label>
            <input
              type="email"
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              placeholder="jane@example.com"
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Position / Role
            </label>
            <input
              type="text"
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              placeholder="Senior Frontend Engineer"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 2 && (
        <div className="space-y-4 max-w-md">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>Session configuration</h2>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Duration</label>
            <select
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Template</div>
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{selectedScenario?.title}</div>
          </div>
          <label className="flex items-start gap-3 rounded-lg p-3 cursor-pointer" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <input
              type="checkbox"
              checked={sendInvite}
              onChange={(e) => setSendInvite(e.target.checked)}
              className="mt-0.5 accent-[var(--accent-blue)]"
            />
            <div>
              <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Email invite to candidate</div>
              <div className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                Automatically send {candidateEmail || "the candidate"} a link to start the interview.
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-3 max-w-md">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>Review &amp; create</h2>
          <div className="rounded-xl p-5 space-y-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <Row label="Template" value={selectedScenario?.title || ""} />
            <Row label="Candidate" value={candidateName} />
            <Row label="Email" value={candidateEmail} />
            {position && <Row label="Position" value={position} />}
            <Row label="Duration" value={`${durationMinutes} minutes`} />
            <Row label="Email invite" value={sendInvite ? "Will be sent" : "Skipped"} />
          </div>
        </div>
      )}

      {/* Error banner */}
      {createError && (
        <div
          className="mt-4 rounded-xl p-4 flex items-start gap-3 max-w-md"
          style={{ background: "rgba(248,81,73,0.08)", border: "1px solid rgba(248,81,73,0.3)" }}
        >
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--accent-red)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <div>
            <p className="text-xs font-medium" style={{ color: "var(--accent-red)" }}>{createError.message}</p>
            {createError.code === "SESSION_LIMIT_REACHED" && (
              <a href="/app/billing" className="text-[10px] font-semibold mt-1 inline-block" style={{ color: "var(--accent-blue)" }}>
                View billing &rarr;
              </a>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : router.push("/app")}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{ background: "var(--bg-surface)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
        >
          {step === 0 ? "Cancel" : "Back"}
        </button>
        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--accent-blue)" }}
          >
            Next
          </button>
        ) : (
          <button
            onClick={createSession}
            disabled={creating}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--accent-green)" }}
          >
            {creating ? "Creating…" : "Create Session"}
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}
