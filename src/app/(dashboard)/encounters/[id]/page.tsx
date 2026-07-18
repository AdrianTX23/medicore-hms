import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Warning } from "@phosphor-icons/react/dist/ssr";
import { AddendaCard } from "@/features/encounters/components/addenda-card";
import { CloseEncounterButton } from "@/features/encounters/components/close-encounter-button";
import { DiagnosesCard } from "@/features/encounters/components/diagnoses-card";
import { NotesCard } from "@/features/encounters/components/notes-card";
import { PrescriptionsCard } from "@/features/encounters/components/prescriptions-card";
import { VitalsCard } from "@/features/encounters/components/vitals-card";
import { LabOrdersCard } from "@/features/laboratory/components/lab-orders-card";
import {
  ENCOUNTER_STATUS_LABELS,
  ENCOUNTER_STATUS_VARIANTS,
  ENCOUNTER_TYPE_LABELS,
} from "@/features/encounters/constants";
import { getEncounterDetail } from "@/features/encounters/queries/encounter.queries";
import { BLOOD_TYPE_LABELS } from "@/features/patients";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatusBadge } from "@/shared/components/data-viz/status-badge";
import { Badge } from "@/shared/components/ui/badge";
import { formatAge, formatDateTime } from "@/shared/utils/format";

export const metadata: Metadata = { title: "Consulta" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EncounterPage({ params }: PageProps) {
  const user = await requirePermissionPage("encounters:read");
  const { id } = await params;

  const encounter = await getEncounterDetail(id, { role: user.role, patientId: user.patientId });
  if (!encounter) notFound();

  const isOpen = encounter.status === "IN_PROGRESS";
  const isOwnDoctor =
    user.role !== "DOCTOR" || encounter.doctorId === user.staffProfile?.id;

  const canEditClinical = isOpen && isOwnDoctor && user.permissions.has("encounters:update");
  const canRecordVitals = isOpen && user.permissions.has("encounters:vitals");
  const canPrescribe = isOpen && isOwnDoctor && user.permissions.has("prescriptions:create");
  const canOrderLab = isOpen && isOwnDoctor && user.permissions.has("laboratory:order");
  const canClose = isOpen && isOwnDoctor && user.permissions.has("encounters:close");
  const canAddendum =
    !isOpen && user.permissions.has("encounters:addendum") && isOwnDoctor;

  const { patient } = encounter;

  return (
    <>
      <PageHeader
        title={`Consulta — ${patient.firstName} ${patient.lastName}`}
        description={`${ENCOUNTER_TYPE_LABELS[encounter.type]} · ${encounter.doctor.firstName} ${encounter.doctor.lastName}${encounter.doctor.specialty ? ` (${encounter.doctor.specialty.name})` : ""} · ${formatDateTime(encounter.createdAt)}`}
      >
        {canClose ? <CloseEncounterButton encounterId={encounter.id} /> : null}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge
          status={encounter.status}
          labels={ENCOUNTER_STATUS_LABELS}
          variants={ENCOUNTER_STATUS_VARIANTS}
        />
        <Badge variant="secondary" asChild>
          <Link href={`/patients/${patient.id}`}>{patient.mrn}</Link>
        </Badge>
        <Badge variant="secondary">{formatAge(patient.birthDate)}</Badge>
        {patient.bloodType ? (
          <Badge variant="outline">Sangre {BLOOD_TYPE_LABELS[patient.bloodType]}</Badge>
        ) : null}
        {patient.allergies.map((allergy) => (
          <Badge key={allergy} variant="destructive" className="gap-1">
            <Warning className="size-3" /> Alergia: {allergy}
          </Badge>
        ))}
        {encounter.closedAt ? (
          <span className="text-xs text-muted-foreground">
            Cerrada el {formatDateTime(encounter.closedAt)}
          </span>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <NotesCard
            encounterId={encounter.id}
            chiefComplaint={encounter.chiefComplaint}
            notes={encounter.notes}
            treatmentPlan={encounter.treatmentPlan}
            canEdit={canEditClinical}
          />
          <DiagnosesCard
            encounterId={encounter.id}
            diagnoses={encounter.diagnoses}
            canEdit={canEditClinical}
          />
        </div>
        <div className="space-y-6">
          <VitalsCard
            encounterId={encounter.id}
            vitals={encounter.vitalSigns}
            canRecord={canRecordVitals}
          />
          <PrescriptionsCard
            encounterId={encounter.id}
            prescriptions={encounter.prescriptions}
            canPrescribe={canPrescribe}
          />
          <LabOrdersCard encounterId={encounter.id} canOrder={canOrderLab} />
          {!isOpen || encounter.addenda.length > 0 ? (
            <AddendaCard
              encounterId={encounter.id}
              addenda={encounter.addenda}
              canAdd={canAddendum}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
