import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PatientForm } from "@/features/patients/components/patient-form";
import { getPatientProfile } from "@/features/patients/queries/patient.queries";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";

export const metadata: Metadata = { title: "Editar paciente" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditPatientPage({ params }: PageProps) {
  await requirePermissionPage("patients:update");
  const { id } = await params;

  const patient = await getPatientProfile(id);
  if (!patient) notFound();

  return (
    <>
      <PageHeader
        title={`Editar a ${patient.firstName} ${patient.lastName}`}
        description={`Historia clínica ${patient.mrn}`}
      />
      <PatientForm
        patientId={patient.id}
        defaultValues={{
          firstName: patient.firstName,
          lastName: patient.lastName,
          documentId: patient.documentId ?? "",
          birthDate: patient.birthDate.toISOString().slice(0, 10),
          gender: patient.gender,
          bloodType: patient.bloodType ?? undefined,
          phone: patient.phone ?? "",
          email: patient.email ?? "",
          address: patient.address ?? "",
          allergies: patient.allergies.join("\n"),
          notes: patient.notes ?? "",
        }}
      />
    </>
  );
}
