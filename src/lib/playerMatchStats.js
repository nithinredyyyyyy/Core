/**
 * Map PlayerMatchStat records to the shape the Match Detail player table renders.
 *
 * Every numeric field is passed through unchanged; absent values stay null so the
 * table can render an em dash rather than a fabricated zero. No statistic is ever
 * inferred or defaulted here.
 */
export function buildPlayerStatRows(stats = [], teamsById = new Map()) {
  return stats.map((stat, index) => {
    const team = teamsById.get(stat.team_id) || null;
    const numeric = (value) =>
      Number.isFinite(Number(value)) ? Number(value) : null;

    return {
      id: stat.id || `${stat.match_id}-${stat.player_name}-${index}`,
      playerName: stat.player_name || "Unknown player",
      teamId: stat.team_id || null,
      teamName: team?.name || stat.team_name || null,
      kills: numeric(stat.kills),
      finishes: numeric(stat.finishes),
      knocks: numeric(stat.knocks),
      deaths: numeric(stat.deaths),
      directKills: numeric(stat.direct_kills),
      grenadeKills: numeric(stat.grenade_kills),
      vehicleKills: numeric(stat.vehicle_kills),
      zoneKills: numeric(stat.zone_kills),
    };
  });
}
