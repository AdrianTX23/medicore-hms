"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { cn } from "@/shared/utils/cn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  /** Navigate on row click, e.g. (row) => `/patients/${row.id}` */
  rowHref?: (row: TData) => string;
  emptyMessage?: string;
};

/**
 * Generic server-paginated table. All state (page, perPage, q, sort) lives
 * in the URL — the server component re-queries on navigation.
 */
export function DataTable<TData>({
  columns,
  data,
  total,
  page,
  perPage,
  pageCount,
  rowHref,
  emptyMessage = "No hay resultados",
}: DataTableProps<TData>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  function setParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "overflow-x-auto rounded-lg border transition-opacity",
          isPending && "pointer-events-none opacity-60",
        )}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <MagnifyingGlass className="size-6" weight="thin" />
                    <span className="text-sm">{emptyMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    rowHref &&
                      "cursor-pointer outline-none focus-visible:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring/50",
                  )}
                  tabIndex={rowHref ? 0 : undefined}
                  role={rowHref ? "link" : undefined}
                  onClick={rowHref ? () => router.push(rowHref(row.original)) : undefined}
                  onKeyDown={
                    rowHref
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(rowHref(row.original));
                          }
                        }
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        page={page}
        perPage={perPage}
        pageCount={pageCount}
        total={total}
        onPageChange={(nextPage) => setParams({ page: String(nextPage) })}
        onPerPageChange={(nextPerPage) =>
          setParams({ perPage: String(nextPerPage), page: "1" })
        }
      />
    </div>
  );
}
