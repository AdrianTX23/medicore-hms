import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_VARIANTS, PAYMENT_METHOD_LABELS } from "@/features/billing/constants";
import { InvoiceActions } from "@/features/billing/components/invoice-actions";
import { getInvoiceDetail } from "@/features/billing/queries/billing.queries";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";
import { StatusBadge } from "@/shared/components/data-viz/status-badge";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatCurrency, formatDateTime } from "@/shared/utils/format";

export const metadata: Metadata = { title: "Factura" };

type PageProps = { params: Promise<{ id: string }> };

export default async function InvoiceDetailPage({ params }: PageProps) {
  const user = await requirePermissionPage("billing:read");
  const { id } = await params;

  const invoice = await getInvoiceDetail(id, { role: user.role, patientId: user.patientId });
  if (!invoice) notFound();

  return (
    <>
      <PageHeader
        title={invoice.invoiceNumber}
        description={`${invoice.patient.firstName} ${invoice.patient.lastName} · ${invoice.patient.mrn}`}
      >
        <InvoiceActions
          invoiceId={invoice.id}
          status={invoice.status}
          balance={invoice.balance}
          canUpdate={user.permissions.has("billing:update")}
          canPay={user.permissions.has("billing:pay")}
          canVoid={user.permissions.has("billing:void")}
        />
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={invoice.status} labels={INVOICE_STATUS_LABELS} variants={INVOICE_STATUS_VARIANTS} />
        <Badge variant="secondary" asChild>
          <Link href={`/patients/${invoice.patient.id}`}>{invoice.patient.mrn}</Link>
        </Badge>
        {invoice.encounter ? (
          <Badge variant="outline" asChild>
            <Link href={`/encounters/${invoice.encounter.id}`}>
              Consulta: {invoice.encounter.chiefComplaint}
            </Link>
          </Badge>
        ) : null}
        <span className="text-xs text-muted-foreground">
          Creada el {formatDateTime(invoice.createdAt)}
          {invoice.issuedAt ? ` · Emitida el ${formatDateTime(invoice.issuedAt)}` : ""}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ítems</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 space-y-1.5 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.insuranceCovered > 0 ? (
                <div className="flex justify-between text-status-good">
                  <span>Cobertura de seguro</span>
                  <span className="tabular-nums">−{formatCurrency(invoice.insuranceCovered)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Pagado</span>
                <span className="tabular-nums">{formatCurrency(invoice.paid)}</span>
              </div>
              {invoice.balance > 0 && invoice.status !== "VOID" ? (
                <div className="flex justify-between font-medium text-status-critical">
                  <span>Saldo pendiente</span>
                  <span className="tabular-nums">{formatCurrency(invoice.balance)}</span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de pagos</CardTitle>
          </CardHeader>
          <CardContent>
            {invoice.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
            ) : (
              <ul className="space-y-3">
                {invoice.payments.map((payment) => (
                  <li key={payment.id} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium tabular-nums">
                        {formatCurrency(payment.amount)}
                      </span>
                      <Badge variant="outline">{PAYMENT_METHOD_LABELS[payment.method]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(payment.paidAt)} ·{" "}
                      {payment.receivedBy.staffProfile
                        ? `${payment.receivedBy.staffProfile.firstName} ${payment.receivedBy.staffProfile.lastName}`
                        : payment.receivedBy.email}
                    </p>
                    {payment.reference ? (
                      <p className="text-xs text-muted-foreground">Ref: {payment.reference}</p>
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
