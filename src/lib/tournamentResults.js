import { getStageBoardData } from "@/lib/stageBoard";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";

export function normalizePlacementValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  if (/^\d+$/.test(text)) {
    return `${text}${text === "1" ? "st" : text === "2" ? "nd" : text === "3" ? "rd" : "th"}`;
  }
  if (/^\d+(st|nd|rd|th)$/i.test(text)) return text;
  return text;
}

function formatPrize(entry) {
  if (!entry || typeof entry !== "object") return null;
  if (entry.usd) return entry.usd;
  if (entry.inr) return entry.inr;
  return null;
}

function groupNormalizedDataByTournament(rows, key = "tournament_id") {
  const map = new Map();
  for (const row of rows || []) {
    const tournamentId = row?.[key];
    if (!tournamentId) continue;
    const list = map.get(tournamentId) || [];
    list.push(row);
    map.set(tournamentId, list);
  }
  return map;
}

function getTournamentStageOrder(tournament) {
  const configuredStages = Array.isArray(tournament?.stages) ? tournament.stages : [];
  const explicitOrder = configuredStages.reduce((map, stage, index) => {
    if (stage?.name) {
      map[stage.name] = stage.order ?? index + 1;
    }
    return map;
  }, {});

  const fallbackOrder = {
    Qualifiers: 0,
    "Round 1": 1,
    "Round 2": 2,
    "Round 3": 3,
    "Round 4": 4,
    "Quarter Finals": 5,
    Wildcard: 6,
    "Semi Finals": 7,
    "Survival Stage": 8,
    "Last Chance": 9,
    "Grand Finals": 10,
  };

  return { ...fallbackOrder, ...explicitOrder };
}

function getResolvedStageStandings(tournament, teams, matches, matchResults, stageName) {
  const derived = getStageBoardData({
    featuredTournament: tournament,
    teams,
    matches,
    matchResults,
    requestedStage: stageName,
  });

  if (derived?.standings?.length > 0) {
    return derived.standings.map((entry) => ({
      placement: entry.rank,
      team: entry.teamName,
      fullTeam: entry.teamName,
      grp: entry.group && entry.group !== "-" ? entry.group : undefined,
      matches: entry.matches,
      wwcd: entry.wwcd,
      pos: entry.placementPoints,
      elimins: entry.elims,
      points: entry.points,
    }));
  }

  const stage = (tournament?.stages || []).find((entry) => entry?.name === stageName);
  return Array.isArray(stage?.standings) ? stage.standings : [];
}

function getResolvedNormalizedStageStandings({ tournament, teams, normalizedStages = [], normalizedStandings = [], stageName }) {
  const targetStage = normalizedStages.find((stage) => stage?.name === stageName);
  if (!targetStage) return [];

  const teamMap = new Map((teams || []).map((team) => [team.id, team]));

  return normalizedStandings
    .filter((entry) => entry.stage_id === targetStage.id)
    .map((entry) => {
      const team = teamMap.get(entry.team_id);
      return {
        placement: entry.rank,
        team: team?.name || "Unknown Team",
        fullTeam: team?.name || "Unknown Team",
        grp: undefined,
        matches: entry.matches_played || 0,
        wwcd: entry.wins || 0,
        pos: entry.place_points || 0,
        elimins: entry.elim_points || 0,
        points: entry.total_points || 0,
      };
    });
}

export function getTournamentResultForOrganization({
  tournament,
  organizationName,
  teams = [],
  matches = [],
  matchResults = [],
  fallbackParticipant = null,
  normalizedStages = [],
  normalizedStandings = [],
}) {
  if (!tournament || !organizationName) return null;

  const targetKey = normalizeOrganizationName(organizationName);
  const stageOrder = getTournamentStageOrder({
    ...tournament,
    stages:
      normalizedStages.length > 0
        ? normalizedStages.map((stage) => ({ ...stage, order: stage.stage_order }))
        : tournament?.stages || [],
  });
  let bestStageRow = null;
  let bestStageName = null;
  let bestOrder = -Infinity;
  const sourceStages =
    normalizedStages.length > 0
      ? normalizedStages.map((stage) => ({ name: stage.name }))
      : tournament?.stages || [];

  for (const stage of sourceStages) {
    if (!stage?.name) continue;
    const standings =
      normalizedStages.length > 0
        ? getResolvedNormalizedStageStandings({
            tournament,
            teams,
            normalizedStages,
            normalizedStandings,
            stageName: stage.name,
          })
        : getResolvedStageStandings(tournament, teams, matches, matchResults, stage.name);
    const row = standings.find(
      (entry) => normalizeOrganizationName(entry?.fullTeam || entry?.team) === targetKey
    );
    if (!row) continue;
    const order = stageOrder[stage.name] ?? 0;
    if (order >= bestOrder) {
      bestOrder = order;
      bestStageRow = row;
      bestStageName = stage.name;
    }
  }

  if (bestStageRow) {
    return {
      placement: normalizePlacementValue(bestStageRow.placement) || "-",
      stage: bestStageName,
      team: bestStageRow.fullTeam || bestStageRow.team || organizationName,
    };
  }

  if (!sourceStages.length && fallbackParticipant) {
    return {
      placement: normalizePlacementValue(fallbackParticipant.placement) || "-",
      stage: fallbackParticipant.phase || null,
      team: fallbackParticipant.team || organizationName,
    };
  }

  return null;
}

export function getPrizeForOrganization(tournament, organizationName, placement) {
  const prizeRows = Array.isArray(tournament?.prize_breakdown) ? tournament.prize_breakdown : [];
  const orgKey = normalizeOrganizationName(organizationName);
  const matchedByTeam =
    prizeRows.find((entry) => normalizeOrganizationName(entry?.team) === orgKey) || null;
  if (matchedByTeam) return formatPrize(matchedByTeam);

  const normalizedPlacement = normalizePlacementValue(placement);
  if (normalizedPlacement) {
    const matchedByPlacement =
      prizeRows.find((entry) => normalizePlacementValue(entry?.placement) === normalizedPlacement) || null;
    if (matchedByPlacement) return formatPrize(matchedByPlacement);
  }

  return null;
}

export function buildNormalizedTournamentResultMaps({
  normalizedStages = [],
  normalizedParticipants = [],
  normalizedStandings = [],
}) {
  return {
    stagesByTournament: groupNormalizedDataByTournament(normalizedStages),
    participantsByTournament: groupNormalizedDataByTournament(normalizedParticipants),
    standingsByTournament: groupNormalizedDataByTournament(normalizedStandings),
  };
}
