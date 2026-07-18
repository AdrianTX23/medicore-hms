"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getMedications,
  searchIcd10Codes,
} from "@/features/encounters/actions/encounter.actions";

export const encounterKeys = {
  all: ["encounters"] as const,
  icd10: (q: string) => [...encounterKeys.all, "icd10", q] as const,
  medications: () => [...encounterKeys.all, "medications"] as const,
};

export function useIcd10Search(q: string) {
  return useQuery({
    queryKey: encounterKeys.icd10(q),
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const result = await searchIcd10Codes({ q: q || undefined });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}

export function useMedications() {
  return useQuery({
    queryKey: encounterKeys.medications(),
    staleTime: 5 * 60 * 1000, // catalog changes rarely
    queryFn: async () => {
      const result = await getMedications({});
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}
