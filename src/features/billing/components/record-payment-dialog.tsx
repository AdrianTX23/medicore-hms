"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { recordPayment } from "@/features/billing/actions/billing.actions";
import { PAYMENT_METHOD_LABELS } from "@/features/billing/constants";
import { recordPaymentSchema } from "@/features/billing/schemas/billing.schema";
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
import { formatCurrency } from "@/shared/utils/format";

const formSchema = recordPaymentSchema.omit({ invoiceId: true });
type FormInput = z.input<typeof formSchema>;

export function RecordPaymentDialog({ invoiceId, balance }: { invoiceId: string; balance: number }) {
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
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: balance, method: "CASH" },
  });

  const method = watch("method");

  function onSubmit(values: FormInput) {
    startTransition(async () => {
      const result = await recordPayment({ ...values, invoiceId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Pago registrado");
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CreditCard /> Registrar pago
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Saldo pendiente: <span className="font-medium text-foreground">{formatCurrency(balance)}</span>
        </p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.amount}>
              <FieldLabel htmlFor="amount">Monto</FieldLabel>
              <Input id="amount" type="number" step="0.01" min={0.01} {...register("amount")} />
              {errors.amount ? <FieldError>{errors.amount.message}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel>Método de pago</FieldLabel>
              <Select value={method} onValueChange={(v) => setValue("method", v as FormInput["method"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="reference">Referencia (opcional)</FieldLabel>
              <Input
                id="reference"
                placeholder="Código de autorización, nº de transferencia..."
                {...register("reference")}
              />
            </Field>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Registrando..." : "Registrar pago"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
