import { db } from "../db.js";

// Canonical standings read path for stages backed by per-match results.
//
// Standings are aggregated directly from `match_results`, grouped by team, using
// the same publication rules the rest of the application applies: a result row is
// counted only when its own `publication_status` is published AND no sibling row
// for the same match is draft. That mirrors:
//   - server/services/tournaments.js deriveStandingsFromMatchResults()
//   - client src/lib/matchResultPublication.js
//
// The legacy `stage_standings` table is intentionally untouched; this endpoint is
// additive so it does not change existing boards.

const PUBLISHED_SQL = `
  COALESCE(NULLIF(mr.publication_status, ''), 'published') = 'published'
  AND mr.match_id NOT IN (
    SELECT match_id FROM match_results
    WHERE COALESCE(NULLIF(publication_status, ''), 'published') <> 'published'
  )
`;

/**
 * Aggregate a stage's standings from match_results.
 *
 * @param {string} tournamentId
 * @param {string} stageId  tournament_stages.id
 * @returns {{ tournament_id: string, stage_id: string, stage: string|null,
 *             standings: Array<object> } | null} null when the stage is absent
 */
export function getStageStandingsFromResults(tournamentId, stageId) {
  if (!tournamentId || !stageId) return null;

  const stage = db
    .prepare(
      "SELECT id, tournament_id, name FROM tournament_stages WHERE id = ? AND tournament_id = ?",
    )
    .get(stageId, tournamentId);
  if (!stage) return null;

  const rows = db
    .prepare(
      `
      SELECT
        mr.team_id AS team_id,
        tm.name AS team_name,
        tm.tag AS team_tag,
        tm.logo_url AS team_logo_url,
        SUM(COALESCE(mr.matches_count, 1)) AS matches_count,
        SUM(COALESCE(mr.wins_count, 0)) AS wins_count,
        SUM(COALESCE(mr.kill_points, 0)) AS kill_points,
        SUM(COALESCE(mr.placement_points, 0)) AS placement_points,
        SUM(COALESCE(mr.total_points, 0)) AS total_points
      FROM match_results mr
      JOIN matches m ON m.id = mr.match_id
      JOIN teams tm ON tm.id = mr.team_id
      WHERE mr.tournament_id = ?
        AND mr.stage = ?
        AND ${PUBLISHED_SQL}
      GROUP BY mr.team_id
    `,
    )
    .all(tournamentId, stage.name);

  // Application standings semantics: most total points first, then most wins,
  // then fewest placement points as a tiebreak, then team name for stability.
  const standings = rows
    .map((row) => ({
      team_id: row.team_id,
      team: row.team_name,
      team_tag: row.team_tag || null,
      logo_url: row.team_logo_url || null,
      matches_count: Number(row.matches_count) || 0,
      wins_count: Number(row.wins_count) || 0,
      kill_points: Number(row.kill_points) || 0,
      placement_points: Number(row.placement_points) || 0,
      total_points: Number(row.total_points) || 0,
    }))
    .sort(
      (a, b) =>
        b.total_points - a.total_points ||
        b.wins_count - a.wins_count ||
        a.placement_points - b.placement_points ||
        a.team.localeCompare(b.team),
    )
    .map((row, index) => ({ rank: index + 1, ...row }));

  return {
    tournament_id: tournamentId,
    stage_id: stage.id,
    stage: stage.name,
    standings,
  };
}
