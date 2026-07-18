"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { admitPatient } from "@/features/admissions/actions/admission.actions";
import type { AvailableBed } from "@/features/admissions/queries/admission.queries";
import { admitPatientSchema, type AdmitPatientInput } from "@/features/admissions/schemas/admission.schema";
import { PatientCombobox } from "@/features/appointments";
import type { DoctorOption } from "@/features/appointments/queries/appointment.queries";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

type AdmitPatientFormProps = {
  beds: AvailableBed[];
  doctors: DoctorOption[];
  initialBedId?: string;
};

export function AdmitPatientForm({ beds, doctors, initialBedId }: AdmitPatientFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // The combobox needs the patient's display label, which the form's Zod
  // schema (patientId only) doesn't carry — tracked alongside RHF state.
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; label: string }>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<AdmitPatientInput>({
    resolver: zodResolver(admitPatientSchema),
    defaultValues: {
      patientId: "",
      bedId: initialBedId ?? "",
      attendingDoctorId: "",
      admissionDiagnosis: "",
    },
  });

  const bedId = watch("bedId");
  const attendingDoctorId = watch("attendingDoctorId");

  function onSubmit(values: AdmitPatientInput) {
    startTransition(async () => {
      const result = await admitPatient(values);
      if (!result.success) {
        toast.error(result.error);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            setError(field as keyof AdmitPatientInput, { message: messages[0] });
          }
        }
        return;
      }
      toast.success("Paciente hospitalizado");
      router.push(`/admissions/${result.data.id}`);
    });
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field data-invalid={!!errors.patientId}>
            <FieldLabel>Paciente *</FieldLabel>
            <PatientCombobox
              value={selectedPatient}
              onSelect={(p) => {
                setSelectedPatient(p);
                setValue("patientId", p.id, { shouldValidate: true });
              }}
              invalid={!!errors.patientId}
            />
            {errors.patientId ? <FieldError>{errors.patientId.message}</FieldError> : null}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!errors.bedId}>
              <FieldLabel>Cama *</FieldLabel>
              <Select
                value={bedId}
                onValueChange={(v) => setValue("bedId", v, { shouldValidate: true })}
              >
                <SelectTrigger aria-invalid={!!errors.bedId}>
                  <SelectValue placeholder="Selecciona una cama libre..." />
                </SelectTrigger>
                <SelectContent>
                  {beds.map((bed) => (
                    <SelectItem key={bed.id} value={bed.id}>
                      {bed.code} — {bed.departmentName} (Hab. {bed.roomNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bedId ? <FieldError>{errors.bedId.message}</FieldError> : null}
              {beds.length === 0 ? (
                <p className="text-xs text-muted-foreground">No hay camas disponibles en este momento</p>
              ) : null}
            </Field>

            <Field data-invalid={!!errors.attendingDoctorId}>
              <FieldLabel>Médico responsable *</FieldLabel>
              <Select
                value={attendingDoctorId}
                onValueChange={(v) => setValue("attendingDoctorId", v, { shouldValidate: true })}
              >
                <SelectTrigger aria-invalid={!!errors.attendingDoctorId}>
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.firstName} {doctor.lastName}
                      {doctor.specialty ? ` — ${doctor.specialty.name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.attendingDoctorId ? <FieldError>{errors.attendingDoctorId.message}</FieldError> : null}
            </Field>
          </div>

          <Field data-invalid={!!errors.admissionDiagnosis}>
            <FieldLabel htmlFor="diagnosis">Diagnóstico de ingreso *</FieldLabel>
            <Textarea
              id="diagnosis"
              rows={3}
              placeholder="Motivo de la hospitalización..."
              aria-invalid={!!errors.admissionDiagnosis}
              {...register("admissionDiagnosis")}
            />
            {errors.admissionDiagnosis ? <FieldError>{errors.admissionDiagnosis.message}</FieldError> : null}
          </Field>

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending || beds.length === 0}>
              {isPending ? "Ingresando..." : "Ingresar paciente"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
              Cancelar
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
