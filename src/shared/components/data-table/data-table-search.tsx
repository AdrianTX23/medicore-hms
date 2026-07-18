"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Input } from "@/shared/components/ui/input";

/** Debounced search box bound to the `q` URL param (resets to page 1). */
export function DataTableSearch({ placeholder = "Buscar..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (value === current) return;

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value) params.set("q", value);
      else params.delete("q");
      params.set("page", "1");
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, 350);

    return () => clearTimeout(timeout);
  }, [value, searchParams, pathname, router]);

  return (
    <div className="relative w-full max-w-sm">
      <MagnifyingGlass className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
