"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldCheck, Trash } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  addPatientInsurance,
  removePatientInsurance,
} from "@/features/patients/actions/patient.actions";
import { patientInsuranceSchema } from "@/features/patients/schemas/patient.schema";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
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
import { formatDateOnly } from "@/shared/utils/format";

type Insurance = {
  id: string;
  policyNumber: string;
  coveragePct: number;
  validUntil: Date | null;
  provider: { id: string; name: string };
};

const insuranceFormSchema = patientInsuranceSchema.omit({ patientId: true });
type InsuranceFormInput = z.input<typeof insuranceFormSchema>;

type InsuranceCardProps = {
  patientId: string;
  insurances: Insurance[];
  providers: Array<{ id: string; name: string }>;
  canManage: boolean;
};

export function InsuranceCard({ patientId, insurances, providers, canManage }: InsuranceCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InsuranceFormInput>({
    resolver: zodResolver(insuranceFormSchema),
    defaultValues: { policyNumber: "", coveragePct: 80 },
  });

  const providerId = watch("providerId");

  function onSubmit(values: InsuranceFormInput) {
    startTransition(async () => {
      const result = await addPatientInsurance({ ...values, patientId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Seguro registrado");
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  function onRemove(insuranceId: string) {
    startTransition(async () => {
      const result = await removePatientInsurance({ insuranceId, patientId });
      if (result.success) toast.success("Seguro desactivado");
      else toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4" /> Seguros médicos
        </CardTitle>
        {canManage ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus /> Añadir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar seguro médico</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Field data-invalid={!!errors.providerId}>
                    <FieldLabel>Aseguradora</FieldLabel>
                    <Select
                      value={providerId ?? ""}
                      onValueChange={(v) => setValue("providerId", v, { shouldValidate: true })}
                    >
                      <SelectTrigger aria-invalid={!!errors.providerId}>
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.providerId ? (
                      <FieldError>{errors.providerId.message}</FieldError>
                    ) : null}
                  </Field>
                  <Field data-invalid={!!errors.policyNumber}>
                    <FieldLabel htmlFor="policyNumber">Número de póliza</FieldLabel>
                    <Input id="policyNumber" {...register("policyNumber")} />
                    {errors.policyNumber ? (
                      <FieldError>{errors.policyNumber.message}</FieldError>
                    ) : null}
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field data-invalid={!!errors.coveragePct}>
                      <FieldLabel htmlFor="coveragePct">Cobertura (%)</FieldLabel>
                      <Input
                        id="coveragePct"
                        type="number"
                        min={0}
                        max={100}
                        {...register("coveragePct")}
                      />
                      {errors.coveragePct ? (
                        <FieldError>{errors.coveragePct.message}</FieldError>
                      ) : null}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="validUntil">Válido hasta</FieldLabel>
                      <Input id="validUntil" type="date" {...register("validUntil")} />
                    </Field>
                  </div>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Guardando..." : "Registrar seguro"}
                  </Button>
                </FieldGroup>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        {insurances.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin seguros activos — paciente privado</p>
        ) : (
          <ul className="space-y-3">
            {insurances.map((ins) => (
              <li key={ins.id} className="flex items-center justify-between gap-2">
                <div className="grid text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    {ins.provider.name}
                    <Badge variant="secondary">{ins.coveragePct}%</Badge>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Póliza {ins.policyNumber}
                    {ins.validUntil ? ` · vence ${formatDateOnly(ins.validUntil)}` : ""}
                  </span>
                </div>
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Desactivar seguro de ${ins.provider.name}`}
                    onClick={() => onRemove(ins.id)}
                    disabled={isPending}
                  >
                    <Trash />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
