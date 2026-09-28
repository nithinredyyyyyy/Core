-- Provenance for stage standings.
--
-- Migration 010 added source columns to matches and match_results, but
-- stage_standings was left without any way to record where a row came from.
-- Standings rows are now supplied by hand and must carry their origin, so this
-- adds the same shape the other imported tables use.
--
-- Additive and idempotent: ALTER TABLE ADD COLUMN is a no-op on a database that
-- already has the column, and this migration is recorded in schema_migrations so
-- it only ever runs once per database. No enum: source_name is free text, as in
-- matches.source_name.
--
-- source_url is deliberately nullable. A hand-supplied standings board has no
-- single canonical URL, and inventing one would be a false provenance claim, so
-- rows may carry only source_name plus a source_ref description.

ALTER TABLE stage_standings ADD COLUMN source_name TEXT;
ALTER TABLE stage_standings ADD COLUMN source_url TEXT;
ALTER TABLE stage_standings ADD COLUMN source_ref TEXT;

CREATE INDEX IF NOT EXISTS idx_stage_standings_source_name
  ON stage_standings(source_name);
