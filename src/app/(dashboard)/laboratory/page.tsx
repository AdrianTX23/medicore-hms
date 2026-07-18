import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LabQueueTable } from "@/features/laboratory/components/lab-queue-table";
import { LabStatusFilter } from "@/features/laboratory/components/lab-status-filter";
import { listLabOrders } from "@/features/laboratory/queries/lab.queries";
import type { LabOrderStatus } from "@/generated/prisma/enums";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";
import { parseTableParams } from "@/shared/utils/table-params";

export const metadata: Metadata = { title: "Laboratorio" };

const STATUSES: LabOrderStatus[] = [
  "ORDERED",
  "SAMPLE_COLLECTED",
  "IN_PROGRESS",
  "COMPLETED",
  "VALIDATED",
  "CANCELLED",
];

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LaboratoryPage({ searchParams }: PageProps) {
  const user = await requirePermissionPage("laboratory:read");
  if (user.role === "PATIENT" && !user.patientId) redirect("/dashboard");
  const raw = await searchParams;
  const params = parseTableParams(raw);

  const status =
    typeof raw.status === "string" && STATUSES.includes(raw.status as LabOrderStatus)
      ? (raw.status as LabOrderStatus)
      : undefined;

  const result = await listLabOrders({
    status,
    patientId: user.role === "PATIENT" ? (user.patientId ?? undefined) : undefined,
    skip: params.skip,
    take: params.take,
  });

  return (
    <>
      <PageHeader
        title="Laboratorio"
        description="Cola de órdenes ordenadas por prioridad y antigüedad"
      />
      <LabStatusFilter />
      <LabQueueTable result={result} />
    </>
  );
}
