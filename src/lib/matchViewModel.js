import { normalizeStatus } from "@/lib/status";
import { getTeamLogoByName, getTeamLogoSurfaceTone } from "@/lib/teamLogos";

/**
 * Result row shape produced by `buildMatchResultRows`. Kept as a plain object so
 * cards, scoreboards, and tables can all render from the same source.
 */

export function buildMatchResultRows(results = [], teamsById = new Map()) {
  return results.map((result, index) => {
    const team = teamsById.get(result.team_id) || null;
    const teamName = team?.name || result.team_name || "Unknown team";
    return {
      id: result.id || `${result.team_id}-${index}`,
      teamId: result.team_id,
      teamName,
      teamTag: team?.short_name || team?.tag || null,
      logo: getTeamLogoByName(teamName),
      logoSurfaceTone: getTeamLogoSurfaceTone(teamName),
      placement: Number.isFinite(result.placement) ? result.placement : null,
      kills: Number.isFinite(result.kill_points) ? result.kill_points : null,
      placementPoints: Number.isFinite(result.placement_points)
        ? result.placement_points
        : null,
      totalPoints: Number.isFinite(result.total_points)
        ? result.total_points
        : null,
      matchesCount: Number.isFinite(result.matches_count)
        ? result.matches_count
        : null,
      winsCount: Number.isFinite(result.wins_count) ? result.wins_count : null,
    };
  });
}

/**
 * Single view model for a match, shared by match cards, the match center list,
 * the match detail scoreboard, and the home hero.
 *
 * Some tournaments publish one result row per match, others publish a single
 * cumulative row set for a whole stage (`matches_count` > 1). The view model
 * records which case applies so the scoreboard can label the numbers honestly
 * instead of presenting stage totals as a single-match result.
 */
export function buildMatchViewModel({
  match,
  tournament = null,
  results = [],
  teamsById = new Map(),
}) {
  if (!match) return null;

  const status = normalizeStatus(match.status);
  const rows = buildMatchResultRows(results, teamsById);
  const hasScoreboard = rows.length > 0;
  const aggregateMatchCount = hasScoreboard
    ? Math.max(
        1,
        ...rows.map((row) => row.matchesCount || 1),
      )
    : 0;

  const matchNumberLabel = match.match_number
    ? `Match ${match.match_number}`
    : match.stage || "Match";
  // `stage` often repeats `matchNumberLabel` when a match has no number (e.g.
  // "Grand Finals"). Expose a de-duplicated label so callers can render
  // "Match 18 · Erangel" without printing "Grand Finals · Grand Finals".
  const stageLabel =
    match.stage && match.stage !== matchNumberLabel ? match.stage : null;

  return {
    id: match.id,
    status,
    statusLabel: status,
    tournamentId: match.tournament_id || tournament?.id || null,
    tournamentName: tournament?.name || "Tournament TBA",
    stage: match.stage || null,
    stageLabel,
    groupName: match.group_name || null,
    day: match.day || null,
    matchNumber: match.match_number ?? null,
    matchNumberLabel,
    map: match.map || null,
    scheduledTime: match.scheduled_time || null,
    streamUrl: match.stream_url || null,
    rows,
    hasScoreboard,
    aggregateMatchCount,
    isAggregated: aggregateMatchCount > 1,
    teams: rows.length,
  };
}
