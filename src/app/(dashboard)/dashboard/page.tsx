import type { Metadata } from "next";
import Link from "next/link";
import { endOfDay, startOfDay, startOfMonth } from "date-fns";
import {
  ArrowRight,
  Bed,
  CalendarCheck,
  CalendarPlus,
  CurrencyDollar,
  Flask,
  Pill,
  UserPlus,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { getAppointmentsTrend } from "@/app/(dashboard)/dashboard/queries";
import { requireAuthPage } from "@/lib/auth/guards";
import { AppointmentsTrendChart } from "@/shared/components/charts/appointments-trend-chart";
import { KpiCard } from "@/shared/components/data-viz/kpi-card";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent } from "@/shared/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/shared/utils/format";

export const metadata: Metadata = { title: "Inicio" };

type Kpi = {
  label: string;
  value: string;
  hint: string;
  icon: Icon;
  color: string;
  meter?: { value: number; max: number };
};

type QuickAction = { label: string; href: string; icon: Icon; color: string };

function greeting(hour: number): string {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function DashboardPage() {
  const user = await requireAuthPage();
  const now = new Date();
  const kpis: Kpi[] = [];
  const quickActions: QuickAction[] = [];

  // Every KPI query is independent — fire them all concurrently instead of
  // awaiting one at a time, so the page's DB latency is one round-trip deep
  // (bounded by the slowest query), not N round-trips deep.
  const [todayAppointments, activePatients, bedOccupancy, revenue, trend] = await Promise.all([
    user.permissions.has("appointments:read")
      ? prisma.appointment.count({
          where: {
            scheduledAt: { gte: startOfDay(now), lte: endOfDay(now) },
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
          },
        })
      : Promise.resolve(null),
    user.permissions.has("patients:read")
      ? prisma.patient.count({ where: { deletedAt: null } })
      : Promise.resolve(null),
    user.permissions.has("admissions:read")
      ? Promise.all([prisma.bed.count({ where: { status: "OCCUPIED" } }), prisma.bed.count()])
      : Promise.resolve(null),
    user.permissions.has("billing:read")
      ? prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: startOfMonth(now) } } })
      : Promise.resolve(null),
    user.permissions.has("appointments:read") ? getAppointmentsTrend() : Promise.resolve(null),
  ]);

  if (todayAppointments !== null) {
    kpis.push({
      label: "Citas de hoy",
      value: String(todayAppointments),
      hint: "Programadas y confirmadas",
      icon: CalendarCheck,
      color: "var(--chart-1)",
    });
  }

  if (activePatients !== null) {
    kpis.push({
      label: "Pacientes activos",
      value: String(activePatients),
      hint: "Registros vigentes",
      icon: UsersThree,
      color: "var(--chart-2)",
    });
  }

  if (bedOccupancy !== null) {
    const [occupied, total] = bedOccupancy;
    kpis.push({
      label: "Ocupación de camas",
      value: total > 0 ? `${occupied}/${total}` : "—",
      hint: "Camas ocupadas / totales",
      icon: Bed,
      color: "var(--chart-5)",
      meter: total > 0 ? { value: occupied, max: total } : undefined,
    });
  }

  if (revenue !== null) {
    kpis.push({
      label: "Ingresos del mes",
      value: formatCurrency(revenue._sum.amount?.toNumber() ?? 0),
      hint: "Pagos registrados este mes",
      icon: CurrencyDollar,
      color: "var(--chart-4)",
    });
  }

  if (user.permissions.has("patients:create")) {
    quickActions.push({
      label: "Nuevo paciente",
      href: "/patients/new",
      icon: UserPlus,
      color: "var(--chart-2)",
    });
  }
  if (user.permissions.has("appointments:create")) {
    quickActions.push({
      label: "Nueva cita",
      href: "/appointments/new",
      icon: CalendarPlus,
      color: "var(--chart-1)",
    });
  }
  if (user.permissions.has("laboratory:read")) {
    quickActions.push({
      label: "Laboratorio",
      href: "/laboratory",
      icon: Flask,
      color: "var(--chart-3)",
    });
  }
  if (user.permissions.has("pharmacy:read")) {
    quickActions.push({
      label: "Farmacia",
      href: "/pharmacy",
      icon: Pill,
      color: "var(--chart-5)",
    });
  }

  const displayName = user.staffProfile?.firstName ?? user.email.split("@")[0];
  const today = dateFormatter.format(now);

  return (
    <>
      <PageHeader
        title={`${greeting(now.getHours())}, ${displayName}`}
        description={today.charAt(0).toUpperCase() + today.slice(1)}
      />

      {kpis.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {trend ? (
          <Card className="lg:col-span-2">
            <CardContent>
              <div className="mb-2">
                <p className="text-sm font-medium">Citas de los últimos 7 días</p>
                <p className="text-xs text-muted-foreground">
                  Programadas, confirmadas y completadas
                </p>
              </div>
              <AppointmentsTrendChart data={trend} />
            </CardContent>
          </Card>
        ) : null}

        {quickActions.length > 0 ? (
          <Card className={trend ? undefined : "lg:col-span-3"}>
            <CardContent>
              <p className="mb-3 text-sm font-medium">Accesos rápidos</p>
              <div className="grid gap-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
                  >
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `color-mix(in oklab, ${action.color} 15%, transparent)`,
                        color: action.color,
                      }}
                    >
                      <action.icon className="size-4.5" weight="fill" />
                    </span>
                    <span className="flex-1 font-medium">{action.label}</span>
                    <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
