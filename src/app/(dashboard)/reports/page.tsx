import type { Metadata } from "next";
import { Bed, CurrencyDollar, Stethoscope, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { AppointmentsStatusChart } from "@/features/reports/components/appointments-status-chart";
import { RevenueTrendChart } from "@/features/reports/components/revenue-trend-chart";
import { TopDiagnosesChart } from "@/features/reports/components/top-diagnoses-chart";
import {
  getAppointmentsByStatus,
  getMonthlyRevenue,
  getReportsSummary,
  getTopDiagnoses,
} from "@/features/reports/queries/reports.queries";
import { requirePermissionPage } from "@/lib/auth/guards";
import { KpiCard } from "@/shared/components/data-viz/kpi-card";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent } from "@/shared/components/ui/card";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { formatCurrency } from "@/shared/utils/format";

export const metadata: Metadata = { title: "Reportes" };

export default async function ReportsPage() {
  await requirePermissionPage("reports:read");

  const [summary, revenue, appointmentsByStatus, topDiagnoses] = await Promise.all([
    getReportsSummary(),
    getMonthlyRevenue(),
    getAppointmentsByStatus(),
    getTopDiagnoses(),
  ]);

  return (
    <>
      <PageHeader title="Reportes" description="Indicadores clave de la operación de la clínica" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Pacientes activos"
          value={String(summary.totalPatients)}
          hint="Registros vigentes"
          icon={UsersThree}
          color="var(--chart-2)"
        />
        <KpiCard
          label="Ingresos del año"
          value={formatCurrency(summary.totalRevenueThisYear)}
          hint="Pagos registrados en el año en curso"
          icon={CurrencyDollar}
          color="var(--chart-4)"
        />
        <KpiCard
          label="Consultas este mes"
          value={String(summary.totalEncountersThisMonth)}
          hint="Consultas iniciadas este mes"
          icon={Stethoscope}
          color="var(--chart-1)"
        />
        <KpiCard
          label="Hospitalizaciones activas"
          value={String(summary.activeAdmissions)}
          hint="Pacientes ingresados actualmente"
          icon={Bed}
          color="var(--chart-5)"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <p className="mb-1 text-sm font-medium">Ingresos de los últimos 6 meses</p>
            <p className="mb-2 text-xs text-muted-foreground">Suma de pagos registrados por mes</p>
            <RevenueTrendChart data={revenue} />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="mb-1 text-sm font-medium">Citas por estado</p>
            <p className="mb-2 text-xs text-muted-foreground">Distribución histórica de todas las citas</p>
            {appointmentsByStatus.length === 0 ? (
              <EmptyState title="Sin citas registradas" />
            ) : (
              <AppointmentsStatusChart data={appointmentsByStatus} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent>
            <p className="mb-1 text-sm font-medium">Diagnósticos más frecuentes</p>
            <p className="mb-2 text-xs text-muted-foreground">Top 5 códigos CIE-10 registrados en consultas</p>
            {topDiagnoses.length === 0 ? (
              <EmptyState title="Sin diagnósticos registrados" />
            ) : (
              <TopDiagnosesChart data={topDiagnoses} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
