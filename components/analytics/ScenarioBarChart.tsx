"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ScenarioPoint {
  title: string;
  count: number;
  completed: number;
}

interface Props {
  data: ScenarioPoint[];
}

export function ScenarioBarChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div
        className="flex h-[240px] items-center justify-center text-xs"
        style={{ color: "var(--text-tertiary)" }}
      >
        No scenario activity yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false} />
        <XAxis
          dataKey="title"
          tick={{ fontSize: 11, fill: "#8b949e" }}
          axisLine={{ stroke: "#1e2535" }}
          tickLine={false}
          interval={0}
          angle={0}
          height={40}
          tickFormatter={(v: string) => (v.length > 14 ? `${v.slice(0, 14)}…` : v)}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#8b949e" }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip
          contentStyle={{
            background: "#161b22",
            border: "1px solid #2a3142",
            borderRadius: 8,
            fontSize: 12,
            color: "#e6edf3",
          }}
          cursor={{ fill: "rgba(59,130,246,0.08)" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#8b949e" }}
          iconType="circle"
          iconSize={8}
        />
        <Bar dataKey="count" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="completed" name="Completed" fill="#3fb950" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
