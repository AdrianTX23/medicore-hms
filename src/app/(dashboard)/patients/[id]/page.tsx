import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PencilSimple, Warning } from "@phosphor-icons/react/dist/ssr";
import { EmergencyContactsCard } from "@/features/patients/components/emergency-contacts-card";
import { InsuranceCard } from "@/features/patients/components/insurance-card";
import { BLOOD_TYPE_LABELS, GENDER_LABELS } from "@/features/patients/constants";
import {
  getInsuranceProviders,
  getPatientProfile,
} from "@/features/patients/queries/patient.queries";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { formatAge, formatDate, formatDateOnly } from "@/shared/utils/format";

export const metadata: Metadata = { title: "Perfil del paciente" };

type PageProps = { params: Promise<{ id: string }> };

export default async function PatientProfilePage({ params }: PageProps) {
  const user = await requirePermissionPage("patients:read");
  const { id } = await params;

  const [patient, providers] = await Promise.all([
    getPatientProfile(id),
    getInsuranceProviders(),
  ]);
  if (!patient) notFound();

  const canManage = user.permissions.has("patients:update");

  const personalData: Array<[string, string]> = [
    ["Documento", patient.documentId ?? "—"],
    ["Fecha de nacimiento", `${formatDateOnly(patient.birthDate)} (${formatAge(patient.birthDate)})`],
    ["Sexo", GENDER_LABELS[patient.gender]],
    ["Teléfono", patient.phone ?? "—"],
    ["Correo", patient.email ?? "—"],
    ["Dirección", patient.address ?? "—"],
    ["Alta en el sistema", formatDate(patient.createdAt)],
  ];

  return (
    <>
      <PageHeader
        title={`${patient.firstName} ${patient.lastName}`}
        description={`Historia clínica ${patient.mrn}`}
      >
        {canManage ? (
          <Button asChild variant="outline">
            <Link href={`/patients/${patient.id}/edit`}>
              <PencilSimple /> Editar
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{GENDER_LABELS[patient.gender]}</Badge>
        <Badge variant="secondary">{formatAge(patient.birthDate)}</Badge>
        {patient.bloodType ? (
          <Badge variant="outline">Sangre {BLOOD_TYPE_LABELS[patient.bloodType]}</Badge>
        ) : null}
        {patient.allergies.map((allergy) => (
          <Badge key={allergy} variant="destructive" className="gap-1">
            <Warning className="size-3" /> {allergy}
          </Badge>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos personales</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              {personalData.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[160px_1fr] gap-2">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
              {patient.notes ? (
                <div className="grid grid-cols-[160px_1fr] gap-2">
                  <dt className="text-muted-foreground">Notas</dt>
                  <dd className="whitespace-pre-wrap">{patient.notes}</dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <EmergencyContactsCard
            patientId={patient.id}
            contacts={patient.emergencyContacts}
            canManage={canManage}
          />
          <InsuranceCard
            patientId={patient.id}
            insurances={patient.insurances}
            providers={providers}
            canManage={canManage}
          />
        </div>
      </div>
    </>
  );
}
