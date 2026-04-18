"use client";

import { useEffect, useState } from "react";

interface Settings {
  org: {
    id: string;
    name: string;
    defaultAiMode: string;
    defaultDurationMin: number;
    autoGradeEnabled: boolean;
    allowedAiModes: string[];
  };
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

const AI_MODES = [
  { value: "summary", label: "Summary" },
  { value: "explain", label: "Explain" },
  { value: "tests", label: "Tests" },
  { value: "review", label: "Review" },
];

export default function SettingsPage() {
  const [data, setData] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [orgName, setOrgName] = useState("");
  const [userName, setUserName] = useState("");
  const [defaultAiMode, setDefaultAiMode] = useState("mock");
  const [defaultDuration, setDefaultDuration] = useState(45);
  const [autoGrade, setAutoGrade] = useState(true);
  const [allowedModes, setAllowedModes] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: Settings) => {
        setData(d);
        setOrgName(d.org.name);
        setUserName(d.user.name);
        setDefaultAiMode(d.org.defaultAiMode);
        setDefaultDuration(d.org.defaultDurationMin);
        setAutoGrade(d.org.autoGradeEnabled);
        setAllowedModes(
          Array.isArray(d.org.allowedAiModes) ? d.org.allowedAiModes : JSON.parse(String(d.org.allowedAiModes)),
        );
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          userName,
          defaultAiMode,
          defaultDurationMin: defaultDuration,
          autoGradeEnabled: autoGrade,
          allowedAiModes: allowedModes,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
    setSaving(false);
  }

  function toggleMode(mode: string) {
    setAllowedModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode],
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="font-display text-xl font-semibold mb-6" style={{ color: "var(--text-primary)" }}>Settings</h1>
        <div className="space-y-4 max-w-lg">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--bg-surface)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;
  const isAdmin = data.user.role === "owner" || data.user.role === "admin";

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Settings</h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            Organization and account configuration.
          </p>
        </div>
        {saved && (
          <span className="chip chip-green">Saved</span>
        )}
      </div>

      {error && <div className="action-status error mb-4">{error}</div>}

      <div className="space-y-8">
        {/* ── Account section ── */}
        <Section title="Account">
          <Field label="Email">
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{data.user.email}</div>
          </Field>
          <Field label="Your Name">
            <input
              type="text"
              className="input-field"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name"
            />
          </Field>
          <Field label="Role">
            <span className="chip chip-muted capitalize">{data.user.role}</span>
          </Field>
        </Section>

        {/* ── Organization section ── */}
        <Section title="Organization">
          <Field label="Organization Name">
            <input
              type="text"
              className="input-field"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={!isAdmin}
              placeholder="My Company"
            />
          </Field>
        </Section>

        {/* ── Interview defaults section ── */}
        <Section title="Interview Defaults">
          <Field label="Default AI Mode" hint="Controls whether the AI copilot uses real Claude API or mock responses.">
            <div className="flex gap-2">
              {["mock", "real"].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`chip cursor-pointer ${defaultAiMode === m ? "chip-blue" : "chip-muted"}`}
                  onClick={() => isAdmin && setDefaultAiMode(m)}
                  style={!isAdmin ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                >
                  {m === "mock" ? "Mock" : "Real (Claude)"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Default Session Duration">
            <select
              className="input-field"
              value={defaultDuration}
              onChange={(e) => setDefaultDuration(Number(e.target.value))}
              disabled={!isAdmin}
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </Field>

          <Field label="Allowed AI Modes" hint="Candidates can only use these AI modes during interviews.">
            <div className="flex flex-wrap gap-2">
              {AI_MODES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`chip cursor-pointer ${allowedModes.includes(value) ? "chip-blue" : "chip-muted"}`}
                  onClick={() => isAdmin && toggleMode(value)}
                  style={!isAdmin ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* ── AI Grading section ── */}
        <Section title="AI Grading">
          <Field label="Auto-grade sessions" hint="Automatically run AI assessment when a candidate completes their session.">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoGrade}
                onChange={(e) => isAdmin && setAutoGrade(e.target.checked)}
                disabled={!isAdmin}
                className="accent-[var(--accent-blue)]"
              />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {autoGrade ? "Enabled — sessions are auto-graded on completion" : "Disabled — manual grading only"}
              </span>
            </label>
          </Field>
        </Section>

        {/* Save button */}
        <div className="pt-2">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </button>
          {!isAdmin && (
            <p className="text-[10px] mt-2" style={{ color: "var(--text-tertiary)" }}>
              Some settings can only be changed by organization admins.
            </p>
          )}
        </div>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 13px;
          background: var(--bg-inset);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          outline: none;
        }
        .input-field:focus {
          border-color: var(--border-focus);
        }
        .input-field:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="section-header">{title}</h2>
      <div className="rounded-xl p-5 space-y-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{label}</div>
      {hint && <p className="text-[10px] mb-2" style={{ color: "var(--text-tertiary)" }}>{hint}</p>}
      {children}
    </div>
  );
}
