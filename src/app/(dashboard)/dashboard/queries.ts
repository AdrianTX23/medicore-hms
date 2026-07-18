import "server-only";
import { prisma } from "@/lib/prisma";

export type AppointmentsTrendPoint = { date: string; count: number };

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Appointment counts for each of the last 7 local days (including today),
 * zero-filled. Buckets by local calendar day — same convention as
 * appointments' dayRange() — not the database's UTC day, so the trend lines
 * up with what the clinic actually calls "today".
 */
export async function getAppointmentsTrend(): Promise<AppointmentsTrendPoint[]> {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: start, lt: end },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    select: { scheduledAt: true },
  });

  const counts = new Map<string, number>();
  for (const apt of appointments) {
    const key = localDateKey(apt.scheduledAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const points: AppointmentsTrendPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = localDateKey(d);
    points.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return points;
}
