import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Warning } from "@phosphor-icons/react/dist/ssr";
import { AdmissionActions } from "@/features/admissions/components/admission-actions";
import { ADMISSION_STATUS_LABELS } from "@/features/admissions/constants";
import { getAdmissionDetail, getAvailableBeds } from "@/features/admissions/queries/admission.queries";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatAge, formatDateTime } from "@/shared/utils/format";

export const metadata: Metadata = { title: "Hospitalización" };

type PageProps = { params: Promise<{ id: string }> };

export default async function AdmissionDetailPage({ params }: PageProps) {
  const user = await requirePermissionPage("admissions:read");
  const { id } = await params;

  const admission = await getAdmissionDetail(id);
  if (!admission) notFound();

  const canManage = user.permissions.has("admissions:update") && admission.status === "ADMITTED";
  const availableBeds = canManage ? await getAvailableBeds() : [];

  return (
    <>
      <PageHeader
        title={`${admission.patient.firstName} ${admission.patient.lastName}`}
        description={`Cama ${admission.bed.code} · ${admission.bed.room.department.name}`}
      >
        {canManage ? (
          <AdmissionActions admissionId={admission.id} availableBeds={availableBeds} />
        ) : null}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={admission.status === "ADMITTED" ? "default" : "outline"}>
          {ADMISSION_STATUS_LABELS[admission.status]}
        </Badge>
        <Badge variant="secondary" asChild>
          <Link href={`/patients/${admission.patient.id}`}>{admission.patient.mrn}</Link>
        </Badge>
        <Badge variant="secondary">{formatAge(admission.patient.birthDate)}</Badge>
        {admission.patient.allergies.map((allergy) => (
          <Badge key={allergy} variant="destructive" className="gap-1">
            <Warning className="size-3" /> {allergy}
          </Badge>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos de la hospitalización</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <dt className="text-muted-foreground">Médico responsable</dt>
                <dd>
                  {admission.attendingDoctor.firstName} {admission.attendingDoctor.lastName}
                  {admission.attendingDoctor.specialty ? ` (${admission.attendingDoctor.specialty.name})` : ""}
                </dd>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <dt className="text-muted-foreground">Diagnóstico de ingreso</dt>
                <dd>{admission.admissionDiagnosis}</dd>
              </div>
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <dt className="text-muted-foreground">Fecha de ingreso</dt>
                <dd>{formatDateTime(admission.admittedAt)}</dd>
              </div>
              {admission.dischargedAt ? (
                <div className="grid grid-cols-[160px_1fr] gap-2">
                  <dt className="text-muted-foreground">Fecha de alta</dt>
                  <dd>{formatDateTime(admission.dischargedAt)}</dd>
                </div>
              ) : null}
              {admission.dischargeSummary ? (
                <div className="grid grid-cols-[160px_1fr] gap-2">
                  <dt className="text-muted-foreground">Resumen de alta</dt>
                  <dd className="whitespace-pre-wrap">{admission.dischargeSummary}</dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de traslados</CardTitle>
          </CardHeader>
          <CardContent>
            {admission.transfers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin traslados registrados</p>
            ) : (
              <ul className="space-y-3">
                {admission.transfers.map((transfer) => (
                  <li key={transfer.id} className="text-sm">
                    <p className="font-medium">
                      {transfer.fromBed.code} → {transfer.toBed.code}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(transfer.transferredAt)}</p>
                    {transfer.reason ? (
                      <p className="text-xs text-muted-foreground">Motivo: {transfer.reason}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
