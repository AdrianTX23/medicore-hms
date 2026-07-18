// Public API of the laboratory feature — CLIENT-SAFE exports only.
// Server-only queries live in ./index.server.
export { LabQueueTable } from "./components/lab-queue-table";
export { LabOrdersCard } from "./components/lab-orders-card";
export {
  LAB_ORDER_STATUS_LABELS,
  LAB_PRIORITY_LABELS,
} from "./constants";
export type { LabOrderListItem, LabOrderDetail } from "./queries/lab.queries";
