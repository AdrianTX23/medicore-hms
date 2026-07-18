import type { Metadata } from "next";
import { PatientForm } from "@/features/patients/components/patient-form";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";

export const metadata: Metadata = { title: "Nuevo paciente" };

export default async function NewPatientPage() {
  await requirePermissionPage("patients:create");

  return (
    <>
      <PageHeader
        title="Nuevo paciente"
        description="El número de historia (MRN) se asigna automáticamente al guardar"
      />
      <PatientForm />
    </>
  );
}
