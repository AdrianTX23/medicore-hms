"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { ArrowCounterClockwise, House, Warning } from "@phosphor-icons/react";
import { Button } from "@/shared/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-24 text-center">
      <Warning className="size-10 text-status-critical" weight="thin" />
      <div className="space-y-1">
        <p className="font-medium">Algo salió mal</p>
        <p className="text-sm text-muted-foreground">
          No pudimos completar esta acción. Puedes intentarlo de nuevo o volver al panel.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={reset}>
          <ArrowCounterClockwise /> Reintentar
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            <House /> Ir al panel
          </Link>
        </Button>
      </div>
    </div>
  );
}
