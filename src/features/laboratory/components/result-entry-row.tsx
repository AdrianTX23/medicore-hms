"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Warning } from "@phosphor-icons/react";
import { toast } from "sonner";
import { enterResult } from "@/features/laboratory/actions/lab.actions";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { TableCell, TableRow } from "@/shared/components/ui/table";
import { formatDateTime } from "@/shared/utils/format";

type ResultEntryRowProps = {
  item: {
    id: string;
    labTest: { code: string; name: string; unit: string | null };
    result: {
      value: string;
      unit: string | null;
      isAbnormal: boolean;
      createdAt: Date;
      performedBy: {
        email: string;
        staffProfile: { firstName: string; lastName: string } | null;
      };
    } | null;
  };
  canEnter: boolean;
};

export function ResultEntryRow({ item, canEnter }: ResultEntryRowProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!value.trim()) {
      toast.error("Indica el valor del resultado");
      return;
    }
    startTransition(async () => {
      const result = await enterResult({ labOrderItemId: item.id, value: value.trim() });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Resultado registrado");
      router.refresh();
    });
  }

  return (
    <TableRow>
      <TableCell>
        <div className="grid">
          <span className="font-medium">{item.labTest.name}</span>
          <span className="font-mono text-xs text-muted-foreground">{item.labTest.code}</span>
        </div>
      </TableCell>
      <TableCell>
        {item.result ? (
          <div className="flex items-center gap-2">
            <span className="tabular-nums">
              {item.result.value} {item.result.unit ?? item.labTest.unit ?? ""}
            </span>
            {item.result.isAbnormal ? (
              <Badge variant="destructive" className="gap-1">
                <Warning className="size-3" /> Anormal
              </Badge>
            ) : null}
          </div>
        ) : canEnter ? (
          <div className="flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Valor ${item.labTest.unit ? `(${item.labTest.unit})` : ""}`}
              className="h-8 w-40"
            />
            <Button size="sm" onClick={submit} disabled={isPending}>
              Guardar
            </Button>
          </div>
        ) : (
          <span className="text-muted-foreground">Pendiente</span>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {item.result
          ? `${formatDateTime(item.result.createdAt)} · ${
              item.result.performedBy.staffProfile
                ? `${item.result.performedBy.staffProfile.firstName} ${item.result.performedBy.staffProfile.lastName}`
                : item.result.performedBy.email
            }`
          : "—"}
      </TableCell>
    </TableRow>
  );
}
