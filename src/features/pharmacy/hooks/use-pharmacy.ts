"use client";

import { useQuery } from "@tanstack/react-query";
import { getMedications } from "@/features/pharmacy/actions/pharmacy.actions";

export const pharmacyKeys = {
  all: ["pharmacy"] as const,
  medications: () => [...pharmacyKeys.all, "medications"] as const,
};

export function useMedicationOptions() {
  return useQuery({
    queryKey: pharmacyKeys.medications(),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const result = await getMedications({});
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}
