"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { addInventoryBatch } from "@/features/pharmacy/actions/pharmacy.actions";
import { addInventoryBatchSchema } from "@/features/pharmacy/schemas/pharmacy.schema";
import { useMedicationOptions } from "@/features/pharmacy/hooks/use-pharmacy";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

type FormInput = z.input<typeof addInventoryBatchSchema>;

export function AddBatchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { data: medications = [] } = useMedicationOptions();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(addInventoryBatchSchema),
    defaultValues: { batchNumber: "", quantity: 100, unitCost: 0, reorderLevel: 10 },
  });

  const medicationId = watch("medicationId");

  function onSubmit(values: FormInput) {
    startTransition(async () => {
      const result = await addInventoryBatch(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Lote agregado al inventario");
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Nuevo lote
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar lote de inventario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.medicationId}>
              <FieldLabel>Medicamento</FieldLabel>
              <Select
                value={medicationId ?? ""}
                onValueChange={(v) => setValue("medicationId", v, { shouldValidate: true })}
              >
                <SelectTrigger aria-invalid={!!errors.medicationId}>
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {medications.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} {m.strength ?? ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.medicationId ? <FieldError>{errors.medicationId.message}</FieldError> : null}
            </Field>
            <Field data-invalid={!!errors.batchNumber}>
              <FieldLabel htmlFor="batchNumber">Número de lote</FieldLabel>
              <Input id="batchNumber" {...register("batchNumber")} />
              {errors.batchNumber ? <FieldError>{errors.batchNumber.message}</FieldError> : null}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.quantity}>
                <FieldLabel htmlFor="quantity">Cantidad</FieldLabel>
                <Input id="quantity" type="number" min={1} {...register("quantity")} />
                {errors.quantity ? <FieldError>{errors.quantity.message}</FieldError> : null}
              </Field>
              <Field data-invalid={!!errors.expiryDate}>
                <FieldLabel htmlFor="expiryDate">Vencimiento</FieldLabel>
                <Input id="expiryDate" type="date" {...register("expiryDate")} />
                {errors.expiryDate ? <FieldError>{errors.expiryDate.message}</FieldError> : null}
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.unitCost}>
                <FieldLabel htmlFor="unitCost">Costo unitario</FieldLabel>
                <Input id="unitCost" type="number" step="0.01" min={0} {...register("unitCost")} />
                {errors.unitCost ? <FieldError>{errors.unitCost.message}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="reorderLevel">Nivel de reposición</FieldLabel>
                <Input id="reorderLevel" type="number" min={0} {...register("reorderLevel")} />
              </Field>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Registrar lote"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
