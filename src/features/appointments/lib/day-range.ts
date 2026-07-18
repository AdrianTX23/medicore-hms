/** Local day range [00:00, 24:00) for a yyyy-mm-dd string (clinic timezone = server timezone). */
export function dayRange(dateStr: string): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 1);
  return { start, end };
}
