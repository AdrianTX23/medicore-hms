"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Phone, Plus, Trash, UsersThree } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  addEmergencyContact,
  deleteEmergencyContact,
} from "@/features/patients/actions/patient.actions";
import { emergencyContactSchema } from "@/features/patients/schemas/patient.schema";
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

type Contact = { id: string; name: string; relationship: string; phone: string };

type ContactFormInput = z.input<typeof contactFormSchema>;
const contactFormSchema = emergencyContactSchema.omit({ patientId: true });

type EmergencyContactsCardProps = {
  patientId: string;
  contacts: Contact[];
  canManage: boolean;
};

export function EmergencyContactsCard({
  patientId,
  contacts,
  canManage,
}: EmergencyContactsCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", relationship: "", phone: "" },
  });

  function onSubmit(values: ContactFormInput) {
    startTransition(async () => {
      const result = await addEmergencyContact({ ...values, patientId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Contacto añadido");
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  function onDelete(contactId: string) {
    startTransition(async () => {
      const result = await deleteEmergencyContact({ contactId, patientId });
      if (result.success) toast.success("Contacto eliminado");
      else toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <UsersThree className="size-4" /> Contactos de emergencia
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
                <DialogTitle>Nuevo contacto de emergencia</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Field data-invalid={!!errors.name}>
                    <FieldLabel htmlFor="contactName">Nombre completo</FieldLabel>
                    <Input id="contactName" {...register("name")} />
                    {errors.name ? <FieldError>{errors.name.message}</FieldError> : null}
                  </Field>
                  <Field data-invalid={!!errors.relationship}>
                    <FieldLabel htmlFor="contactRelationship">Parentesco</FieldLabel>
                    <Input
                      id="contactRelationship"
                      placeholder="Cónyuge, hijo/a, hermano/a..."
                      {...register("relationship")}
                    />
                    {errors.relationship ? (
                      <FieldError>{errors.relationship.message}</FieldError>
                    ) : null}
                  </Field>
                  <Field data-invalid={!!errors.phone}>
                    <FieldLabel htmlFor="contactPhone">Teléfono</FieldLabel>
                    <Input id="contactPhone" {...register("phone")} />
                    {errors.phone ? <FieldError>{errors.phone.message}</FieldError> : null}
                  </Field>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Guardando..." : "Guardar contacto"}
                  </Button>
                </FieldGroup>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin contactos registrados</p>
        ) : (
          <ul className="space-y-3">
            {contacts.map((contact) => (
              <li key={contact.id} className="flex items-center justify-between gap-2">
                <div className="grid text-sm">
                  <span className="font-medium">{contact.name}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    {contact.relationship} · <Phone className="size-3" /> {contact.phone}
                  </span>
                </div>
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Eliminar ${contact.name}`}
                    onClick={() => onDelete(contact.id)}
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
