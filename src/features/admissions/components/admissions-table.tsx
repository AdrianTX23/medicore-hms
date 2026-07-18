"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AdmissionListItem } from "@/features/admissions/queries/admission.queries";
import { DataTable } from "@/shared/components/data-table";
import { formatDateTime } from "@/shared/utils/format";
import type { Paginated } from "@/shared/utils/table-params";

export function AdmissionsTable({ result }: { result: Paginated<AdmissionListItem> }) {
  const columns: ColumnDef<AdmissionListItem, unknown>[] = [
    {
      id: "patient",
      header: "Paciente",
      cell: ({ row }) => (
        <div className="grid">
          <span className="font-medium">
            {row.original.patient.firstName} {row.original.patient.lastName}
          </span>
          <span className="font-mono text-xs text-muted-foreground">{row.original.patient.mrn}</span>
        </div>
      ),
    },
    {
      id: "bed",
      header: "Cama",
      cell: ({ row }) => (
        <div className="grid">
          <span className="font-medium">{row.original.bed.code}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.bed.room.department.name} · Hab. {row.original.bed.room.number}
          </span>
        </div>
      ),
    },
    {
      id: "doctor",
      header: "Médico responsable",
      cell: ({ row }) =>
        `${row.original.attendingDoctor.firstName} ${row.original.attendingDoctor.lastName}`,
    },
    {
      accessorKey: "admissionDiagnosis",
      header: "Diagnóstico",
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-64 text-sm">{row.original.admissionDiagnosis}</span>
      ),
    },
    {
      accessorKey: "admittedAt",
      header: "Ingreso",
      cell: ({ row }) => formatDateTime(row.original.admittedAt),
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
      rowHref={(row) => `/admissions/${row.id}`}
      emptyMessage="No hay pacientes hospitalizados actualmente"
    />
  );
}
