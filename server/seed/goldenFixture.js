// Golden fixture: the structural shape of a known-good tournament GF.
//
// Reference: a 19-map Grand Finals with 16 teams, i.e. the same shape the PEL
// 2026 Summer Grand Finals already has in production. This module only builds the
// input payload — it never touches the production database. Tests feed the output
// into a throwaway DB via the enrichment path.
//
// Expected structural shape when player stats are included:
//   matches            = 19
//   match_results      = 19 x 16 = 304
//   player_match_stats = 19 x 16 x 4 = 1216

const MAPS = ["Erangel", "Miramar", "Sanhok", "Rondo"];
export const FIXTURE_MATCH_COUNT = 19;
export const FIXTURE_TEAM_COUNT = 16;
export const FIXTURE_PLAYERS_PER_TEAM = 4;

const SOURCE = {
  source_name: "fixture",
  source_url: "https://example.test/fixture/grand-finals",
};

/**
 * Build a deterministic fixture for one tournament's Grand Finals stage.
 *
 * @param {{ tournamentId: string, stage?: string, teamIds: string[] }} params
 * @returns {{ tournamentId, stage, source, matches, resultsByMatch, playerStats }}
 */
export function buildGoldenFixture({ tournamentId, stage = "Grand Finals", teamIds }) {
  if (!Array.isArray(teamIds) || teamIds.length === 0) {
    throw new Error("teamIds is required");
  }

  const matches = [];
  const resultsByMatch = {};
  const playerStats = [];
  const stageSlug = String(stage).toLowerCase().replace(/[^a-z0-9]+/g, "-");

  for (let i = 1; i <= FIXTURE_MATCH_COUNT; i += 1) {
    const sourceSlug = `fixture:${tournamentId}:${stageSlug}:m${i}`;
    const sourceUrl = `${SOURCE.source_url}#m${i}`;
    matches.push({
      stage,
      match_number: i,
      map: MAPS[(i - 1) % MAPS.length],
      status: "completed",
      scheduled_time: new Date(Date.UTC(2026, 0, i, 12, 0, 0)).toISOString(),
      day: Math.ceil(i / 6),
      group_name: null,
      source_slug: sourceSlug,
      source_url: sourceUrl,
      source_name: SOURCE.source_name,
    });

    // Teams are placed by a deterministic rotation so placements 1..16 appear
    // once per match and points are coherent (total = kill + placement).
    const placements = teamIds.map((teamId, index) => {
      const placement = ((index + i) % teamIds.length) + 1;
      const killPoints = (placement * 2) % 11;
      const placementPoints = Math.max(0, 11 - placement);
      return { teamId, placement, killPoints, placementPoints };
    });

    resultsByMatch[sourceSlug] = placements.map((row) => ({
      team_id: row.teamId,
      placement: row.placement,
      kill_points: row.killPoints,
      placement_points: row.placementPoints,
      total_points: row.killPoints + row.placementPoints,
      matches_count: 1,
      wins_count: row.placement === 1 ? 1 : 0,
      stage,
      publication_status: "published",
      source_ref: sourceSlug,
      source_url: sourceUrl,
    }));

    for (const row of placements) {
      for (let p = 1; p <= FIXTURE_PLAYERS_PER_TEAM; p += 1) {
        playerStats.push({
          match_id: sourceSlug, // resolved to a real match id by the importer
          player_name: `${row.teamId}-p${p}`,
          team_id: row.teamId,
          kills: row.killPoints > 0 ? (row.killPoints + p) % 7 : 0,
          finishes: (row.killPoints + p) % 5,
          knocks: (row.killPoints + p) % 4,
          deaths: row.placement === 1 ? 0 : 1,
          source: "fixture",
        });
      }
    }
  }

  return {
    tournamentId,
    stage,
    source: { ...SOURCE, source_url: `${SOURCE.source_url}/meta` },
    matches,
    resultsByMatch,
    playerStats,
  };
}
