-- Player-match statistics table.
--
-- This table exists in the production database (it was created by a migration
-- that was never committed), but it was missing from the repository's migration
-- set. Without this, a fresh canonical bootstrap would lack the table and the
-- now-supported PlayerMatchStat entity would fail on a new database.
--
-- CREATE TABLE IF NOT EXISTS / CREATE UNIQUE INDEX IF NOT EXISTS make this a
-- no-op on the existing production database, whose objects are already present.
CREATE TABLE IF NOT EXISTS player_match_stats (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  player_id TEXT,
  player_name TEXT NOT NULL,
  team_id TEXT,
  matches_played INTEGER DEFAULT 1,
  kills INTEGER DEFAULT 0,
  finishes INTEGER DEFAULT 0,
  knocks INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  direct_kills INTEGER DEFAULT 0,
  grenade_kills INTEGER DEFAULT 0,
  vehicle_kills INTEGER DEFAULT 0,
  zone_kills INTEGER DEFAULT 0,
  first_event_frame INTEGER,
  last_event_frame INTEGER,
  source TEXT,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL,
  created_by TEXT
);

-- Idempotency key for enrichment upserts: (match_id, player_name, team_id).
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_match_stats_unique_match_player
  ON player_match_stats (match_id, player_name, team_id);

CREATE INDEX IF NOT EXISTS idx_player_match_stats_match_id
  ON player_match_stats (match_id);
CREATE INDEX IF NOT EXISTS idx_player_match_stats_team_id
  ON player_match_stats (team_id);
