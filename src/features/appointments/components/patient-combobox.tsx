"use client";

import { useState } from "react";
import { CaretUpDown, Check } from "@phosphor-icons/react";
import { usePatientOptions } from "@/features/appointments/hooks/use-appointments";
import { Button } from "@/shared/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { cn } from "@/shared/utils/cn";

type PatientComboboxProps = {
  value?: { id: string; label: string };
  onSelect: (patient: { id: string; label: string }) => void;
  invalid?: boolean;
};

export function PatientCombobox({ value, onSelect, invalid }: PatientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const { data: options = [], isFetching } = usePatientOptions(debouncedSearch);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          className="w-full justify-between font-normal"
        >
          {value ? value.label : <span className="text-muted-foreground">Busca un paciente...</span>}
          <CaretUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Nombre, documento o MRN..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isFetching ? "Buscando..." : "No se encontraron pacientes"}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={() => {
                    onSelect({ id: option.id, label: option.label });
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("size-4", value?.id === option.id ? "opacity-100" : "opacity-0")}
                  />
                  <div className="grid">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.sublabel}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
