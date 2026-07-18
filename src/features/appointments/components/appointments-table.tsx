"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  DotsThree,
  Play,
  Prohibit,
  Stethoscope,
  UserMinus,
} from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  cancelAppointment,
  updateAppointmentStatus,
} from "@/features/appointments/actions/appointment.actions";
import { startEncounter } from "@/features/encounters";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_VARIANTS,
  APPOINTMENT_TRANSITIONS,
  CANCELLABLE_STATUSES,
} from "@/features/appointments/constants";
import type { AppointmentListItem } from "@/features/appointments/queries/appointment.queries";
import { DataTable } from "@/shared/components/data-table";
import { StatusBadge } from "@/shared/components/data-viz/status-badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Textarea } from "@/shared/components/ui/textarea";
import type { Paginated } from "@/shared/utils/table-params";

const timeFormatter = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
});

type AppointmentsTableProps = {
  result: Paginated<AppointmentListItem>;
  canUpdate: boolean;
  canCancel: boolean;
  /** True for roles that can open a clinical encounter (doctors). */
  canStartEncounter: boolean;
};

// IN_PROGRESS and COMPLETED are driven by the encounter lifecycle, not manually.
const TRANSITION_UI: Partial<
  Record<string, { label: string; icon: React.ReactNode }>
> = {
  CONFIRMED: { label: "Check-in", icon: <CheckCircle /> },
  NO_SHOW: { label: "No se presentó", icon: <UserMinus /> },
};

export function AppointmentsTable({
  result,
  canUpdate,
  canCancel,
  canStartEncounter,
}: AppointmentsTableProps) {
  const router = useRouter();
  const [toCancel, setToCancel] = useState<AppointmentListItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function transition(id: string, status: "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "NO_SHOW") {
    startTransition(async () => {
      const res = await updateAppointmentStatus({ id, status });
      if (res.success) {
        toast.success(`Cita → ${APPOINTMENT_STATUS_LABELS[res.data.status]}`);
      } else {
        toast.error(res.error);
      }
      router.refresh();
    });
  }

  function openEncounter(appointmentId: string) {
    startTransition(async () => {
      const res = await startEncounter({ appointmentId });
      if (res.success) {
        router.push(`/encounters/${res.data.id}`);
      } else {
        toast.error(res.error);
        router.refresh();
      }
    });
  }

  function confirmCancel() {
    if (!toCancel) return;
    startTransition(async () => {
      const res = await cancelAppointment({ id: toCancel.id, reason: cancelReason });
      if (res.success) toast.success("Cita cancelada");
      else toast.error(res.error);
      setToCancel(null);
      setCancelReason("");
      router.refresh();
    });
  }

  const columns: ColumnDef<AppointmentListItem, unknown>[] = [
    {
      id: "time",
      header: "Hora",
      cell: ({ row }) => (
        <div className="grid">
          <span className="font-medium tabular-nums">
            {timeFormatter.format(new Date(row.original.scheduledAt))}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.durationMinutes} min
          </span>
        </div>
      ),
    },
    {
      id: "patient",
      header: "Paciente",
      cell: ({ row }) => (
        <div className="grid">
          <span className="font-medium">
            {row.original.patient.firstName} {row.original.patient.lastName}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.patient.mrn}
          </span>
        </div>
      ),
    },
    {
      id: "doctor",
      header: "Médico",
      cell: ({ row }) => (
        <div className="grid">
          <span>
            {row.original.doctor.firstName} {row.original.doctor.lastName}
          </span>
          {row.original.doctor.specialty ? (
            <span className="text-xs text-muted-foreground">
              {row.original.doctor.specialty.name}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "reason",
      header: "Motivo",
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-64 text-sm">{row.original.reason}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          labels={APPOINTMENT_STATUS_LABELS}
          variants={APPOINTMENT_STATUS_VARIANTS}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const transitions = APPOINTMENT_TRANSITIONS[row.original.status];
        const cancellable = CANCELLABLE_STATUSES.includes(row.original.status);
        const showStart = canStartEncounter && row.original.status === "CONFIRMED";
        const showOpen = !!row.original.encounter;
        if (
          (!canUpdate || transitions.length === 0) &&
          (!canCancel || !cancellable) &&
          !showStart &&
          !showOpen
        ) {
          return null;
        }
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Acciones de la cita">
                <DotsThree weight="bold" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {showStart ? (
                <DropdownMenuItem
                  onSelect={() => openEncounter(row.original.id)}
                  disabled={isPending}
                >
                  <Play /> Iniciar consulta
                </DropdownMenuItem>
              ) : null}
              {showOpen ? (
                <DropdownMenuItem
                  onSelect={() => router.push(`/encounters/${row.original.encounter!.id}`)}
                >
                  <Stethoscope /> Abrir consulta
                </DropdownMenuItem>
              ) : null}
              {canUpdate
                ? transitions.map((next) => {
                    const ui = TRANSITION_UI[next];
                    if (!ui) return null;
                    return (
                      <DropdownMenuItem
                        key={next}
                        onSelect={() =>
                          transition(
                            row.original.id,
                            next as "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "NO_SHOW",
                          )
                        }
                        disabled={isPending}
                      >
                        {ui.icon} {ui.label}
                      </DropdownMenuItem>
                    );
                  })
                : null}
              {canCancel && cancellable ? (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setToCancel(row.original)}
                  disabled={isPending}
                >
                  <Prohibit /> Cancelar cita
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
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
        emptyMessage="No hay citas para los filtros seleccionados"
      />

      <Dialog open={!!toCancel} onOpenChange={(open) => !open && setToCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar cita</DialogTitle>
            <DialogDescription>
              {toCancel
                ? `${toCancel.patient.firstName} ${toCancel.patient.lastName} con ${toCancel.doctor.firstName} ${toCancel.doctor.lastName} a las ${timeFormatter.format(new Date(toCancel.scheduledAt))}. El horario quedará libre de nuevo.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo de la cancelación..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setToCancel(null)} disabled={isPending}>
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
              disabled={isPending || cancelReason.trim().length < 3}
            >
              {isPending ? "Cancelando..." : "Cancelar cita"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
