"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AppointmentsTrendPoint } from "@/app/(dashboard)/dashboard/queries";

const dayFormatter = new Intl.DateTimeFormat("es-ES", { weekday: "short" });

type ChartPoint = { label: string; count: number };

function formatLabel(dateStr: string) {
  const label = dayFormatter.format(new Date(`${dateStr}T00:00:00`));
  return label.charAt(0).toUpperCase() + label.slice(1, 3);
}

export function AppointmentsTrendChart({ data }: { data: AppointmentsTrendPoint[] }) {
  const chartData: ChartPoint[] = data.map((d) => ({
    label: formatLabel(d.date),
    count: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          width={30}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
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
          labelStyle={{ color: "var(--muted-foreground)", marginBottom: 2 }}
          formatter={(value) => [String(value), "Citas"]}
        />
        <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
