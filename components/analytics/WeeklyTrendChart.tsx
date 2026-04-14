"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WeekPoint {
  week: string;
  count: number;
  completed: number;
}

interface Props {
  data: WeekPoint[];
}

export function WeeklyTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="completedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3fb950" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3fb950" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 11, fill: "#8b949e" }}
          axisLine={{ stroke: "#1e2535" }}
          tickLine={false}
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
          labelStyle={{ color: "#8b949e" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#8b949e" }}
          iconType="circle"
          iconSize={8}
        />
        <Area
          type="monotone"
          dataKey="count"
          name="Sessions created"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#sessionsFill)"
        />
        <Area
          type="monotone"
          dataKey="completed"
          name="Completed"
          stroke="#3fb950"
          strokeWidth={2}
          fill="url(#completedFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
