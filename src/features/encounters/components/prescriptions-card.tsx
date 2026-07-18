"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pill, Plus, Prohibit, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  cancelPrescription,
  createPrescription,
} from "@/features/encounters/actions/encounter.actions";
import { useMedications } from "@/features/encounters/hooks/use-encounters";
import type { EncounterDetail } from "@/features/encounters/queries/encounter.queries";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

type ItemDraft = {
  medicationId: string;
  dosage: string;
  frequency: string;
  durationDays: string;
};

const EMPTY_ITEM: ItemDraft = { medicationId: "", dosage: "", frequency: "", durationDays: "7" };

const PRESCRIPTION_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ACTIVE: { label: "Activa", variant: "default" },
  DISPENSED: { label: "Dispensada", variant: "outline" },
  CANCELLED: { label: "Anulada", variant: "destructive" },
};

type PrescriptionsCardProps = {
  encounterId: string;
  prescriptions: EncounterDetail["prescriptions"];
  canPrescribe: boolean;
};

export function PrescriptionsCard({ encounterId, prescriptions, canPrescribe }: PrescriptionsCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ItemDraft[]>([{ ...EMPTY_ITEM }]);
  const [isPending, startTransition] = useTransition();
  const { data: medications = [] } = useMedications();

  function setItem(index: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function submit() {
    startTransition(async () => {
      const result = await createPrescription({ encounterId, items });
      if (!result.success) {
        const firstFieldError = result.fieldErrors
          ? Object.values(result.fieldErrors)[0]?.[0]
          : undefined;
        toast.error(firstFieldError ?? result.error);
        return;
      }
      toast.success("Receta emitida");
      setItems([{ ...EMPTY_ITEM }]);
      setOpen(false);
      router.refresh();
    });
  }

  function onCancel(prescriptionId: string) {
    startTransition(async () => {
      const result = await cancelPrescription({ prescriptionId, encounterId });
      if (result.success) toast.success("Receta anulada");
      else toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Pill className="size-4" /> Recetas
        </CardTitle>
        {canPrescribe ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus /> Nueva receta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nueva receta</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_120px_140px_90px_auto]">
                    <Select
                      value={item.medicationId}
                      onValueChange={(v) => setItem(index, { medicationId: v })}
                    >
                      <SelectTrigger aria-label="Medicamento">
                        <SelectValue placeholder="Medicamento..." />
                      </SelectTrigger>
                      <SelectContent>
                        {medications.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name} {m.strength ?? ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="1 comprimido"
                      value={item.dosage}
                      onChange={(e) => setItem(index, { dosage: e.target.value })}
                      aria-label="Dosis"
                    />
                    <Input
                      placeholder="cada 8 horas"
                      value={item.frequency}
                      onChange={(e) => setItem(index, { frequency: e.target.value })}
                      aria-label="Frecuencia"
                    />
                    <Input
                      type="number"
                      min={1}
                      value={item.durationDays}
                      onChange={(e) => setItem(index, { durationDays: e.target.value })}
                      aria-label="Días"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Quitar línea"
                      disabled={items.length === 1}
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Trash />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}
                >
                  <Plus /> Añadir medicamento
                </Button>
              </div>
              <Button onClick={submit} disabled={isPending}>
                {isPending ? "Emitiendo..." : "Emitir receta"}
              </Button>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        {prescriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin recetas emitidas</p>
        ) : (
          <ul className="space-y-3">
            {prescriptions.map((p) => (
              <li key={p.id} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant={PRESCRIPTION_STATUS[p.status].variant}>
                    {PRESCRIPTION_STATUS[p.status].label}
                  </Badge>
                  {canPrescribe && p.status === "ACTIVE" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancel(p.id)}
                      disabled={isPending}
                    >
                      <Prohibit /> Anular
                    </Button>
                  ) : null}
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
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
