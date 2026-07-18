import Link from "next/link";
import { Flask } from "@phosphor-icons/react/dist/ssr";
import { OrderLabTestDialog } from "@/features/laboratory/components/order-lab-test-dialog";
import {
  LAB_ORDER_STATUS_LABELS,
  LAB_ORDER_STATUS_VARIANTS,
  LAB_PRIORITY_LABELS,
  LAB_PRIORITY_VARIANTS,
} from "@/features/laboratory/constants";
import { listEncounterLabOrders } from "@/features/laboratory/queries/lab.queries";
import { StatusBadge } from "@/shared/components/data-viz/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

type LabOrdersCardProps = {
  encounterId: string;
  canOrder: boolean;
};

export async function LabOrdersCard({ encounterId, canOrder }: LabOrdersCardProps) {
  const orders = await listEncounterLabOrders(encounterId);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Flask className="size-4" /> Laboratorio
        </CardTitle>
        {canOrder ? <OrderLabTestDialog encounterId={encounterId} /> : null}
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin órdenes de laboratorio</p>
        ) : (
          <ul className="space-y-2">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/laboratory/${order.id}`}
                  className="block rounded-md border p-3 text-sm hover:bg-accent"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <StatusBadge
                      status={order.status}
                      labels={LAB_ORDER_STATUS_LABELS}
                      variants={LAB_ORDER_STATUS_VARIANTS}
                    />
                    <StatusBadge
                      status={order.priority}
                      labels={LAB_PRIORITY_LABELS}
                      variants={LAB_PRIORITY_VARIANTS}
                    />
                  </div>
                  <p className="text-muted-foreground">
                    {order.items.map((i) => i.labTest.name).join(", ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
