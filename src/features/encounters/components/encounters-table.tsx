"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ENCOUNTER_STATUS_LABELS, ENCOUNTER_STATUS_VARIANTS } from "@/features/encounters/constants";
import type { EncounterListItem } from "@/features/encounters/queries/encounter.queries";
import { DataTable } from "@/shared/components/data-table";
import { StatusBadge } from "@/shared/components/data-viz/status-badge";
import { Badge } from "@/shared/components/ui/badge";
import { formatDateTime } from "@/shared/utils/format";
import type { Paginated } from "@/shared/utils/table-params";

export function EncountersTable({ result }: { result: Paginated<EncounterListItem> }) {
  const columns: ColumnDef<EncounterListItem, unknown>[] = [
    {
      id: "date",
      header: "Fecha",
      cell: ({ row }) => (
        <span className="tabular-nums">{formatDateTime(row.original.createdAt)}</span>
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
      cell: ({ row }) =>
        `${row.original.doctor.firstName} ${row.original.doctor.lastName}`,
    },
    {
      accessorKey: "chiefComplaint",
      header: "Motivo",
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-64 text-sm">{row.original.chiefComplaint}</span>
      ),
    },
    {
      id: "diagnoses",
      header: "Diagnósticos",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.diagnoses.length === 0 ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            row.original.diagnoses.map((d) => (
              <Badge key={d.icd10Code} variant="outline" className="font-mono">
                {d.icd10Code}
              </Badge>
            ))
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          labels={ENCOUNTER_STATUS_LABELS}
          variants={ENCOUNTER_STATUS_VARIANTS}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={result.rows}
      total={result.total}
      page={result.page}
      perPage={result.perPage}
      pageCount={result.pageCount}
      rowHref={(row) => `/encounters/${row.id}`}
      emptyMessage="No hay consultas registradas"
    />
  );
}
