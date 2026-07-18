import type { Icon } from "@phosphor-icons/react";
import { MeterBar } from "@/shared/components/data-viz/meter-bar";
import { Card, CardContent } from "@/shared/components/ui/card";

type KpiCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: Icon;
  /** CSS color value, e.g. "var(--chart-1)" — drives the icon badge and meter fill. */
  color: string;
  meter?: { value: number; max: number };
};

export function KpiCard({ label, value, hint, icon: IconComponent, color, meter }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold tabular-nums">{value}</p>
          </div>
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)`, color }}
          >
            <IconComponent className="size-5" weight="fill" />
          </span>
        </div>
        {meter ? <MeterBar value={meter.value} max={meter.max} color={color} /> : null}
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
