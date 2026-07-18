"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_VARIANTS } from "@/features/billing/constants";
import type { InvoiceListItem } from "@/features/billing/queries/billing.queries";
import { DataTable } from "@/shared/components/data-table";
import { StatusBadge } from "@/shared/components/data-viz/status-badge";
import { formatCurrency, formatDate } from "@/shared/utils/format";
import type { Paginated } from "@/shared/utils/table-params";

export function InvoicesTable({ result }: { result: Paginated<InvoiceListItem> }) {
  const columns: ColumnDef<InvoiceListItem, unknown>[] = [
    {
      accessorKey: "invoiceNumber",
      header: "Factura",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.invoiceNumber}
        </span>
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
      accessorKey: "createdAt",
      header: "Fecha",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => (
        <span className="tabular-nums">{formatCurrency(row.original.total)}</span>
      ),
    },
    {
      id: "paid",
      header: "Pagado",
      cell: ({ row }) => (
        <span className="tabular-nums text-muted-foreground">
          {formatCurrency(row.original.paid)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          labels={INVOICE_STATUS_LABELS}
          variants={INVOICE_STATUS_VARIANTS}
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
      rowHref={(row) => `/billing/${row.id}`}
      emptyMessage="No hay facturas para el filtro seleccionado"
    />
  );
}
