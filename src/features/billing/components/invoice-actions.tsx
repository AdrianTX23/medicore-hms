"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneTilt, Prohibit } from "@phosphor-icons/react";
import { toast } from "sonner";
import { issueInvoice, voidInvoice } from "@/features/billing/actions/billing.actions";
import { RecordPaymentDialog } from "@/features/billing/components/record-payment-dialog";
import type { InvoiceStatus } from "@/generated/prisma/enums";
import { Button } from "@/shared/components/ui/button";

type InvoiceActionsProps = {
  invoiceId: string;
  status: InvoiceStatus;
  balance: number;
  canUpdate: boolean;
  canPay: boolean;
  canVoid: boolean;
};

export function InvoiceActions({
  invoiceId,
  status,
  balance,
  canUpdate,
  canPay,
  canVoid,
}: InvoiceActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleIssue() {
    startTransition(async () => {
      const result = await issueInvoice({ invoiceId });
      if (result.success) toast.success("Factura emitida");
      else toast.error(result.error);
      router.refresh();
    });
  }

  function handleVoid() {
    startTransition(async () => {
      const result = await voidInvoice({ invoiceId });
      if (result.success) toast.success("Factura anulada");
      else toast.error(result.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canUpdate && status === "DRAFT" ? (
        <Button size="sm" onClick={handleIssue} disabled={isPending}>
          <PaperPlaneTilt /> Emitir factura
        </Button>
      ) : null}
      {canPay && (status === "ISSUED" || status === "PARTIALLY_PAID") ? (
        <RecordPaymentDialog invoiceId={invoiceId} balance={balance} />
      ) : null}
      {canVoid && (status === "DRAFT" || status === "ISSUED" || status === "PARTIALLY_PAID") ? (
        <Button size="sm" variant="outline" onClick={handleVoid} disabled={isPending}>
          <Prohibit /> Anular
        </Button>
      ) : null}
    </div>
  );
}
