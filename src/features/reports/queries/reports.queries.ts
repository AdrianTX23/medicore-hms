import "server-only";
import type { AppointmentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type MonthlyRevenuePoint = { month: string; total: number };

const monthFormatter = new Intl.DateTimeFormat("es-ES", { month: "short" });

/** Revenue (sum of payments) for each of the last 6 local months, zero-filled. */
export async function getMonthlyRevenue(): Promise<MonthlyRevenuePoint[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const payments = await prisma.payment.findMany({
    where: { paidAt: { gte: start } },
    select: { amount: true, paidAt: true },
  });

  const byMonth = new Map<string, number>();
  for (const p of payments) {
    const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + p.amount.toNumber());
  }

  const points: MonthlyRevenuePoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = monthFormatter.format(d);
    points.push({
      month: label.charAt(0).toUpperCase() + label.slice(1),
      total: Math.round((byMonth.get(key) ?? 0) * 100) / 100,
    });
  }
  return points;
}

export type StatusCount = { status: AppointmentStatus; count: number };

export async function getAppointmentsByStatus(): Promise<StatusCount[]> {
  const rows = await prisma.appointment.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  return rows
    .map((r) => ({ status: r.status, count: r._count._all }))
    .sort((a, b) => b.count - a.count);
}

export type DiagnosisCount = { code: string; description: string; count: number };

export async function getTopDiagnoses(limit = 5): Promise<DiagnosisCount[]> {
  const rows = await prisma.diagnosis.groupBy({
    by: ["icd10Code"],
    _count: { _all: true },
    orderBy: { _count: { icd10Code: "desc" } },
    take: limit,
  });
  if (rows.length === 0) return [];

  const codes = await prisma.icd10Code.findMany({
    where: { code: { in: rows.map((r) => r.icd10Code) } },
    select: { code: true, description: true },
  });
  const byCode = new Map(codes.map((c) => [c.code, c.description]));

  return rows.map((r) => ({
    code: r.icd10Code,
    description: byCode.get(r.icd10Code) ?? r.icd10Code,
    count: r._count._all,
  }));
}

export type ReportsSummary = {
  totalPatients: number;
  totalRevenueThisYear: number;
  totalEncountersThisMonth: number;
  activeAdmissions: number;
};

export async function getReportsSummary(): Promise<ReportsSummary> {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalPatients, revenueAgg, totalEncountersThisMonth, activeAdmissions] = await Promise.all([
    prisma.patient.count({ where: { deletedAt: null } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: yearStart } } }),
    prisma.encounter.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.admission.count({ where: { status: "ADMITTED" } }),
  ]);

  return {
    totalPatients,
    totalRevenueThisYear: revenueAgg._sum.amount?.toNumber() ?? 0,
    totalEncountersThisMonth,
    activeAdmissions,
  };
}
