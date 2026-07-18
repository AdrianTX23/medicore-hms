"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";
import { dispensePrescription } from "@/features/pharmacy/actions/pharmacy.actions";
import type { PendingPrescriptionItem } from "@/features/pharmacy/queries/pharmacy.queries";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { formatDateTime } from "@/shared/utils/format";

export function PendingPrescriptionsList({
  prescriptions,
  canDispense,
}: {
  prescriptions: PendingPrescriptionItem[];
  canDispense: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function dispense(prescriptionId: string) {
    startTransition(async () => {
      const result = await dispensePrescription({ prescriptionId });
      if (result.success) toast.success("Receta dispensada");
      else toast.error(result.error);
      router.refresh();
    });
  }

  if (prescriptions.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle}
        title="No hay recetas pendientes"
        description="Todas las recetas activas han sido dispensadas"
      />
    );
  }

  return (
    <div className="space-y-4">
      {prescriptions.map((p) => (
        <Card key={p.id}>
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  {p.patient.firstName} {p.patient.lastName}
                </span>
                <Badge variant="secondary" className="font-mono">
                  {p.patient.mrn}
                </Badge>
                {p.patient.allergies.map((a) => (
                  <Badge key={a} variant="destructive" className="gap-1">
                    <Warning className="size-3" /> {a}
                  </Badge>
                ))}
              </div>
              <ul className="space-y-1 text-sm">
                {p.items.map((item) => (
                  <li key={item.id}>
                    <span className="font-medium">
                      {item.medication.name} {item.medication.strength ?? ""}
                    </span>{" "}
                    — {item.dosage}, {item.frequency}, {item.durationDays} días
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                {p.doctor.firstName} {p.doctor.lastName} · {formatDateTime(p.createdAt)}
              </p>
            </div>
            {canDispense ? (
              <Button size="sm" onClick={() => dispense(p.id)} disabled={isPending}>
                <CheckCircle /> Dispensar
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
