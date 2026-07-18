"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { APPOINTMENT_STATUS_LABELS } from "@/features/appointments/constants";
import type { DoctorOption } from "@/features/appointments/queries/appointment.queries";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

const ALL = "__all__";

export function AppointmentsFilters({ doctors }: { doctors: DoctorOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams);
    if (value === null || value === ALL) params.delete(key);
    else params.set(key, value);
    params.set("page", "1");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        type="date"
        className="w-fit"
        value={searchParams.get("date") ?? ""}
        onChange={(e) => setParam("date", e.target.value || null)}
        aria-label="Fecha de la agenda"
      />

      <Select
        value={searchParams.get("doctorId") ?? ALL}
        onValueChange={(v) => setParam("doctorId", v)}
      >
        <SelectTrigger className="w-56" aria-label="Filtrar por médico">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los médicos</SelectItem>
          {doctors.map((doctor) => (
            <SelectItem key={doctor.id} value={doctor.id}>
              {doctor.firstName} {doctor.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("status") ?? ALL}
        onValueChange={(v) => setParam("status", v)}
      >
        <SelectTrigger className="w-44" aria-label="Filtrar por estado">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los estados</SelectItem>
          {Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
