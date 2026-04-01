import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { MonthlyMetrics, Tier } from "../../types";
import { subscriptionBreakdown } from "../../utils/dashboard";

interface Props {
  data: MonthlyMetrics[];
  tier: Tier;
}

const ALL_COLORS = ["#93c5fd", "#6366f1", "#312e81"];
const TIER_COLORS = ["#c7d2fe", "#6366f1"]; // start vs current

export function SubscriptionDonutChart({ data, tier }: Props) {
  const slices = subscriptionBreakdown(data, tier);
  const colors = tier === "all" ? ALL_COLORS : TIER_COLORS;
  const title =
    tier === "all"
      ? "Subscription Breakdown"
      : `${tier.charAt(0).toUpperCase() + tier.slice(1)} Users — Start vs Now`;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={slices}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={3}
            dataKey="value"
          >
            {slices.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => Number(value).toLocaleString()} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
