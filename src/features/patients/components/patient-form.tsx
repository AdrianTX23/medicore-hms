"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createPatient, updatePatient } from "@/features/patients/actions/patient.actions";
import { BLOOD_TYPE_LABELS, GENDER_LABELS } from "@/features/patients/constants";
import {
  patientFormSchema,
  type PatientFormInput,
} from "@/features/patients/schemas/patient.schema";
import { Button } from "@/shared/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

type PatientFormProps = {
  /** When set, the form edits an existing patient. */
  patientId?: string;
  defaultValues?: Partial<PatientFormInput>;
};

export function PatientForm({ patientId, defaultValues }: PatientFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!patientId;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<PatientFormInput>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      documentId: "",
      birthDate: "",
      phone: "",
      email: "",
      address: "",
      allergies: "",
      notes: "",
      ...defaultValues,
    },
  });

  const gender = watch("gender");
  const bloodType = watch("bloodType");

  function onSubmit(values: PatientFormInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updatePatient({ ...values, id: patientId })
        : await createPatient(values);

      if (!result.success) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            setError(field as keyof PatientFormInput, { message: messages[0] });
          }
        }
        toast.error(result.error);
        return;
      }

      toast.success(isEdit ? "Paciente actualizado" : `Paciente creado (${result.data.mrn})`);
      router.push(`/patients/${result.data.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.firstName}>
            <FieldLabel htmlFor="firstName">Nombre *</FieldLabel>
            <Input id="firstName" aria-invalid={!!errors.firstName} {...register("firstName")} />
            {errors.firstName ? <FieldError>{errors.firstName.message}</FieldError> : null}
          </Field>
          <Field data-invalid={!!errors.lastName}>
            <FieldLabel htmlFor="lastName">Apellidos *</FieldLabel>
            <Input id="lastName" aria-invalid={!!errors.lastName} {...register("lastName")} />
            {errors.lastName ? <FieldError>{errors.lastName.message}</FieldError> : null}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.documentId}>
            <FieldLabel htmlFor="documentId">Documento de identidad</FieldLabel>
            <Input id="documentId" placeholder="DNI / NIE / Pasaporte" {...register("documentId")} />
            {errors.documentId ? <FieldError>{errors.documentId.message}</FieldError> : null}
          </Field>
          <Field data-invalid={!!errors.birthDate}>
            <FieldLabel htmlFor="birthDate">Fecha de nacimiento *</FieldLabel>
            <Input id="birthDate" type="date" aria-invalid={!!errors.birthDate} {...register("birthDate")} />
            {errors.birthDate ? <FieldError>{errors.birthDate.message}</FieldError> : null}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.gender}>
            <FieldLabel>Sexo *</FieldLabel>
            <Select
              value={gender}
              onValueChange={(v) => setValue("gender", v as PatientFormInput["gender"], { shouldValidate: true })}
            >
              <SelectTrigger aria-invalid={!!errors.gender}>
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GENDER_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gender ? <FieldError>{errors.gender.message}</FieldError> : null}
          </Field>
          <Field>
            <FieldLabel>Grupo sanguíneo</FieldLabel>
            <Select
              value={bloodType ?? ""}
              onValueChange={(v) => setValue("bloodType", v as PatientFormInput["bloodType"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Desconocido" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BLOOD_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
            <Input id="phone" placeholder="+34 600 000 000" {...register("phone")} />
          </Field>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="patientEmail">Correo electrónico</FieldLabel>
            <Input id="patientEmail" type="email" {...register("email")} />
            {errors.email ? <FieldError>{errors.email.message}</FieldError> : null}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="address">Dirección</FieldLabel>
          <Input id="address" {...register("address")} />
        </Field>

        <Field>
          <FieldLabel htmlFor="allergies">Alergias (una por línea)</FieldLabel>
          <Textarea
            id="allergies"
            rows={3}
            placeholder={"Penicilina\nLátex"}
            {...register("allergies")}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="notes">Notas administrativas</FieldLabel>
          <Textarea id="notes" rows={3} {...register("notes")} />
        </Field>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear paciente"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
            Cancelar
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
