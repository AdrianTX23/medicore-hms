"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { ArrowCounterClockwise, Warning } from "@phosphor-icons/react";
import { MediCoreMark } from "@/shared/components/brand/medicore-mark";
import { Button } from "@/shared/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root]", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <MediCoreMark className="h-9 w-auto" />
      <div className="space-y-2">
        <Warning className="mx-auto size-10 text-status-critical" weight="thin" />
        <p className="font-medium">Algo salió mal</p>
        <p className="text-sm text-muted-foreground">
          Ocurrió un error inesperado. Puedes intentarlo de nuevo.
        </p>
      </div>
      <Button onClick={reset}>
        <ArrowCounterClockwise /> Reintentar
      </Button>
    </div>
  );
}
