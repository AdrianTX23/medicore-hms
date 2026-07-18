// Public API of the encounters feature — CLIENT-SAFE exports only.
// Server-only queries live in ./index.server — a barrel that mixed both
// would drag "server-only" modules into client bundles.
export { startEncounter } from "./actions/encounter.actions";
export { EncountersTable } from "./components/encounters-table";
export { ENCOUNTER_STATUS_LABELS, ENCOUNTER_TYPE_LABELS } from "./constants";
export type { EncounterListItem, EncounterDetail } from "./queries/encounter.queries";
