"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

type DataTablePaginationProps = {
  page: number;
  perPage: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
};

export function DataTablePagination({
  page,
  perPage,
  pageCount,
  total,
  onPageChange,
  onPerPageChange,
}: DataTablePaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        {total} {total === 1 ? "registro" : "registros"}
      </p>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filas por página</span>
          <Select
            value={String(perPage)}
            onValueChange={(value) => onPerPageChange(Number(value))}
          >
            <SelectTrigger size="sm" className="w-18">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">
          Página {page} de {Math.max(pageCount, 1)}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
          >
            <CaretLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label="Página siguiente"
          >
            <CaretRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
