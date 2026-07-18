"use client";

import { CalendarX, Warning } from "@phosphor-icons/react";
import { differenceInCalendarDays } from "date-fns";
import type { InventoryRow } from "@/features/pharmacy/queries/pharmacy.queries";
import { AddBatchDialog } from "@/features/pharmacy/components/add-batch-dialog";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatCurrency, formatDateOnly } from "@/shared/utils/format";

const EXPIRY_WARNING_DAYS = 60;

export function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddBatchDialog />
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Sin medicamentos en el catálogo" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicamento</TableHead>
                <TableHead>Stock total</TableHead>
                <TableHead>Lotes</TableHead>
                <TableHead>Próximo vencimiento</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const lowStock = row.totalStock <= row.reorderLevel;
                const daysToExpiry = row.nearestExpiry
                  ? differenceInCalendarDays(row.nearestExpiry, new Date())
                  : null;
                const expiringSoon = daysToExpiry != null && daysToExpiry <= EXPIRY_WARNING_DAYS;

                return (
                  <TableRow key={row.medicationId}>
                    <TableCell>
                      <span className="font-medium">
                        {row.name} {row.strength ?? ""}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">{row.totalStock}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.batches.length === 0 ? (
                        "Sin stock"
                      ) : (
                        <div className="space-y-0.5">
                          {row.batches.map((b) => (
                            <div key={b.id}>
                              {b.batchNumber}: {b.quantity} u. ·{" "}
                              {formatCurrency(b.unitCost)}/u
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.nearestExpiry ? formatDateOnly(row.nearestExpiry) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {lowStock ? (
                          <Badge variant="destructive" className="gap-1">
                            <Warning className="size-3" /> Stock bajo
                          </Badge>
                        ) : null}
                        {expiringSoon ? (
                          <Badge variant="outline" className="gap-1">
                            <CalendarX className="size-3" /> Vence pronto
                          </Badge>
                        ) : null}
                        {!lowStock && !expiringSoon ? (
                          <span className="text-xs text-muted-foreground">OK</span>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
