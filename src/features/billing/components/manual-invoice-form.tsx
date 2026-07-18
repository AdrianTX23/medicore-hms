"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createManualInvoice } from "@/features/billing/actions/billing.actions";
import { useServiceOptions } from "@/features/billing/hooks/use-billing";
import { PatientCombobox } from "@/features/appointments";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { formatCurrency } from "@/shared/utils/format";

type Line = { key: number; serviceId: string; quantity: number };

let nextKey = 1;

export function ManualInvoiceForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { data: services = [] } = useServiceOptions();

  const [patient, setPatient] = useState<{ id: string; label: string }>();
  const [lines, setLines] = useState<Line[]>([{ key: nextKey++, serviceId: "", quantity: 1 }]);
  const [error, setError] = useState<string | null>(null);

  const servicesById = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

  const subtotal = lines.reduce((sum, line) => {
    const service = servicesById.get(line.serviceId);
    return sum + (service ? service.price * line.quantity : 0);
  }, 0);

  function updateLine(key: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { key: nextKey++, serviceId: "", quantity: 1 }]);
  }

  function removeLine(key: number) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  }

  function submit() {
    if (!patient) {
      setError("Selecciona un paciente");
      return;
    }
    const validLines = lines.filter((l) => l.serviceId);
    if (validLines.length === 0) {
      setError("Añade al menos un servicio");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await createManualInvoice({
        patientId: patient.id,
        items: validLines.map((l) => ({ serviceId: l.serviceId, quantity: l.quantity })),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Factura creada");
      router.push(`/billing/${result.data.id}`);
    });
  }

  return (
    <div className="max-w-2xl space-y-5">
      <Field>
        <FieldLabel>Paciente *</FieldLabel>
        <PatientCombobox value={patient} onSelect={setPatient} />
      </Field>

      <div className="space-y-3">
        <FieldLabel>Servicios *</FieldLabel>
        {lines.map((line) => {
          const service = servicesById.get(line.serviceId);
          return (
            <div key={line.key} className="flex items-center gap-2">
              <Select
                value={line.serviceId}
                onValueChange={(v) => updateLine(line.key, { serviceId: v })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecciona un servicio..." />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {formatCurrency(s.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                max={99}
                value={line.quantity}
                onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) || 1 })}
                className="w-20"
              />
              <span className="w-24 text-right text-sm tabular-nums text-muted-foreground">
                {service ? formatCurrency(service.price * line.quantity) : "—"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeLine(line.key)}
                disabled={lines.length === 1}
                aria-label="Quitar línea"
              >
                <Trash />
              </Button>
            </div>
          );
        })}
        <Button type="button" variant="outline" size="sm" onClick={addLine}>
          <Plus /> Añadir servicio
        </Button>
      </div>

      {error ? <FieldError>{error}</FieldError> : null}

      <div className="flex items-center justify-between border-t pt-4">
        <span className="text-sm text-muted-foreground">Subtotal</span>
        <span className="text-lg font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        El descuento por seguro (si el paciente tiene uno activo) se aplica automáticamente al
        crear la factura.
      </p>

      <Button onClick={submit} disabled={isPending}>
        {isPending ? "Creando factura..." : "Crear factura"}
      </Button>
    </div>
  );
}
