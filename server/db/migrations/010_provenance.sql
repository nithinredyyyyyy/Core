-- Provenance for imported historical data.
--
-- Additive only: existing UUID primary keys and the (match_id, team_id) /
-- (match_id, player_name, team_id) identity constraints remain authoritative.
-- Columns are added with ALTER TABLE, which is a no-op on databases that already
-- received them through the ensureColumn calls in schema.js.

ALTER TABLE matches ADD COLUMN source_slug TEXT;
ALTER TABLE matches ADD COLUMN source_url TEXT;
ALTER TABLE matches ADD COLUMN source_name TEXT;

ALTER TABLE match_results ADD COLUMN source_ref TEXT;
ALTER TABLE match_results ADD COLUMN source_url TEXT;

-- Audit trail for extraction runs. Not part of the canonical seed dataset; this
-- is provenance infrastructure, mirroring how schema_migrations is kept out.
CREATE TABLE IF NOT EXISTS match_sources (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    stage_id TEXT,
    source_name TEXT NOT NULL,
    source_url TEXT NOT NULL,
    retrieved_at TEXT NOT NULL,
    checksum TEXT,
    created_date TEXT NOT NULL,
    UNIQUE(tournament_id, source_url)
);

CREATE INDEX IF NOT EXISTS idx_matches_source_slug ON matches(source_slug);
CREATE INDEX IF NOT EXISTS idx_match_results_source_ref ON match_results(source_ref);
CREATE INDEX IF NOT EXISTS idx_match_sources_tournament ON match_sources(tournament_id);
