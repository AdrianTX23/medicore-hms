"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDoctorSlots,
  getPatientOptions,
} from "@/features/appointments/actions/appointment.actions";

/** Query key factory — single source for invalidation. */
export const appointmentKeys = {
  all: ["appointments"] as const,
  slots: (doctorId: string, date: string) =>
    [...appointmentKeys.all, "slots", doctorId, date] as const,
  patientOptions: (q: string) => [...appointmentKeys.all, "patient-options", q] as const,
};

export function useDoctorSlots(doctorId: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: appointmentKeys.slots(doctorId ?? "", date ?? ""),
    enabled: !!doctorId && !!date,
    queryFn: async () => {
      const result = await getDoctorSlots({ doctorId: doctorId!, date: date! });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}

export function usePatientOptions(q: string) {
  return useQuery({
    queryKey: appointmentKeys.patientOptions(q),
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const result = await getPatientOptions({ q: q || undefined });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}
