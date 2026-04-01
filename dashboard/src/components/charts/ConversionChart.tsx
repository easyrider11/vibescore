import {
  BarChart,
  Bar,
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

export function ConversionChart({ data }: Props) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Conversion Rate</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis
            domain={[10, 15]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip formatter={(value) => [`${value}%`, "Conversion Rate"]} />
          <Bar
            dataKey="conversionRate"
            name="Conversion Rate"
            fill="#818cf8"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
