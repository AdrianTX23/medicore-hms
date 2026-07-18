"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flask, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { createLabOrder } from "@/features/laboratory/actions/lab.actions";
import { useLabTestOptions } from "@/features/laboratory/hooks/use-laboratory";
import { LAB_PRIORITY_LABELS } from "@/features/laboratory/constants";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useDebounce } from "@/shared/hooks/use-debounce";

export function OrderLabTestDialog({ encounterId }: { encounterId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [priority, setPriority] = useState<"ROUTINE" | "URGENT" | "STAT">("ROUTINE");
  const [isPending, startTransition] = useTransition();

  const debounced = useDebounce(search);
  const { data: tests = [] } = useLabTestOptions(debounced);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    if (selected.size === 0) {
      toast.error("Selecciona al menos un examen");
      return;
    }
    startTransition(async () => {
      const result = await createLabOrder({
        encounterId,
        labTestIds: [...selected],
        priority,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Orden de laboratorio creada");
      setSelected(new Set());
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Flask /> Ordenar laboratorio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ordenar exámenes de laboratorio</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field>
            <FieldLabel htmlFor="labSearch">Buscar examen</FieldLabel>
            <Input
              id="labSearch"
              placeholder="Hemograma, glucosa, TSH..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
            {tests.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">Sin resultados</p>
            ) : (
              tests.map((test) => (
                <label
                  key={test.id}
                  className="flex cursor-pointer items-center gap-2 rounded-sm p-2 text-sm hover:bg-accent"
                >
                  <Checkbox
                    checked={selected.has(test.id)}
                    onCheckedChange={() => toggle(test.id)}
                  />
                  <span className="flex-1">{test.name}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {test.code}
                  </Badge>
                </label>
              ))
            )}
          </div>
          <Field>
            <FieldLabel>Prioridad</FieldLabel>
            <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LAB_PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Button onClick={submit} disabled={isPending}>
            <Plus /> {isPending ? "Creando orden..." : `Ordenar (${selected.size})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
