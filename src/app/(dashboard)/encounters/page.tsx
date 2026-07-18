import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EncountersTable } from "@/features/encounters/components/encounters-table";
import { listEncounters } from "@/features/encounters/queries/encounter.queries";
import type { EncounterStatus } from "@/generated/prisma/enums";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";
import { parseTableParams } from "@/shared/utils/table-params";

export const metadata: Metadata = { title: "Consultas" };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EncountersPage({ searchParams }: PageProps) {
  const user = await requirePermissionPage("encounters:read");
  if (user.role === "PATIENT" && !user.patientId) redirect("/dashboard");
  const raw = await searchParams;
  const params = parseTableParams(raw);

  const status =
    raw.status === "IN_PROGRESS" || raw.status === "CLOSED"
      ? (raw.status as EncounterStatus)
      : undefined;

  // Doctors see their own consultations; patients see only their own; other clinical roles see all.
  const result = await listEncounters({
    doctorId: user.role === "DOCTOR" ? user.staffProfile?.id : undefined,
    patientId: user.role === "PATIENT" ? (user.patientId ?? undefined) : undefined,
    status,
    skip: params.skip,
    take: params.take,
  });

  return (
    <>
      <PageHeader
        title="Consultas"
        description={
          user.role === "DOCTOR"
            ? "Tus consultas médicas — las cerradas son inmutables"
            : "Historial de consultas de la clínica"
        }
      />
      <EncountersTable result={result} />
    </>
  );
}
