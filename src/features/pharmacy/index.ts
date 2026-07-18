// Public API of the pharmacy feature — CLIENT-SAFE exports only.
// Server-only queries live in ./index.server.
export { PendingPrescriptionsList } from "./components/pending-prescriptions-list";
export { InventoryTable } from "./components/inventory-table";
export type { PendingPrescriptionItem, InventoryRow } from "./queries/pharmacy.queries";
