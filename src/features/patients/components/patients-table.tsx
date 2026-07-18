"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DotsThree, Eye, PencilSimple, Trash } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { deletePatient } from "@/features/patients/actions/patient.actions";
import { BLOOD_TYPE_LABELS, GENDER_LABELS } from "@/features/patients/constants";
import type { PatientListItem } from "@/features/patients/queries/patient.queries";
import { DataTable } from "@/shared/components/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { formatAge } from "@/shared/utils/format";
import type { Paginated } from "@/shared/utils/table-params";

type PatientsTableProps = {
  result: Paginated<PatientListItem>;
  canUpdate: boolean;
  canDelete: boolean;
};

export function PatientsTable({ result, canUpdate, canDelete }: PatientsTableProps) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<PatientListItem | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    if (!pendingDelete) return;
    startTransition(async () => {
      const result = await deletePatient({ id: pendingDelete.id });
      if (result.success) {
        toast.success("Paciente eliminado");
      } else {
        toast.error(result.error);
      }
      setPendingDelete(null);
      router.refresh();
    });
  }

  const columns: ColumnDef<PatientListItem, unknown>[] = [
    {
      accessorKey: "mrn",
      header: "MRN",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.mrn}</span>
      ),
    },
    {
      id: "name",
      header: "Paciente",
      cell: ({ row }) => (
        <div className="grid">
          <span className="font-medium">
            {row.original.firstName} {row.original.lastName}
          </span>
          <span className="text-xs text-muted-foreground">
            {GENDER_LABELS[row.original.gender]} · {formatAge(row.original.birthDate)}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "documentId",
      header: "Documento",
      cell: ({ row }) => row.original.documentId ?? <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
      cell: ({ row }) => row.original.phone ?? <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "bloodType",
      header: "Sangre",
      cell: ({ row }) =>
        row.original.bloodType ? (
          <Badge variant="outline">{BLOOD_TYPE_LABELS[row.original.bloodType]}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Acciones"
              onClick={(e) => e.stopPropagation()}
            >
              <DotsThree weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={() => router.push(`/patients/${row.original.id}`)}>
              <Eye /> Ver perfil
            </DropdownMenuItem>
            {canUpdate ? (
              <DropdownMenuItem onSelect={() => router.push(`/patients/${row.original.id}/edit`)}>
                <PencilSimple /> Editar
              </DropdownMenuItem>
            ) : null}
            {canDelete ? (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setPendingDelete(row.original)}
              >
                <Trash /> Eliminar
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={result.rows}
        total={result.total}
        page={result.page}
        perPage={result.perPage}
        pageCount={result.pageCount}
        rowHref={(row) => `/patients/${row.id}`}
        emptyMessage="No se encontraron pacientes"
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${pendingDelete.firstName} ${pendingDelete.lastName} (${pendingDelete.mrn}) dejará de aparecer en el sistema. Su historia clínica se conserva por requisito legal.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isPending}>
              {isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
