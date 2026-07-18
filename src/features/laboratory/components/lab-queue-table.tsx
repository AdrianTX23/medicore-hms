"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  LAB_ORDER_STATUS_LABELS,
  LAB_ORDER_STATUS_VARIANTS,
  LAB_PRIORITY_LABELS,
  LAB_PRIORITY_VARIANTS,
} from "@/features/laboratory/constants";
import type { LabOrderListItem } from "@/features/laboratory/queries/lab.queries";
import { DataTable } from "@/shared/components/data-table";
import { StatusBadge } from "@/shared/components/data-viz/status-badge";
import { Badge } from "@/shared/components/ui/badge";
import type { Paginated } from "@/shared/utils/table-params";

export function LabQueueTable({ result }: { result: Paginated<LabOrderListItem> }) {
  const columns: ColumnDef<LabOrderListItem, unknown>[] = [
    {
      id: "priority",
      header: "Prioridad",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.priority}
          labels={LAB_PRIORITY_LABELS}
          variants={LAB_PRIORITY_VARIANTS}
        />
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
      id: "tests",
      header: "Exámenes",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.items.map((i) => (
            <Badge key={i.labTest.code} variant="outline" className="font-mono">
              {i.labTest.code}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: "orderedBy",
      header: "Médico",
      cell: ({ row }) =>
        `${row.original.orderedBy.firstName} ${row.original.orderedBy.lastName}`,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          labels={LAB_ORDER_STATUS_LABELS}
          variants={LAB_ORDER_STATUS_VARIANTS}
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
      rowHref={(row) => `/laboratory/${row.id}`}
      emptyMessage="No hay órdenes de laboratorio para el filtro seleccionado"
    />
  );
}
