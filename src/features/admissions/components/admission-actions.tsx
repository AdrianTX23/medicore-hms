"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowsLeftRight, SignOut } from "@phosphor-icons/react";
import { toast } from "sonner";
import { dischargePatient, transferBed } from "@/features/admissions/actions/admission.actions";
import type { AvailableBed } from "@/features/admissions/queries/admission.queries";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

type AdmissionActionsProps = {
  admissionId: string;
  availableBeds: AvailableBed[];
};

export function AdmissionActions({ admissionId, availableBeds }: AdmissionActionsProps) {
  const router = useRouter();
  const [transferOpen, setTransferOpen] = useState(false);
  const [dischargeOpen, setDischargeOpen] = useState(false);
  const [toBedId, setToBedId] = useState("");
  const [reason, setReason] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitTransfer() {
    if (!toBedId) {
      setError("Selecciona la cama de destino");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await transferBed({ admissionId, toBedId, reason: reason.trim() || undefined });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Paciente trasladado");
      setTransferOpen(false);
      setToBedId("");
      setReason("");
      router.refresh();
    });
  }

  function submitDischarge() {
    if (summary.trim().length < 3) {
      setError("Indica el resumen de alta");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await dischargePatient({ admissionId, dischargeSummary: summary.trim() });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Paciente dado de alta");
      setDischargeOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <ArrowsLeftRight /> Trasladar
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trasladar de cama</DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={!!error}>
              <FieldLabel>Cama de destino</FieldLabel>
              <Select value={toBedId} onValueChange={setToBedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una cama libre..." />
                </SelectTrigger>
                <SelectContent>
                  {availableBeds.map((bed) => (
                    <SelectItem key={bed.id} value={bed.id}>
                      {bed.code} — {bed.departmentName} (Hab. {bed.roomNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="transferReason">Motivo (opcional)</FieldLabel>
              <Textarea id="transferReason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
            <Button onClick={submitTransfer} disabled={isPending}>
              {isPending ? "Trasladando..." : "Confirmar traslado"}
            </Button>
          </FieldGroup>
        </DialogContent>
      </Dialog>

      <Dialog open={dischargeOpen} onOpenChange={setDischargeOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <SignOut /> Dar de alta
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar de alta al paciente</DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="dischargeSummary">Resumen de alta</FieldLabel>
              <Textarea
                id="dischargeSummary"
                rows={4}
                placeholder="Evolución, tratamiento e indicaciones al alta..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
            <Button onClick={submitDischarge} disabled={isPending}>
              {isPending ? "Dando de alta..." : "Confirmar alta"}
            </Button>
          </FieldGroup>
        </DialogContent>
      </Dialog>
    </div>
  );
}
