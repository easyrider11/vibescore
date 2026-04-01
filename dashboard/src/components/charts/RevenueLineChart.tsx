import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyMetrics } from "../../types";

interface Props {
  data: MonthlyMetrics[];
}

export function RevenueLineChart({ data }: Props) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#6366f1" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
