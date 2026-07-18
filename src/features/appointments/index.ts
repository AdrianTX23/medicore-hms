// Public API of the appointments feature — CLIENT-SAFE exports only.
// Server-only queries live in ./index.server.
export { AppointmentForm } from "./components/appointment-form";
export { AppointmentsTable } from "./components/appointments-table";
export { PatientCombobox } from "./components/patient-combobox";
export { APPOINTMENT_STATUS_LABELS } from "./constants";
export type { AppointmentListItem, DoctorOption } from "./queries/appointment.queries";
