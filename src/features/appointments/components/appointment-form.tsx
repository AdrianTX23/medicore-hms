"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createAppointment } from "@/features/appointments/actions/appointment.actions";
import { PatientCombobox } from "@/features/appointments/components/patient-combobox";
import { useDoctorSlots } from "@/features/appointments/hooks/use-appointments";
import type { DoctorOption } from "@/features/appointments/queries/appointment.queries";
import {
  createAppointmentSchema,
  type CreateAppointmentInput,
} from "@/features/appointments/schemas/appointment.schema";
import { Button } from "@/shared/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/utils/cn";

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

type AppointmentFormProps = {
  doctors: DoctorOption[];
  /** Pre-selected patient (e.g. when coming from a patient profile). */
  initialPatient?: { id: string; label: string };
};

export function AppointmentForm({ doctors, initialPatient }: AppointmentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(todayStr());
  // The combobox needs the patient's display label, which the form's Zod
  // schema (patientId only) doesn't carry — tracked alongside RHF state.
  const [selectedPatient, setSelectedPatient] = useState(initialPatient);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<CreateAppointmentInput>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      patientId: initialPatient?.id ?? "",
      doctorId: "",
      scheduledAt: "",
      reason: "",
    },
  });

  const doctorId = watch("doctorId");
  const scheduledAt = watch("scheduledAt");

  const { data: slots, isLoading: slotsLoading } = useDoctorSlots(doctorId || undefined, date);

  function onSubmit(values: CreateAppointmentInput) {
    startTransition(async () => {
      const result = await createAppointment(values);

      if (!result.success) {
        toast.error(result.error);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            setError(field as keyof CreateAppointmentInput, { message: messages[0] });
          }
        }
        // The chosen slot may have just been taken — refresh the grid.
        setValue("scheduledAt", "");
        return;
      }

      toast.success("Cita creada correctamente");
      router.push("/appointments");
      router.refresh();
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
            <Field data-invalid={!!errors.doctorId}>
              <FieldLabel>Médico *</FieldLabel>
              <Select
                value={doctorId}
                onValueChange={(v) => {
                  setValue("doctorId", v, { shouldValidate: true });
                  setValue("scheduledAt", "");
                }}
              >
                <SelectTrigger aria-invalid={!!errors.doctorId}>
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
              {errors.doctorId ? <FieldError>{errors.doctorId.message}</FieldError> : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="date">Fecha *</FieldLabel>
              <Input
                id="date"
                type="date"
                min={todayStr()}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setValue("scheduledAt", "");
                }}
              />
            </Field>
          </div>

          <Field data-invalid={!!errors.scheduledAt}>
            <FieldLabel>Horario disponible *</FieldLabel>
            {!doctorId ? (
              <p className="text-sm text-muted-foreground">
                Selecciona un médico para ver su disponibilidad
              </p>
            ) : slotsLoading ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-16" />
                ))}
              </div>
            ) : !slots || slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin horarios disponibles ese día — prueba otra fecha
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <Button
                    key={s.startsAt}
                    type="button"
                    size="sm"
                    variant={scheduledAt === s.startsAt ? "default" : "outline"}
                    className={cn("tabular-nums")}
                    onClick={() => setValue("scheduledAt", s.startsAt, { shouldValidate: true })}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            )}
            {errors.scheduledAt ? <FieldError>{errors.scheduledAt.message}</FieldError> : null}
          </Field>

          <Field data-invalid={!!errors.reason}>
            <FieldLabel htmlFor="reason">Motivo de la cita *</FieldLabel>
            <Textarea
              id="reason"
              rows={3}
              placeholder="Control de tensión arterial, dolor lumbar..."
              aria-invalid={!!errors.reason}
              {...register("reason")}
            />
            {errors.reason ? <FieldError>{errors.reason.message}</FieldError> : null}
          </Field>

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creando cita..." : "Crear cita"}
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
