"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Notebook } from "@phosphor-icons/react";
import { toast } from "sonner";
import { updateEncounterNotes } from "@/features/encounters/actions/encounter.actions";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

type NotesCardProps = {
  encounterId: string;
  chiefComplaint: string;
  notes: string | null;
  treatmentPlan: string | null;
  canEdit: boolean;
};

export function NotesCard({
  encounterId,
  chiefComplaint: initialComplaint,
  notes: initialNotes,
  treatmentPlan: initialPlan,
  canEdit,
}: NotesCardProps) {
  const router = useRouter();
  const [chiefComplaint, setChiefComplaint] = useState(initialComplaint);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [treatmentPlan, setTreatmentPlan] = useState(initialPlan ?? "");
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateEncounterNotes({
        encounterId,
        chiefComplaint,
        notes: notes || undefined,
        treatmentPlan: treatmentPlan || undefined,
      });
      if (result.success) toast.success("Notas guardadas");
      else toast.error(result.error);
      router.refresh();
    });
  }

  if (!canEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Notebook className="size-4" /> Nota clínica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-muted-foreground">Motivo de consulta</p>
            <p>{initialComplaint}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Anamnesis y exploración</p>
            <p className="whitespace-pre-wrap">{initialNotes ?? "—"}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Plan de tratamiento</p>
            <p className="whitespace-pre-wrap">{initialPlan ?? "—"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Notebook className="size-4" /> Nota clínica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <FieldLabel htmlFor="chiefComplaint">Motivo de consulta</FieldLabel>
          <Input
            id="chiefComplaint"
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="notes">Anamnesis y exploración</FieldLabel>
          <Textarea
            id="notes"
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Historia de la enfermedad actual, exploración física..."
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="treatmentPlan">Plan de tratamiento</FieldLabel>
          <Textarea
            id="treatmentPlan"
            rows={3}
            value={treatmentPlan}
            onChange={(e) => setTreatmentPlan(e.target.value)}
            placeholder="Indicaciones, seguimiento, derivaciones..."
          />
        </Field>
        <Button onClick={save} disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar notas"}
        </Button>
      </CardContent>
    </Card>
  );
}
