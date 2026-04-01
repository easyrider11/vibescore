export interface MonthlyMetrics {
  month: string;
  revenue: number;
  signups: number;
  freeUsers: number;
  proUsers: number;
  enterpriseUsers: number;
  activeUsers: number;
  conversionRate: number;
}

export type DateRange = "all" | "6m" | "3m";

export type Tier = "all" | "free" | "pro" | "enterprise";
