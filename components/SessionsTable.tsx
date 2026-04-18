"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface SessionRow {
  id: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  scenarioTitle: string;
  scenarioSlug: string;
  status: string;
  publicToken: string;
  durationMinutes: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  score: string | null;
  decision: string | null;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "rgba(59,130,246,0.15)", text: "var(--accent-blue)" },
  active: { bg: "rgba(63,185,80,0.15)", text: "var(--status-active)" },
  completed: { bg: "rgba(125,133,144,0.15)", text: "var(--text-tertiary)" },
  cancelled: { bg: "rgba(248,81,73,0.15)", text: "var(--status-error)" },
};

const decisionColors: Record<string, { bg: string; text: string }> = {
  "Strong Hire": { bg: "rgba(63,185,80,0.2)", text: "var(--accent-green)" },
  Hire: { bg: "rgba(63,185,80,0.1)", text: "var(--accent-green)" },
  "No Hire": { bg: "rgba(248,81,73,0.1)", text: "var(--accent-orange)" },
  "Strong No Hire": { bg: "rgba(248,81,73,0.2)", text: "var(--status-error)" },
};

export function SessionsTable({ sessions }: { sessions: SessionRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.candidateName.toLowerCase().includes(q) ||
          s.candidateEmail.toLowerCase().includes(q) ||
          s.scenarioTitle.toLowerCase().includes(q) ||
          s.position.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sessions, search, statusFilter]);

  function copyLink(token: string) {
    const url = `${window.location.origin}/s/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search candidates, templates..."
          className="flex-1 max-w-sm rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {filtered.length} session{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Candidate</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Position</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Template</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Decision</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center" style={{ color: "var(--text-tertiary)" }}>
                  {sessions.length === 0
                    ? "No sessions yet. Create one to get started."
                    : "No sessions match your filters."}
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const sc = statusColors[s.status] || statusColors.pending;
                const dc = s.decision ? decisionColors[s.decision] : null;
                return (
                  <tr
                    key={s.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: "1px solid var(--border-default)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => router.push(`/app/sessions/${s.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: "var(--text-primary)" }}>{s.candidateName}</div>
                      {s.candidateEmail && (
                        <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{s.candidateEmail}</div>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                      {s.position || "-"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                      {s.scenarioTitle}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ background: sc.bg, color: sc.text }}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {dc ? (
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ background: dc.bg, color: dc.text }}
                        >
                          {s.decision}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-tertiary)" }}>-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {formatDate(s.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => copyLink(s.publicToken)}
                          className="rounded px-2 py-1 text-xs font-medium transition-colors"
                          style={{
                            background: copiedToken === s.publicToken ? "rgba(63,185,80,0.15)" : "var(--bg-surface-alt)",
                            color: copiedToken === s.publicToken ? "var(--accent-green)" : "var(--text-secondary)",
                            border: "1px solid var(--border-default)",
                          }}
                        >
                          {copiedToken === s.publicToken ? "Copied!" : "Copy Link"}
                        </button>
                        {s.status === "active" && (
                          <button
                            onClick={() => router.push(`/app/sessions/${s.id}/live`)}
                            className="rounded px-2 py-1 text-xs font-medium"
                            style={{ background: "rgba(63,185,80,0.15)", color: "var(--accent-green)" }}
                          >
                            Live
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
