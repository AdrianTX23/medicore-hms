// Public API of the patients feature — other modules import ONLY from here.
export { PatientForm } from "./components/patient-form";
export { PatientsTable } from "./components/patients-table";
export { searchPatients, getPatientProfile } from "./queries/patient.queries";
export { GENDER_LABELS, BLOOD_TYPE_LABELS } from "./constants";
export type { PatientListItem, PatientProfile } from "./queries/patient.queries";
