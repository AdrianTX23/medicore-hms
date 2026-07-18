"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getBillableEncounters,
  getServices,
} from "@/features/billing/actions/billing.actions";

export const billingKeys = {
  all: ["billing"] as const,
  services: () => [...billingKeys.all, "services"] as const,
  billableEncounters: (q: string) => [...billingKeys.all, "billable-encounters", q] as const,
};

export function useServiceOptions() {
  return useQuery({
    queryKey: billingKeys.services(),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const result = await getServices({});
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}

export function useBillableEncounters(q: string) {
  return useQuery({
    queryKey: billingKeys.billableEncounters(q),
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const result = await getBillableEncounters({ q: q || undefined });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}
