"use client";

import { useEffect, useState } from "react";
import { Clock } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";

const timeFormatter = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Live clock + date widget. Renders nothing until mounted to avoid an SSR/CSR time mismatch. */
export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <div className={cn("h-[46px] w-40", className)} aria-hidden="true" />;
  }

  const dateLabel = dateFormatter.format(now);

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 px-3.5 py-2 backdrop-blur-sm",
        className,
      )}
    >
      <Clock className="size-4 shrink-0 text-primary-foreground/70" weight="fill" />
      <div className="leading-tight">
        <p className="font-mono text-sm font-semibold tabular-nums">
          {timeFormatter.format(now)}
        </p>
        <p className="text-[11px] whitespace-nowrap text-primary-foreground/70">{dateLabel}</p>
      </div>
    </div>
  );
}
