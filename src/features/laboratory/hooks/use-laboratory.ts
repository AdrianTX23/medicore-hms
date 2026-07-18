"use client";

import { useQuery } from "@tanstack/react-query";
import { getLabTests } from "@/features/laboratory/actions/lab.actions";

export const laboratoryKeys = {
  all: ["laboratory"] as const,
  tests: (q: string) => [...laboratoryKeys.all, "tests", q] as const,
};

export function useLabTestOptions(q: string) {
  return useQuery({
    queryKey: laboratoryKeys.tests(q),
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const result = await getLabTests({ q: q || undefined });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });
}
