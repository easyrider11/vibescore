import type { MonthlyMetrics, DateRange, Tier } from "../types";

// --- Date range filtering ---

export function sliceByDateRange(
  data: MonthlyMetrics[],
  range: DateRange
): MonthlyMetrics[] {
  if (range === "all") return data;
  const months = range === "3m" ? 3 : 6;
  return data.slice(-months);
}

// --- Tier-aware helpers ---

export function tierUserCount(m: MonthlyMetrics, tier: Tier): number {
  if (tier === "free") return m.freeUsers;
  if (tier === "pro") return m.proUsers;
  if (tier === "enterprise") return m.enterpriseUsers;
  return m.freeUsers + m.proUsers + m.enterpriseUsers;
}

/** Approximate revenue attribution: pro and enterprise generate revenue */
const REVENUE_WEIGHTS = { free: 0, pro: 0.35, enterprise: 0.65 } as const;

export function tierRevenue(m: MonthlyMetrics, tier: Tier): number {
  if (tier === "all") return m.revenue;
  return Math.round(m.revenue * REVENUE_WEIGHTS[tier]);
}

// --- Subscription breakdown for donut chart ---

export interface SubscriptionSlice {
  name: string;
  value: number;
}

export function subscriptionBreakdown(
  data: MonthlyMetrics[],
  tier: Tier
): SubscriptionSlice[] {
  const latest = data[data.length - 1];
  if (tier === "all") {
    return [
      { name: "Free", value: latest.freeUsers },
      { name: "Pro", value: latest.proUsers },
      { name: "Enterprise", value: latest.enterpriseUsers },
    ];
  }
  // Single-tier view: show that tier's count across first and last month
  return [
    { name: data[0].month, value: tierUserCount(data[0], tier) },
    { name: latest.month, value: tierUserCount(latest, tier) },
  ];
}

// --- KPI computations ---

export function totalRevenue(data: MonthlyMetrics[], tier: Tier = "all"): number {
  return data.reduce((sum, m) => sum + tierRevenue(m, tier), 0);
}

export function totalSignups(data: MonthlyMetrics[]): number {
  return data.reduce((sum, m) => sum + m.signups, 0);
}

export function latestActiveUsers(data: MonthlyMetrics[]): number {
  return data[data.length - 1].activeUsers;
}

export function latestTierUsers(data: MonthlyMetrics[], tier: Tier): number {
  return tierUserCount(data[data.length - 1], tier);
}

export function averageConversionRate(data: MonthlyMetrics[]): number {
  const avg = data.reduce((sum, m) => sum + m.conversionRate, 0) / data.length;
  return Math.round(avg * 10) / 10;
}

// --- Trend: compare last month vs previous month in dataset ---

export interface Trend {
  direction: "up" | "down" | "flat";
  percent: number;
}

export function computeTrend(current: number, previous: number): Trend {
  if (previous === 0) return { direction: "flat", percent: 0 };
  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(Math.abs(change) * 10) / 10;
  if (Math.abs(change) < 0.1) return { direction: "flat", percent: 0 };
  return { direction: change > 0 ? "up" : "down", percent: rounded };
}

// --- Formatters ---

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}
