"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Prohibit, TestTube } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  cancelLabOrder,
  collectSample,
  completeLabOrder,
  startProcessing,
  validateLabOrder,
} from "@/features/laboratory/actions/lab.actions";
import type { LabOrderDetail } from "@/features/laboratory/queries/lab.queries";
import { Button } from "@/shared/components/ui/button";

type LabOrderActionsProps = {
  order: Pick<LabOrderDetail, "id" | "status">;
  canManage: boolean;
  canValidate: boolean;
};

export function LabOrderActions({ order, canManage, canValidate }: LabOrderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.success) router.refresh();
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canManage && order.status === "ORDERED" ? (
        <Button size="sm" onClick={() => run(() => collectSample({ labOrderId: order.id }))} disabled={isPending}>
          <TestTube /> Muestra tomada
        </Button>
      ) : null}
      {canManage && order.status === "SAMPLE_COLLECTED" ? (
        <Button size="sm" onClick={() => run(() => startProcessing({ labOrderId: order.id }))} disabled={isPending}>
          Iniciar procesamiento
        </Button>
      ) : null}
      {canManage && order.status === "IN_PROGRESS" ? (
        <Button size="sm" onClick={() => run(() => completeLabOrder({ labOrderId: order.id }))} disabled={isPending}>
          <CheckCircle /> Completar orden
        </Button>
      ) : null}
      {canValidate && order.status === "COMPLETED" ? (
        <Button size="sm" onClick={() => run(() => validateLabOrder({ labOrderId: order.id }))} disabled={isPending}>
          <CheckCircle /> Validar resultados
        </Button>
      ) : null}
      {canManage && order.status !== "VALIDATED" && order.status !== "CANCELLED" ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => run(() => cancelLabOrder({ labOrderId: order.id }))}
          disabled={isPending}
        >
          <Prohibit /> Cancelar orden
        </Button>
      ) : null}
    </div>
  );
}
