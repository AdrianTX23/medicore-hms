"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LockSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { closeEncounter } from "@/features/encounters/actions/encounter.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";

export function CloseEncounterButton({ encounterId }: { encounterId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function close() {
    startTransition(async () => {
      const result = await closeEncounter({ encounterId });
      if (result.success) toast.success("Consulta cerrada — la historia clínica queda sellada");
      else toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>
          <LockSimple /> Cerrar consulta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Cerrar la consulta?</AlertDialogTitle>
          <AlertDialogDescription>
            Al cerrarla, la nota clínica queda inmutable por requisito legal: no podrá
            editarse y cualquier corrección se registrará como addendum firmado. La cita
            asociada pasará a completada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Volver</AlertDialogCancel>
          <AlertDialogAction onClick={close} disabled={isPending}>
            {isPending ? "Cerrando..." : "Cerrar consulta"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
