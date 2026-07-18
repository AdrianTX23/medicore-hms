-- Indexes on hot foreign keys that are filtered/joined in query files but had
-- no supporting index (production readiness audit, 2026-07-18).
CREATE INDEX "staff_profiles_specialty_id_idx" ON "staff_profiles" ("specialty_id");
CREATE INDEX "staff_profiles_department_id_idx" ON "staff_profiles" ("department_id");
CREATE INDEX "emergency_contacts_patient_id_idx" ON "emergency_contacts" ("patient_id");
CREATE INDEX "patient_documents_patient_id_idx" ON "patient_documents" ("patient_id");
CREATE INDEX "vital_signs_encounter_id_idx" ON "vital_signs" ("encounter_id");
CREATE INDEX "prescriptions_encounter_id_idx" ON "prescriptions" ("encounter_id");
CREATE INDEX "prescriptions_doctor_id_idx" ON "prescriptions" ("doctor_id");
CREATE INDEX "prescription_items_prescription_id_idx" ON "prescription_items" ("prescription_id");
CREATE INDEX "prescription_items_medication_id_idx" ON "prescription_items" ("medication_id");
CREATE INDEX "lab_orders_encounter_id_idx" ON "lab_orders" ("encounter_id");
CREATE INDEX "lab_order_items_lab_test_id_idx" ON "lab_order_items" ("lab_test_id");
CREATE INDEX "lab_results_performed_by_id_idx" ON "lab_results" ("performed_by_id");
CREATE INDEX "lab_results_validated_by_id_idx" ON "lab_results" ("validated_by_id");
CREATE INDEX "admissions_bed_id_idx" ON "admissions" ("bed_id");
CREATE INDEX "admissions_attending_doctor_id_idx" ON "admissions" ("attending_doctor_id");
CREATE INDEX "bed_transfers_admission_id_idx" ON "bed_transfers" ("admission_id");
CREATE INDEX "payments_invoice_id_idx" ON "payments" ("invoice_id");
CREATE INDEX "payments_paid_at_idx" ON "payments" ("paid_at");
CREATE INDEX "stock_movements_performed_by_id_idx" ON "stock_movements" ("performed_by_id");

-- A double-click / concurrent "add diagnosis" call could otherwise create
-- duplicate ICD-10 rows on the same encounter; the service layer only
-- checked this with a pre-insert SELECT, which doesn't stop a race.
CREATE UNIQUE INDEX "diagnoses_encounter_id_icd10_code_key" ON "diagnoses" ("encounter_id", "icd10_code");

-- Concurrency guards for hospitalization, matching the pattern already used
-- for appointment double-booking: a DB-level constraint, not just an
-- application-level pre-check, is what actually prevents the race.
-- A patient can only have one ADMITTED admission at a time.
CREATE UNIQUE INDEX "admissions_one_active_per_patient_key"
  ON "admissions" ("patient_id")
  WHERE "status" = 'ADMITTED';

-- A bed can only be attached to one ADMITTED admission at a time. This is a
-- backstop alongside the conditional bed-status update in the service layer.
CREATE UNIQUE INDEX "admissions_one_active_per_bed_key"
  ON "admissions" ("bed_id")
  WHERE "status" = 'ADMITTED';
