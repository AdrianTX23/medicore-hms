"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heartbeat, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { recordVitals } from "@/features/encounters/actions/encounter.actions";
import type { EncounterDetail } from "@/features/encounters/queries/encounter.queries";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { formatDateTime } from "@/shared/utils/format";

const VITAL_FIELDS = [
  { key: "temperatureC", label: "Temp. (°C)", step: "0.1" },
  { key: "systolic", label: "Sistólica" },
  { key: "diastolic", label: "Diastólica" },
  { key: "heartRate", label: "FC (lpm)" },
  { key: "respiratoryRate", label: "FR (rpm)" },
  { key: "spo2", label: "SpO₂ (%)" },
  { key: "weightKg", label: "Peso (kg)", step: "0.1" },
  { key: "heightCm", label: "Talla (cm)", step: "0.1" },
] as const;

type VitalsCardProps = {
  encounterId: string;
  vitals: EncounterDetail["vitalSigns"];
  canRecord: boolean;
};

function recorderName(v: EncounterDetail["vitalSigns"][number]) {
  const profile = v.recordedBy.staffProfile;
  return profile ? `${profile.firstName} ${profile.lastName}` : v.recordedBy.email;
}

export function VitalsCard({ encounterId, vitals, canRecord }: VitalsCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await recordVitals({ encounterId, ...values });
      if (!result.success) {
        toast.error(result.fieldErrors ? Object.values(result.fieldErrors)[0]?.[0] ?? result.error : result.error);
        return;
      }
      toast.success("Signos vitales registrados");
      setValues({});
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heartbeat className="size-4" /> Signos vitales
        </CardTitle>
        {canRecord ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus /> Registrar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar signos vitales</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {VITAL_FIELDS.map((f) => (
                  <Field key={f.key}>
                    <FieldLabel htmlFor={f.key} className="text-xs">
                      {f.label}
                    </FieldLabel>
                    <Input
                      id={f.key}
                      type="number"
                      step={"step" in f ? f.step : "1"}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  </Field>
                ))}
              </div>
              <Button onClick={submit} disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        {vitals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin registros</p>
        ) : (
          <ul className="space-y-3">
            {vitals.map((v) => (
              <li key={v.id} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap gap-x-4 gap-y-1 tabular-nums">
                  {v.temperatureC != null ? <span>🌡 {v.temperatureC} °C</span> : null}
                  {v.systolic != null && v.diastolic != null ? (
                    <span>TA {v.systolic}/{v.diastolic}</span>
                  ) : null}
                  {v.heartRate != null ? <span>FC {v.heartRate}</span> : null}
                  {v.respiratoryRate != null ? <span>FR {v.respiratoryRate}</span> : null}
                  {v.spo2 != null ? <span>SpO₂ {v.spo2}%</span> : null}
                  {v.weightKg != null ? <span>{v.weightKg} kg</span> : null}
                  {v.heightCm != null ? <span>{v.heightCm} cm</span> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(v.recordedAt)} · {recorderName(v)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
