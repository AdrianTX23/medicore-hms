import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Warning } from "@phosphor-icons/react/dist/ssr";
import { LabOrderActions } from "@/features/laboratory/components/lab-order-actions";
import { ResultEntryRow } from "@/features/laboratory/components/result-entry-row";
import {
  LAB_ORDER_STATUS_LABELS,
  LAB_ORDER_STATUS_VARIANTS,
  LAB_PRIORITY_LABELS,
  LAB_PRIORITY_VARIANTS,
} from "@/features/laboratory/constants";
import { getLabOrderDetail } from "@/features/laboratory/queries/lab.queries";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatusBadge } from "@/shared/components/data-viz/status-badge";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { formatDateTime } from "@/shared/utils/format";

export const metadata: Metadata = { title: "Orden de laboratorio" };

type PageProps = { params: Promise<{ id: string }> };

export default async function LabOrderPage({ params }: PageProps) {
  const user = await requirePermissionPage("laboratory:read");
  const { id } = await params;

  const order = await getLabOrderDetail(id, { role: user.role, patientId: user.patientId });
  if (!order) notFound();

  const canEnterResults =
    user.permissions.has("laboratory:results") &&
    (order.status === "SAMPLE_COLLECTED" || order.status === "IN_PROGRESS");

  return (
    <>
      <PageHeader
        title={`Orden de laboratorio — ${order.patient.firstName} ${order.patient.lastName}`}
        description={`Ordenada por ${order.orderedBy.firstName} ${order.orderedBy.lastName} · ${formatDateTime(order.createdAt)}`}
      >
        <LabOrderActions
          order={order}
          canManage={user.permissions.has("laboratory:results")}
          canValidate={user.permissions.has("laboratory:validate")}
        />
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} labels={LAB_ORDER_STATUS_LABELS} variants={LAB_ORDER_STATUS_VARIANTS} />
        <StatusBadge status={order.priority} labels={LAB_PRIORITY_LABELS} variants={LAB_PRIORITY_VARIANTS} />
        <Badge variant="secondary" asChild>
          <Link href={`/patients/${order.patient.id}`}>{order.patient.mrn}</Link>
        </Badge>
        {order.patient.allergies.map((a) => (
          <Badge key={a} variant="destructive" className="gap-1">
            <Warning className="size-3" /> Alergia: {a}
          </Badge>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Examen</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Registrado por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <ResultEntryRow key={item.id} item={item} canEnter={canEnterResults} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
