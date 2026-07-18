// Server-only public API of the admissions feature (queries hit the DB).
export {
  getBedMap,
  getAvailableBeds,
  listActiveAdmissions,
  getAdmissionDetail,
} from "./queries/admission.queries";
