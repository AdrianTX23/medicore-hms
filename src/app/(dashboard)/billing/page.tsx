import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { InvoicesTable } from "@/features/billing/components/invoices-table";
import { InvoiceStatusFilter } from "@/features/billing/components/status-filter";
import { listInvoices } from "@/features/billing/queries/billing.queries";
import type { InvoiceStatus } from "@/generated/prisma/enums";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { parseTableParams } from "@/shared/utils/table-params";

export const metadata: Metadata = { title: "Facturación" };

const STATUSES: InvoiceStatus[] = ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "VOID"];

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BillingPage({ searchParams }: PageProps) {
  const user = await requirePermissionPage("billing:read");
  if (user.role === "PATIENT" && !user.patientId) redirect("/dashboard");
  const raw = await searchParams;
  const params = parseTableParams(raw);

  const status =
    typeof raw.status === "string" && STATUSES.includes(raw.status as InvoiceStatus)
      ? (raw.status as InvoiceStatus)
      : undefined;

  const result = await listInvoices({
    status,
    patientId: user.role === "PATIENT" ? (user.patientId ?? undefined) : undefined,
    skip: params.skip,
    take: params.take,
  });

  return (
    <>
      <PageHeader title="Facturación" description="Facturas, pagos y cobertura de seguros">
        {user.permissions.has("billing:create") ? (
          <Button asChild>
            <Link href="/billing/new">
              <Plus /> Nueva factura
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <InvoiceStatusFilter />
      <InvoicesTable result={result} />
    </>
  );
}
