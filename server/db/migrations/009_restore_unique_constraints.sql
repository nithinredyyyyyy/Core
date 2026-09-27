-- Restore two data-integrity constraints that existing databases received from
-- migrations 005/006/008/20260524, none of which are present in the repository.
-- Those IDs are already recorded as applied in real databases, so this migration
-- must use a fresh ID. IF NOT EXISTS keeps it a no-op on databases that already
-- have the indexes, and creates them on fresh databases that would otherwise
-- lack them.
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournaments_name ON tournaments(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_match_results_match_team_unique
  ON match_results(match_id, team_id);
