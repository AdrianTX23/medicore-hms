import type { Metadata } from "next";
import { AdmitPatientForm } from "@/features/admissions/components/admit-patient-form";
import { getAvailableBeds } from "@/features/admissions/queries/admission.queries";
import { getDoctors } from "@/features/appointments/queries/appointment.queries";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";

export const metadata: Metadata = { title: "Nuevo ingreso" };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewAdmissionPage({ searchParams }: PageProps) {
  await requirePermissionPage("admissions:create");
  const raw = await searchParams;
  const initialBedId = typeof raw.bedId === "string" ? raw.bedId : undefined;

  const [beds, doctors] = await Promise.all([getAvailableBeds(), getDoctors()]);

  return (
    <>
      <PageHeader title="Nuevo ingreso" description="Registra la hospitalización de un paciente" />
      <AdmitPatientForm beds={beds} doctors={doctors} initialBedId={initialBedId} />
    </>
  );
}
