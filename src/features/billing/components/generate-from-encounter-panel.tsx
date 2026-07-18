"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Receipt } from "@phosphor-icons/react";
import { toast } from "sonner";
import { generateInvoiceFromEncounter } from "@/features/billing/actions/billing.actions";
import { useBillableEncounters } from "@/features/billing/hooks/use-billing";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { formatDateTime } from "@/shared/utils/format";

export function GenerateFromEncounterPanel() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const debounced = useDebounce(search);
  const { data: encounters = [], isLoading } = useBillableEncounters(debounced);

  function generate(encounterId: string) {
    setGeneratingId(encounterId);
    startTransition(async () => {
      const result = await generateInvoiceFromEncounter({ encounterId });
      if (!result.success) {
        toast.error(result.error);
        setGeneratingId(null);
        return;
      }
      toast.success("Factura generada");
      router.push(`/billing/${result.data.id}`);
    });
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar paciente por nombre o MRN..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {!isLoading && encounters.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No hay consultas pendientes de facturar"
          description="Todas las consultas cerradas ya tienen una factura asociada"
        />
      ) : (
        <div className="space-y-3">
          {encounters.map((encounter) => (
            <Card key={encounter.id}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    {encounter.patient.firstName} {encounter.patient.lastName}{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      {encounter.patient.mrn}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">{encounter.chiefComplaint}</p>
                  <p className="text-xs text-muted-foreground">
                    {encounter.doctor.firstName} {encounter.doctor.lastName} ·{" "}
                    {formatDateTime(encounter.createdAt)}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => generate(encounter.id)}
                  disabled={isPending && generatingId === encounter.id}
                >
                  <Receipt />{" "}
                  {isPending && generatingId === encounter.id ? "Generando..." : "Generar factura"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
