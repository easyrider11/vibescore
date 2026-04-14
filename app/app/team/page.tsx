"use client";

import { useEffect, useState } from "react";

interface Member {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

interface TeamData {
  members: Member[];
  invites: Invite[];
  currentUserId: string;
  orgName: string;
}

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  async function loadTeam() {
    try {
      const res = await fetch("/api/team");
      const d = await res.json();
      setData(d);
    } catch {
      setError("Failed to load team");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTeam(); }, []);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError("");
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setInviteEmail("");
      showSuccess(`Invite sent to ${inviteEmail}`);
      loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite");
    }
    setInviting(false);
  }

  async function handleRoleChange(memberId: string, role: string) {
    setError("");
    try {
      const res = await fetch("/api/team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error);
      }
      showSuccess("Role updated");
      loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  async function handleRemove(memberId: string, email: string) {
    if (!confirm(`Remove ${email} from the team?`)) return;
    setError("");
    try {
      const res = await fetch(`/api/team?memberId=${memberId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error);
      }
      showSuccess(`${email} removed`);
      loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  }

  async function handleCancelInvite(inviteId: string) {
    setError("");
    try {
      const res = await fetch(`/api/team?inviteId=${inviteId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error);
      }
      showSuccess("Invite cancelled");
      loadTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel invite");
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="font-display text-xl font-semibold mb-6" style={{ color: "var(--text-primary)" }}>Team</h1>
        <div className="space-y-3 max-w-2xl">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "var(--bg-surface)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const currentUser = data.members.find((m) => m.id === data.currentUserId);
  const isOwner = currentUser?.role === "owner";
  const isAdmin = isOwner || currentUser?.role === "admin";

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Team</h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
          Manage members of {data.orgName}.
        </p>
      </div>

      {error && <div className="action-status error mb-4">{error}</div>}
      {success && <div className="mb-4"><span className="chip chip-green">{success}</span></div>}

      {/* Invite form */}
      {isAdmin && (
        <form onSubmit={handleInvite} className="mb-8">
          <h2 className="section-header">Invite Member</h2>
          <div
            className="rounded-xl p-5 flex gap-3 items-end flex-wrap"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-primary)" }}>
                Email
              </label>
              <input
                type="email"
                className="input-field"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
              />
            </div>
            <div className="w-32">
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: "var(--text-primary)" }}>
                Role
              </label>
              <select
                className="input-field"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button className="btn btn-primary text-xs" type="submit" disabled={inviting}>
              {inviting ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      )}

      {/* Members list */}
      <h2 className="section-header">
        Members
        <span className="text-[10px] font-normal ml-2" style={{ color: "var(--text-tertiary)" }}>
          {data.members.length}
        </span>
      </h2>
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
      >
        {data.members.map((member, i) => {
          const isMe = member.id === data.currentUserId;
          return (
            <div
              key={member.id}
              className="flex items-center gap-3 px-5 py-3"
              style={i > 0 ? { borderTop: "1px solid var(--border-default)" } : {}}
            >
              {/* Avatar */}
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))" }}
              >
                {(member.name || member.email)[0]?.toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {member.name || member.email}
                  </span>
                  {isMe && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "var(--bg-inset)", color: "var(--text-tertiary)" }}>
                      you
                    </span>
                  )}
                </div>
                {member.name && (
                  <div className="text-[10px] truncate" style={{ color: "var(--text-tertiary)" }}>
                    {member.email}
                  </div>
                )}
              </div>

              {/* Role */}
              <div className="flex items-center gap-2">
                {isOwner && !isMe && member.role !== "owner" ? (
                  <select
                    className="text-[10px] rounded px-2 py-1"
                    style={{
                      background: "var(--bg-inset)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-secondary)",
                    }}
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className={`chip ${member.role === "owner" ? "chip-blue" : "chip-muted"} text-[9px]`}>
                    {member.role}
                  </span>
                )}

                {/* Remove button */}
                {isAdmin && !isMe && member.role !== "owner" && (
                  <button
                    className="text-[10px] px-2 py-1 rounded transition-colors"
                    style={{ color: "var(--accent-red)" }}
                    onClick={() => handleRemove(member.id, member.email)}
                    title="Remove member"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending invites */}
      {data.invites.length > 0 && (
        <>
          <h2 className="section-header mt-8">
            Pending Invites
            <span className="text-[10px] font-normal ml-2" style={{ color: "var(--text-tertiary)" }}>
              {data.invites.length}
            </span>
          </h2>
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
          >
            {data.invites.map((invite, i) => (
              <div
                key={invite.id}
                className="flex items-center gap-3 px-5 py-3"
                style={i > 0 ? { borderTop: "1px solid var(--border-default)" } : {}}
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={{ background: "var(--bg-inset)", color: "var(--text-tertiary)" }}
                >
                  ?
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                    {invite.email}
                  </div>
                  <div className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    Expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                <span className="chip chip-muted text-[9px]">{invite.role}</span>
                {isAdmin && (
                  <button
                    className="text-[10px] px-2 py-1 rounded"
                    style={{ color: "var(--accent-red)" }}
                    onClick={() => handleCancelInvite(invite.id)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

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
      `}</style>
    </div>
  );
}
