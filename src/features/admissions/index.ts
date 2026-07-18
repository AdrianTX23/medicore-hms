// Public API of the admissions feature — CLIENT-SAFE exports only.
// Server-only queries live in ./index.server.
export { BedMap } from "./components/bed-map";
export { AdmissionsTable } from "./components/admissions-table";
export { BED_STATUS_LABELS, ADMISSION_STATUS_LABELS } from "./constants";
export type { AdmissionListItem, AdmissionDetail, DepartmentWard } from "./queries/admission.queries";
