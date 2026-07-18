import type { Metadata } from "next";
import { GenerateFromEncounterPanel } from "@/features/billing/components/generate-from-encounter-panel";
import { ManualInvoiceForm } from "@/features/billing/components/manual-invoice-form";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";

export const metadata: Metadata = { title: "Nueva factura" };

export default async function NewInvoicePage() {
  await requirePermissionPage("billing:create");

  return (
    <>
      <PageHeader
        title="Nueva factura"
        description="Genera la factura desde una consulta cerrada o créala manualmente"
      />
      <Tabs defaultValue="encounter">
        <TabsList>
          <TabsTrigger value="encounter">Desde una consulta</TabsTrigger>
          <TabsTrigger value="manual">Factura manual</TabsTrigger>
        </TabsList>
        <TabsContent value="encounter" className="mt-4">
          <GenerateFromEncounterPanel />
        </TabsContent>
        <TabsContent value="manual" className="mt-4">
          <ManualInvoiceForm />
        </TabsContent>
      </Tabs>
    </>
  );
}
