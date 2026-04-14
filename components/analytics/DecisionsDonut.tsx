"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: Slice[];
}

export function DecisionsDonut({ data }: Props) {
  const total = data.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <div
        className="flex h-[240px] items-center justify-center text-xs"
        style={{ color: "var(--text-tertiary)" }}
      >
        No evaluations submitted yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={90}
          paddingAngle={3}
          stroke="#0e1117"
          strokeWidth={2}
        >
          {data.map((slice) => (
            <Cell key={slice.key} fill={slice.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#161b22",
            border: "1px solid #2a3142",
            borderRadius: 8,
            fontSize: 12,
            color: "#e6edf3",
          }}
          formatter={(value) => [Number(value), "count"]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "#8b949e" }}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
