import { useState, useMemo, useEffect } from "react";
import { monthlyData } from "./data/mockData";
import type { DateRange, Tier } from "./types";
import {
  sliceByDateRange,
  totalRevenue,
  totalSignups,
  latestActiveUsers,
  latestTierUsers,
  averageConversionRate,
  computeTrend,
  tierRevenue,
  formatCurrency,
  formatNumber,
} from "./utils/dashboard";
import { KpiCard } from "./components/KpiCard";
import { FilterBar } from "./components/FilterBar";
import { RevenueLineChart } from "./components/charts/RevenueLineChart";
import { UserGrowthBarChart } from "./components/charts/UserGrowthBarChart";
import { SubscriptionDonutChart } from "./components/charts/SubscriptionDonutChart";
import { ConversionChart } from "./components/charts/ConversionChart";
import { DashboardSkeleton } from "./components/Skeleton";
import { ErrorState } from "./components/ErrorState";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [tier, setTier] = useState<Tier>("all");

  useEffect(() => {
    const delay = 800 + Math.random() * 400;
    const id = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(id);
  }, []);

  const filteredData = useMemo(
    () => sliceByDateRange(monthlyData, dateRange),
    [dateRange]
  );

  // KPI values
  const revenueKpi = totalRevenue(filteredData, tier);
  const usersKpi =
    tier === "all"
      ? latestActiveUsers(filteredData)
      : latestTierUsers(filteredData, tier);
  const usersLabel = tier === "all" ? "Active Users" : `${capitalize(tier)} Users`;

  // Trends: compare last two months in the filtered range
  const trends = useMemo(() => {
    if (filteredData.length < 2) return null;
    const curr = filteredData[filteredData.length - 1];
    const prev = filteredData[filteredData.length - 2];
    return {
      revenue: computeTrend(tierRevenue(curr, tier), tierRevenue(prev, tier)),
      signups: computeTrend(curr.signups, prev.signups),
      users: computeTrend(
        tier === "all"
          ? curr.activeUsers
          : latestTierUsers([prev, curr], tier),
        tier === "all"
          ? prev.activeUsers
          : latestTierUsers([prev], tier)
      ),
      conversion: computeTrend(curr.conversionRate, prev.conversionRate),
    };
  }, [filteredData, tier]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => setError(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-5 sm:py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              SaaS performance overview &mdash; {filteredData[0].month} to{" "}
              {filteredData[filteredData.length - 1].month}
            </p>
          </div>
          <button
            onClick={() =>
              setError(
                "Failed to fetch analytics data. The upstream metrics service is unavailable. Please try again."
              )
            }
            className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-400 transition-colors hover:border-red-300 hover:text-red-500"
          >
            Simulate Error
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <FilterBar
          dateRange={dateRange}
          tier={tier}
          onDateRangeChange={setDateRange}
          onTierChange={setTier}
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Revenue"
            value={formatCurrency(revenueKpi)}
            subtitle={tier === "all" ? "All plans" : `${capitalize(tier)} plan share`}
            trend={trends?.revenue}
          />
          <KpiCard
            title="Total Signups"
            value={formatNumber(totalSignups(filteredData))}
            subtitle="New user registrations"
            trend={trends?.signups}
          />
          <KpiCard
            title={usersLabel}
            value={formatNumber(usersKpi)}
            subtitle="Latest month in range"
            trend={trends?.users}
          />
          <KpiCard
            title="Avg Conversion Rate"
            value={`${averageConversionRate(filteredData)}%`}
            subtitle="Free to paid"
            trend={trends?.conversion}
          />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RevenueLineChart data={filteredData} />
          <UserGrowthBarChart data={filteredData} />
          <SubscriptionDonutChart data={filteredData} tier={tier} />
          <ConversionChart data={filteredData} />
        </section>
      </main>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
