import type { Metadata } from "next";
import { InventoryTable } from "@/features/pharmacy/components/inventory-table";
import { PendingPrescriptionsList } from "@/features/pharmacy/components/pending-prescriptions-list";
import { listInventory, listPendingPrescriptions } from "@/features/pharmacy/queries/pharmacy.queries";
import { requirePermissionPage } from "@/lib/auth/guards";
import { PageHeader } from "@/shared/components/layout/page-header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";

export const metadata: Metadata = { title: "Farmacia" };

export default async function PharmacyPage() {
  const user = await requirePermissionPage("pharmacy:read");

  const [pending, inventory] = await Promise.all([
    listPendingPrescriptions({ skip: 0, take: 50 }),
    listInventory(),
  ]);

  return (
    <>
      <PageHeader
        title="Farmacia"
        description="Dispensación de recetas y control de inventario"
      />
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Recetas pendientes ({pending.total})
          </TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          <PendingPrescriptionsList
            prescriptions={pending.rows}
            canDispense={user.permissions.has("pharmacy:dispense")}
          />
        </TabsContent>
        <TabsContent value="inventory" className="mt-4">
          <InventoryTable rows={inventory} />
        </TabsContent>
      </Tabs>
    </>
  );
}
