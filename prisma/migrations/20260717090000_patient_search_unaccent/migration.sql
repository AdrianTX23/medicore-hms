-- Accent-insensitive patient search.
-- unaccent() is STABLE, not IMMUTABLE, so it cannot back an index directly;
-- the standard fix is an immutable wrapper pinned to the unaccent dictionary.

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION f_unaccent(text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE PARALLEL SAFE STRICT
AS $$
  SELECT public.unaccent('public.unaccent'::regdictionary, $1)
$$;

DROP INDEX IF EXISTS "patients_search_trgm_idx";

CREATE INDEX "patients_search_trgm_idx" ON "patients"
  USING gin (
    f_unaccent(
      ("first_name" || ' ' || "last_name") || ' ' || coalesce("document_id", '') || ' ' || "mrn"
    ) gin_trgm_ops
  );
