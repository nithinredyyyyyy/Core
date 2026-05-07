export function normalizeStageBoardValue(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function sortStageBoardMatches(matches) {
  return [...matches].sort((a, b) => {
    const dayDelta = (Number(a.day) || 0) - (Number(b.day) || 0);
    if (dayDelta !== 0) return dayDelta;

    const timeDelta = new Date(a.scheduled_time || 0).getTime() - new Date(b.scheduled_time || 0).getTime();
    if (timeDelta !== 0) return timeDelta;

    const numberDelta = (a.match_number || 0) - (b.match_number || 0);
    if (numberDelta !== 0) return numberDelta;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
}

export function getFeaturedTournamentStage(featuredTournament, tournamentMatches, tournamentResults) {
  const liveStage = tournamentMatches.find((match) => match.status === "live")?.stage;
  if (liveStage) return liveStage;
  const scheduledStage = tournamentMatches.find((match) => match.status === "scheduled")?.stage;
  if (scheduledStage) return scheduledStage;
  const declaredStages = Array.isArray(featuredTournament?.stages)
    ? featuredTournament.stages.map((stage) => stage?.name).filter(Boolean)
    : [];
  const availableStageSet = new Set([
    ...tournamentResults.map((result) => result.stage).filter(Boolean),
    ...tournamentMatches.map((match) => match.stage).filter(Boolean),
  ]);

  for (let index = declaredStages.length - 1; index >= 0; index -= 1) {
    if (availableStageSet.has(declaredStages[index])) {
      return declaredStages[index];
    }
  }

  return declaredStages[0] || tournamentResults[0]?.stage || null;
}

function extractGroupLabel(rawValue) {
  const value = String(rawValue || "").trim();
  const match = value.match(/group\s+([a-z0-9]+)/i);
  if (match) return match[1].toUpperCase();
  if (/^[A-Z0-9]$/i.test(value)) return value.toUpperCase();
  return value || "-";
}

export function getStageBoardTeamGroups(featuredTournament) {
  const map = new Map();
  for (const participant of featuredTournament?.participants || []) {
    const key = normalizeStageBoardValue(participant.team);
    if (!key) continue;
    const rawGroup = participant.group_name || participant.group || participant.phase || "-";
    map.set(key, extractGroupLabel(rawGroup));
  }
  return map;
}

function getAverageEliminationPosition(row) {
  const value = row?.averageEliminationPosition;
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

export function compareStageBoardStandings(left, right) {
  if ((right.points || 0) !== (left.points || 0)) return (right.points || 0) - (left.points || 0);
  if ((right.wwcd || 0) !== (left.wwcd || 0)) return (right.wwcd || 0) - (left.wwcd || 0);
  if ((right.placementPoints || 0) !== (left.placementPoints || 0)) return (right.placementPoints || 0) - (left.placementPoints || 0);

  const leftAverage = getAverageEliminationPosition(left);
  const rightAverage = getAverageEliminationPosition(right);
  if (leftAverage !== rightAverage) return leftAverage - rightAverage;

  if ((right.elims || 0) !== (left.elims || 0)) return (right.elims || 0) - (left.elims || 0);
  return String(left.teamName || "").localeCompare(String(right.teamName || ""));
}

export function getStageBoardData({ featuredTournament, teams, matches, matchResults, requestedStage }) {
  if (!featuredTournament) {
    return {
      featuredStage: null,
      stageMatches: [],
      standings: [],
      liveMatch: null,
      nextMatch: null,
      leader: null,
    };
  }

  const tournamentMatches = matches.filter((match) => match.tournament_id === featuredTournament.id);
  const tournamentResults = matchResults.filter((result) => result.tournament_id === featuredTournament.id);
  const featuredStage = requestedStage || getFeaturedTournamentStage(featuredTournament, tournamentMatches, tournamentResults);
  const isGrandFinalsStage = String(featuredStage || "").trim().toLowerCase() === "grand finals";
  const strictStageMatches = sortStageBoardMatches(
    tournamentMatches.filter((match) => !featuredStage || match.stage === featuredStage)
  );
  const rawBoardMatches = strictStageMatches.length > 0 ? strictStageMatches : sortStageBoardMatches(tournamentMatches);
  const boardMatches = rawBoardMatches.map((match, index) => ({
    ...match,
    board_match_number: index + 1,
  }));
  const matchById = new Map(boardMatches.map((match) => [match.id, match]));
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const groupMap = getStageBoardTeamGroups(featuredTournament);
  const standingsMap = new Map();

  for (const result of tournamentResults) {
    if (featuredStage && result.stage && result.stage !== featuredStage) continue;
    const team = teamMap.get(result.team_id);
    const displayName = team?.name || result.team_name || "Unknown Team";
    const key = result.team_id || normalizeStageBoardValue(displayName);
    const row = standingsMap.get(key) || {
      teamId: result.team_id,
      teamName: displayName,
      logoName: displayName,
      group: isGrandFinalsStage ? "-" : groupMap.get(normalizeStageBoardValue(displayName)) || "-",
      matches: 0,
      wwcd: 0,
      placementPoints: 0,
      elims: 0,
      points: 0,
      placementSum: 0,
      matchCells: {},
    };

    const wins = result.wins_count && result.wins_count > 0 ? result.wins_count : result.placement === 1 ? 1 : 0;
    const match = matchById.get(result.match_id);
    row.matches += result.matches_count || 1;
    row.wwcd += wins;
    row.placementPoints += result.placement_points || 0;
    row.elims += result.kill_points || 0;
    row.points += result.total_points || 0;
    row.placementSum += Number(result.placement) || 0;

    if (match) {
      row.matchCells[result.match_id] = {
        points: result.total_points || 0,
        placement: result.placement || null,
        won: wins > 0,
      };
    }

    if (isGrandFinalsStage) {
      row.group = "-";
    }

    standingsMap.set(key, row);
  }

  const standings = [...standingsMap.values()]
    .map((row) => ({
      ...row,
      averageEliminationPosition: row.matches > 0 ? row.placementSum / row.matches : null,
    }))
    .sort(compareStageBoardStandings)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  return {
    featuredStage,
    stageMatches: boardMatches,
    standings,
    liveMatch: boardMatches.find((match) => match.status === "live") || null,
    nextMatch:
      boardMatches.find((match) => match.status === "scheduled" && match.scheduled_time) ||
      boardMatches.find((match) => match.status === "scheduled") ||
      null,
    leader: standings[0] || null,
  };
}
