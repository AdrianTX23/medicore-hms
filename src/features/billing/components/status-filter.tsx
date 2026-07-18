"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { INVOICE_STATUS_LABELS } from "@/features/billing/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

const ALL = "__all__";

export function InvoiceStatusFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setStatus(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === ALL) params.delete("status");
    else params.set("status", value);
    params.set("page", "1");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <Select value={searchParams.get("status") ?? ALL} onValueChange={setStatus}>
      <SelectTrigger className="w-52" aria-label="Filtrar por estado">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>Todos los estados</SelectItem>
        {Object.entries(INVOICE_STATUS_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
