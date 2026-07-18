"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DiagnosisCount } from "@/features/reports/queries/reports.queries";

function truncate(text: string, max = 28) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function TopDiagnosesChart({ data }: { data: DiagnosisCount[] }) {
  const chartData = [...data].reverse().map((d) => ({
    label: truncate(d.description),
    fullLabel: d.description,
    code: d.code,
    count: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis
          type="number"
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          type="category"
          dataKey="label"
          axisLine={false}
          tickLine={false}
          width={160}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            fontSize: 12,
            color: "var(--popover-foreground)",
          }}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel ?? ""}
          formatter={(value) => [String(value), "Casos"]}
        />
        <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
