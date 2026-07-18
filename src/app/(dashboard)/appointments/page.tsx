import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { AppointmentsFilters } from "@/features/appointments/components/appointments-filters";
import { AppointmentsTable } from "@/features/appointments/components/appointments-table";
import {
  getDoctors,
  listAppointments,
} from "@/features/appointments/queries/appointment.queries";
import type { AppointmentStatus } from "@/generated/prisma/enums";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { parseTableParams } from "@/shared/utils/table-params";

export const metadata: Metadata = { title: "Citas" };

const STATUSES: AppointmentStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AppointmentsPage({ searchParams }: PageProps) {
  const user = await requirePermissionPage("appointments:read");
  if (user.role === "PATIENT" && !user.patientId) redirect("/dashboard");
  const raw = await searchParams;
  const params = parseTableParams(raw);

  const date =
    typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)
      ? raw.date
      : todayStr();
  const doctorId = typeof raw.doctorId === "string" ? raw.doctorId : undefined;
  const status =
    typeof raw.status === "string" && STATUSES.includes(raw.status as AppointmentStatus)
      ? (raw.status as AppointmentStatus)
      : undefined;

  const [result, doctors] = await Promise.all([
    listAppointments({
      date,
      doctorId,
      patientId: user.role === "PATIENT" ? (user.patientId ?? undefined) : undefined,
      status,
      skip: params.skip,
      take: params.take,
    }),
    getDoctors(),
  ]);

  return (
    <>
      <PageHeader title="Citas" description="Agenda del día y gestión de citas">
        {user.permissions.has("appointments:create") ? (
          <Button asChild>
            <Link href="/appointments/new">
              <Plus /> Nueva cita
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <AppointmentsFilters doctors={doctors} />

      <AppointmentsTable
        result={result}
        canUpdate={user.permissions.has("appointments:update")}
        canCancel={user.permissions.has("appointments:cancel")}
        canStartEncounter={user.permissions.has("encounters:create")}
      />
    </>
  );
}
