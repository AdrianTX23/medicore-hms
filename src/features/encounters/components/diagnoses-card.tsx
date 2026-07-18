"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CaretUpDown, FirstAid, Plus, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  addDiagnosis,
  removeDiagnosis,
} from "@/features/encounters/actions/encounter.actions";
import { useIcd10Search } from "@/features/encounters/hooks/use-encounters";
import type { EncounterDetail } from "@/features/encounters/queries/encounter.queries";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { Label } from "@/shared/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useDebounce } from "@/shared/hooks/use-debounce";

type DiagnosesCardProps = {
  encounterId: string;
  diagnoses: EncounterDetail["diagnoses"];
  canEdit: boolean;
};

export function DiagnosesCard({ encounterId, diagnoses, canEdit }: DiagnosesCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ code: string; description: string }>();
  const [isPrimary, setIsPrimary] = useState(diagnoses.length === 0);
  const [isPending, startTransition] = useTransition();

  const debounced = useDebounce(search);
  const { data: options = [], isFetching } = useIcd10Search(debounced);

  function submit() {
    if (!selected) {
      toast.error("Selecciona un diagnóstico CIE-10");
      return;
    }
    startTransition(async () => {
      const result = await addDiagnosis({
        encounterId,
        icd10Code: selected.code,
        isPrimary,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Diagnóstico añadido");
      setSelected(undefined);
      setOpen(false);
      router.refresh();
    });
  }

  function onRemove(diagnosisId: string) {
    startTransition(async () => {
      const result = await removeDiagnosis({ diagnosisId, encounterId });
      if (result.success) toast.success("Diagnóstico eliminado");
      else toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <FirstAid className="size-4" /> Diagnósticos (CIE-10)
        </CardTitle>
        {canEdit ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus /> Añadir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir diagnóstico</DialogTitle>
              </DialogHeader>
              <Field>
                <FieldLabel>Código CIE-10</FieldLabel>
                <Popover open={comboOpen} onOpenChange={setComboOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                      {selected ? (
                        `${selected.code} — ${selected.description}`
                      ) : (
                        <span className="text-muted-foreground">Busca por código o descripción...</span>
                      )}
                      <CaretUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="hipertensión, J45, cefalea..."
                        value={search}
                        onValueChange={setSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {isFetching ? "Buscando..." : "Sin resultados"}
                        </CommandEmpty>
                        <CommandGroup>
                          {options.map((o) => (
                            <CommandItem
                              key={o.code}
                              value={o.code}
                              onSelect={() => {
                                setSelected({ code: o.code, description: o.description });
                                setComboOpen(false);
                              }}
                            >
                              <span className="font-mono text-xs">{o.code}</span>
                              <span className="truncate">{o.description}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </Field>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPrimary"
                  checked={isPrimary}
                  onCheckedChange={(c) => setIsPrimary(c === true)}
                />
                <Label htmlFor="isPrimary">Diagnóstico principal</Label>
              </div>
              <Button onClick={submit} disabled={isPending}>
                {isPending ? "Guardando..." : "Añadir diagnóstico"}
              </Button>
            </DialogContent>
          </Dialog>
        ) : null}
      </CardHeader>
      <CardContent>
        {diagnoses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin diagnósticos — se requiere al menos uno para cerrar la consulta
          </p>
        ) : (
          <ul className="space-y-2">
            {diagnoses.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {d.icd10Code}
                  </Badge>
                  <span>{d.icd10.description}</span>
                  {d.isPrimary ? <Badge>Principal</Badge> : null}
                </div>
                {canEdit ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Eliminar ${d.icd10Code}`}
                    onClick={() => onRemove(d.id)}
                    disabled={isPending}
                  >
                    <Trash />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
