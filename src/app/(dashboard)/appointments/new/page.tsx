import type { Metadata } from "next";
import { AppointmentForm } from "@/features/appointments/components/appointment-form";
import { getDoctors } from "@/features/appointments/queries/appointment.queries";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";

export const metadata: Metadata = { title: "Nueva cita" };

export default async function NewAppointmentPage() {
  await requirePermissionPage("appointments:create");
  const doctors = await getDoctors();

  return (
    <>
      <PageHeader
        title="Nueva cita"
        description="Solo se muestran los horarios realmente disponibles del médico"
      />
      <AppointmentForm doctors={doctors} />
    </>
  );
}
