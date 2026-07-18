import { z } from "zod";

/**
 * Contract between list pages (server) and the generic DataTable (client):
 * pagination/search state lives in the URL — shareable, back-button friendly,
 * and the server always paginates (never fetch unbounded lists).
 */
export const tableParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  perPage: z.coerce.number().int().min(5).max(100).catch(10),
  q: z.string().trim().max(200).optional().catch(undefined),
  sort: z.string().max(50).optional().catch(undefined),
  dir: z.enum(["asc", "desc"]).catch("desc"),
});

export type TableParams = z.infer<typeof tableParamsSchema>;

export function parseTableParams(
  searchParams: Record<string, string | string[] | undefined>,
): TableParams & { skip: number; take: number } {
  const parsed = tableParamsSchema.parse(searchParams);
  return {
    ...parsed,
    skip: (parsed.page - 1) * parsed.perPage,
    take: parsed.perPage,
  };
}

/** Shape every paginated query in the features' queries layer returns. */
export type Paginated<T> = {
  rows: T[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
};
