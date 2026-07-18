import { cn } from "@/shared/utils/cn";

type MeterBarProps = {
  value: number;
  max: number;
  className?: string;
  /** CSS color value (e.g. "var(--chart-5)") for the filled portion. */
  color?: string;
};

/** A slim ratio meter — for a single value/total pair, not a full chart. */
export function MeterBar({ value, max, className, color = "var(--chart-1)" }: MeterBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className="h-full rounded-full transition-[width]"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
