import type { Trend } from "../utils/dashboard";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: Trend;
}

export function KpiCard({ title, value, subtitle, trend }: KpiCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-3xl font-semibold text-gray-900">{value}</p>
        {trend && trend.direction !== "flat" && (
          <span
            className={`text-sm font-medium ${
              trend.direction === "up" ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {trend.direction === "up" ? "\u2191" : "\u2193"} {trend.percent}%
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-sm text-gray-400">{subtitle}</p>}
    </div>
  );
}
