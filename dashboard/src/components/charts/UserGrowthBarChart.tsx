import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyMetrics } from "../../types";

interface Props {
  data: MonthlyMetrics[];
}

export function UserGrowthBarChart({ data }: Props) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">User Growth by Plan</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="freeUsers" name="Free" fill="#93c5fd" radius={[4, 4, 0, 0]} />
          <Bar dataKey="proUsers" name="Pro" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar
            dataKey="enterpriseUsers"
            name="Enterprise"
            fill="#312e81"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
