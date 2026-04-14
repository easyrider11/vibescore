"use client";

import { useEffect, useState } from "react";

interface Plan {
  name: string;
  sessionsPerMonth: number;
  features: string[];
  priceMonthly: number;
  stripePriceId: string | null;
}

interface BillingData {
  plan: string;
  planName: string;
  sessionsUsed: number;
  sessionsLimit: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canCreateSession: boolean;
  plans: Record<string, Plan>;
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/billing")
      .then((r) => r.json())
      .then((d: BillingData) => setData(d))
      .catch(() => setError("Failed to load billing info"))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(planKey: string) {
    setActionLoading(planKey);
    setError("");
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout", plan: planKey }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to create checkout");
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upgrade failed");
      setActionLoading(null);
    }
  }

  async function handleManage() {
    setActionLoading("portal");
    setError("");
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "portal" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to open portal");
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open billing portal");
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="font-display text-xl font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
          Billing
        </h1>
        <div className="space-y-4 max-w-4xl">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl animate-pulse" style={{ background: "var(--bg-surface)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const plans = data.plans;
  const usagePercent = data.sessionsLimit > 0 ? Math.min(100, (data.sessionsUsed / data.sessionsLimit) * 100) : 0;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Billing
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
          Manage your subscription and usage.
        </p>
      </div>

      {error && <div className="action-status error mb-4">{error}</div>}

      {/* Current plan & usage */}
      <div
        className="rounded-xl p-6 mb-8"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {data.planName} Plan
              </h2>
              {data.subscriptionStatus === "active" && (
                <span className="chip chip-green">Active</span>
              )}
              {data.subscriptionStatus === "past_due" && (
                <span className="chip chip-orange">Past Due</span>
              )}
              {data.cancelAtPeriodEnd && (
                <span className="chip chip-orange">Cancels at period end</span>
              )}
              {!data.subscriptionStatus && data.plan === "free" && (
                <span className="chip chip-muted">Free</span>
              )}
            </div>
            {data.currentPeriodEnd && (
              <p className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                Current period ends {new Date(data.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          {data.stripeSubscriptionId && (
            <button
              className="btn btn-secondary text-xs"
              onClick={handleManage}
              disabled={actionLoading === "portal"}
            >
              {actionLoading === "portal" ? "Opening..." : "Manage Subscription"}
            </button>
          )}
        </div>

        {/* Usage bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Sessions this month
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
              {data.sessionsUsed} / {data.sessionsLimit === -1 ? "∞" : data.sessionsLimit}
            </span>
          </div>
          {data.sessionsLimit > 0 && (
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-inset)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${usagePercent}%`,
                  background:
                    usagePercent > 90
                      ? "var(--accent-red)"
                      : usagePercent > 70
                        ? "var(--accent-orange)"
                        : "var(--accent-blue)",
                }}
              />
            </div>
          )}
          {!data.canCreateSession && (
            <p className="text-[10px] mt-2" style={{ color: "var(--accent-red)" }}>
              You&apos;ve reached your session limit. Upgrade to create more sessions.
            </p>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <h2 className="section-header">Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(plans) as [string, Plan][]).map(([key, plan]) => {
          const isCurrent = data.plan === key;
          const isUpgrade = getPlanRank(key) > getPlanRank(data.plan);

          return (
            <div
              key={key}
              className="rounded-xl p-5 flex flex-col"
              style={{
                background: "var(--bg-surface)",
                border: isCurrent
                  ? "2px solid var(--accent-blue)"
                  : "1px solid var(--border-default)",
              }}
            >
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {plan.name}
                  </h3>
                  {isCurrent && <span className="chip chip-blue text-[9px]">Current</span>}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                    ${plan.priceMonthly}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                    /month
                  </span>
                </div>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--accent-green)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <div>
                {isCurrent ? (
                  <button className="btn btn-secondary w-full text-xs" disabled>
                    Current Plan
                  </button>
                ) : isUpgrade ? (
                  <button
                    className="btn btn-primary w-full text-xs"
                    onClick={() => handleUpgrade(key)}
                    disabled={actionLoading === key || !plan.stripePriceId}
                  >
                    {actionLoading === key
                      ? "Redirecting..."
                      : !plan.stripePriceId
                        ? "Contact Sales"
                        : `Upgrade to ${plan.name}`}
                  </button>
                ) : (
                  <button className="btn btn-secondary w-full text-xs opacity-50" disabled>
                    Downgrade via portal
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .btn-secondary {
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          background: var(--bg-inset);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-secondary:hover:not(:disabled) {
          border-color: var(--border-focus);
          color: var(--text-primary);
        }
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

function getPlanRank(plan: string): number {
  const ranks: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };
  return ranks[plan] ?? 0;
}
