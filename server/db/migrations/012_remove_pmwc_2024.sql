-- Remove PUBG Mobile World Cup 2024 from the public site and database.
--
-- PMWC 2024 is superseded by PMWC 2025/2026 and must not appear anywhere. This
-- migration removes exactly that one tournament and every row that exists
-- because of it.
--
-- Dependency order is resolved from the schema, not assumed. These tables carry
-- no declared FOREIGN KEY constraints (SQLite foreign_keys is off and nothing
-- declares them), so the order below is derived from the actual reference
-- columns: children first, tournament last. Every statement is scoped by the
-- tournament name, which is unique via idx_tournaments_name, so a database whose
-- PMWC 2024 row has a different id (seed.json and canonical.export.json disagree
-- on the UUID) is still cleaned correctly.
--
-- Idempotent: on a database that has already run this, every subquery resolves to
-- the empty set and no rows are deleted. The runner wraps this in a transaction,
-- so a failure leaves neither the deletions nor the ledger row behind.
--
-- PMWC 2025 and PMWC 2026 are identified by exact names and are never touched.

-- stage_match_breakdown references a standing and a match; both can belong to
-- PMWC 2024. Delete by either edge so orphan breakdown rows cannot survive.
DELETE FROM stage_match_breakdown WHERE standing_id IN (
    SELECT id FROM stage_standings WHERE tournament_id IN (
        SELECT id FROM tournaments WHERE name = 'PUBG Mobile World Cup 2024'
    )
);
DELETE FROM stage_match_breakdown WHERE match_id IN (
    SELECT id FROM matches WHERE tournament_id IN (
        SELECT id FROM tournaments WHERE name = 'PUBG Mobile World Cup 2024'
    )
);

-- Player statistics hang off matches.
DELETE FROM player_match_stats WHERE match_id IN (
    SELECT id FROM matches WHERE tournament_id IN (
        SELECT id FROM tournaments WHERE name = 'PUBG Mobile World Cup 2024'
    )
);

-- Results hang off matches and carry a denormalized tournament_id.
DELETE FROM match_results WHERE tournament_id IN (
    SELECT id FROM tournaments WHERE name = 'PUBG Mobile World Cup 2024'
);
DELETE FROM matches WHERE tournament_id IN (
    SELECT id FROM tournaments WHERE name = 'PUBG Mobile World Cup 2024'
);

-- Participant children.
DELETE FROM tournament_participant_players WHERE participant_id IN (
    SELECT id FROM tournament_participants WHERE tournament_id IN (
        SELECT id FROM tournaments WHERE name = 'PUBG Mobile World Cup 2024'
    )
);
DELETE FROM tournament_participant_stage_entries WHERE participant_id IN (
    SELECT id FROM tournament_participants WHERE tournament_id IN (
        SELECT id FROM tournaments WHERE name = 'PUBG Mobile World Cup 2024'
    )
);

-- Stage children. Stage entries and groups are also staged by stage_id, which
-- covers any participant row that reached a PMWC 2024 stage without a
-- tournament_id link.
DELETE FROM tournament_participant_stage_entries WHERE stage_id IN (
    SELECT id FROM tournament_stages WHERE tournament_id IN (
        SELECT id FROM tournaments WHERE name = 'PUBG Mobile World Cup 2024'
    )
);
DELETE FROM tournament_stage_groups WHERE stage_id IN (
    SELECT id FROM tournament_stages WHERE tournament_id IN (
        SELECT id FROM tournaments WHERE name = 'PUBG Mobile World Cup 2024'
    )
);

-- Standings are keyed by seven columns (id, tournament_id, stage_id, group_id,
-- team_id, rank, ...) in the live schema, so delete by both tournament and stage.
DELETE FROM stage_standings WHERE tournament_id IN (
    SELECT id FROM tournaments WHERE name = 'PUBG Mobile World Cup 2024'
);
DELETE FROM stage_standings WHERE stage_id IN (
    SELECT id FROM tournament_stages WHERE tournament_id IN (
        SELECT id FROM tournaments WHERE name = 'PUBG Mobile World Cup 2024'
    )
);

DELETE FROM tournament_participants WHERE tournament_id IN (
    SELECT id FROM tournaments WHERE name = 'PUBG Mobile World Cup 2024'
);
DELETE FROM tournament_stages WHERE tournament_id IN (
    SELECT id FROM tournaments WHERE name = 'PUBG Mobile World Cup 2024'
);

-- The tournament article is part of the public footprint. Keyed by its exact
-- title, so no unrelated article is affected.
DELETE FROM news_articles WHERE title = 'Alpha7 Esports win PUBG Mobile World Cup 2024';

-- Finally the tournament itself.
DELETE FROM tournaments WHERE name = 'PUBG Mobile World Cup 2024';
