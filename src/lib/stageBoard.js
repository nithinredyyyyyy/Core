import { getTeamLogoByName } from "./teamLogos.js";

export function normalizeStageBoardValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function sortStageBoardMatches(matches) {
  return matches.toSorted((a, b) => {
    const dayDelta = (Number(a.day) || 0) - (Number(b.day) || 0);
    if (dayDelta !== 0) return dayDelta;

    const timeDelta =
      new Date(a.scheduled_time || 0).getTime() -
      new Date(b.scheduled_time || 0).getTime();
    if (timeDelta !== 0) return timeDelta;

    const numberDelta = (a.match_number || 0) - (b.match_number || 0);
    if (numberDelta !== 0) return numberDelta;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
}

function isTodayMatch(match, now = Date.now()) {
  if (!match?.scheduled_time) return false;
  return new Date(match.scheduled_time).toDateString() === new Date(now).toDateString();
}

export function getFeaturedTournamentStage(
  featuredTournament,
  tournamentMatches,
  tournamentResults,
) {
  const liveStage = tournamentMatches.find(
    (match) => match.status === "live" && isTodayMatch(match),
  )?.stage;
  if (liveStage) return liveStage;

  const declaredStages = Array.isArray(featuredTournament?.stages)
    ? featuredTournament.stages.flatMap((stage) => (stage?.name ? [stage.name] : []))
    : [];
  const declaredStageOrder = new Map(
    declaredStages.map((stageName, index) => [stageName, index]),
  );

  const now = Date.now();
  const scheduledMatches = tournamentMatches.filter(
    (match) => match.status === "scheduled" && match.stage,
  );
  const todayStage = scheduledMatches
    .filter((match) => isTodayMatch(match, now))
    .toSorted((left, right) => {
      const timeDelta =
        new Date(left.scheduled_time || 0).getTime() -
        new Date(right.scheduled_time || 0).getTime();
      if (timeDelta !== 0) return timeDelta;
      return (declaredStageOrder.get(left.stage) ?? 999) - (declaredStageOrder.get(right.stage) ?? 999);
    })[0]?.stage;
  if (todayStage) return todayStage;

  const upcomingStage = scheduledMatches
    .filter((match) => {
      const time = new Date(match.scheduled_time || 0).getTime();
      return Number.isFinite(time) && time >= now;
    })
    .toSorted((left, right) => {
      const timeDelta =
        new Date(left.scheduled_time || 0).getTime() -
        new Date(right.scheduled_time || 0).getTime();
      if (timeDelta !== 0) return timeDelta;
      return (declaredStageOrder.get(left.stage) ?? 999) - (declaredStageOrder.get(right.stage) ?? 999);
    })[0]?.stage;
  if (upcomingStage) return upcomingStage;

  const resultStage = tournamentResults
    .filter((result) => result.stage)
    .toSorted((left, right) => {
      const leftOrder = declaredStageOrder.get(left.stage) ?? -1;
      const rightOrder = declaredStageOrder.get(right.stage) ?? -1;
      return rightOrder - leftOrder;
    })[0]?.stage;
  if (resultStage) return resultStage;

  const latestScheduledStage = scheduledMatches
    .toSorted((left, right) => {
      const timeDelta =
        new Date(right.scheduled_time || 0).getTime() -
        new Date(left.scheduled_time || 0).getTime();
      if (timeDelta !== 0) return timeDelta;
      return (declaredStageOrder.get(right.stage) ?? -1) - (declaredStageOrder.get(left.stage) ?? -1);
    })[0]?.stage;
  if (latestScheduledStage) return latestScheduledStage;

  const availableStageSet = new Set([
    ...tournamentResults.flatMap((result) => (result.stage ? [result.stage] : [])),
    ...tournamentMatches.flatMap((match) => (match.stage ? [match.stage] : [])),
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

export function getStageBoardTeamGroups(
  featuredTournament,
  participantEntries = null,
) {
  const map = new Map();
  const sourceEntries = Array.isArray(participantEntries)
    ? participantEntries
    : featuredTournament?.participants || [];
  for (const participant of sourceEntries) {
    const key = normalizeStageBoardValue(participant.team);
    if (!key) continue;
    const rawGroup =
      participant.group_name || participant.group || participant.phase || "-";
    map.set(key, extractGroupLabel(rawGroup));
  }
  return map;
}

function getAverageEliminationPosition(row) {
  const value = row?.averageEliminationPosition;
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

export function compareStageBoardStandings(left, right) {
  if ((right.points || 0) !== (left.points || 0))
    return (right.points || 0) - (left.points || 0);
  if ((right.wwcd || 0) !== (left.wwcd || 0))
    return (right.wwcd || 0) - (left.wwcd || 0);
  if ((right.placementPoints || 0) !== (left.placementPoints || 0))
    return (right.placementPoints || 0) - (left.placementPoints || 0);

  const leftAverage = getAverageEliminationPosition(left);
  const rightAverage = getAverageEliminationPosition(right);
  if (leftAverage !== rightAverage) return leftAverage - rightAverage;

  return String(left.teamName || "").localeCompare(
    String(right.teamName || ""),
  );
}

export function getStageBoardData({
  featuredTournament,
  teams,
  matches,
  matchResults,
  requestedStage,
  participantEntries = null,
}) {
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

  const tournamentMatches = matches.filter(
    (match) => match.tournament_id === featuredTournament.id,
  );
  const tournamentResults = matchResults.filter(
    (result) => result.tournament_id === featuredTournament.id,
  );
  const featuredStage =
    requestedStage ||
    getFeaturedTournamentStage(
      featuredTournament,
      tournamentMatches,
      tournamentResults,
    );
  const isGrandFinalsStage =
    String(featuredStage || "")
      .trim()
      .toLowerCase() === "grand finals";
  const strictStageMatches = sortStageBoardMatches(
    tournamentMatches.filter(
      (match) => !featuredStage || match.stage === featuredStage,
    ),
  );
  const rawBoardMatches =
    strictStageMatches.length > 0
      ? strictStageMatches
      : sortStageBoardMatches(tournamentMatches);
  const boardMatches = rawBoardMatches.map((match, index) => ({
    ...match,
    board_match_number: index + 1,
  }));
  const matchById = new Map(boardMatches.map((match) => [match.id, match]));
  const teamMap = new Map(teams.map((team) => [team.id, team]));
  const groupMap = getStageBoardTeamGroups(
    featuredTournament,
    participantEntries,
  );
  const standingsMap = new Map();

  for (const result of tournamentResults) {
    if (featuredStage && result.stage && result.stage !== featuredStage)
      continue;
    const team = teamMap.get(result.team_id);
    const displayName = team?.name || result.team_name || "Unknown Team";
    const key = result.team_id || normalizeStageBoardValue(displayName);
    const match = matchById.get(result.match_id);
    const matchGroup = isGrandFinalsStage
      ? "-"
      : extractGroupLabel(match?.group_name);
    const participantGroup =
      groupMap.get(normalizeStageBoardValue(displayName)) || "-";
    const resolvedGroup =
      matchGroup && matchGroup !== "-" ? matchGroup : participantGroup;
    const row = standingsMap.get(key) || {
      teamId: result.team_id,
      teamName: displayName,
      logoName: displayName,
      logoSrc: team?.logo_url || getTeamLogoByName(displayName) || null,
      group: isGrandFinalsStage ? "-" : resolvedGroup,
      matches: 0,
      wwcd: 0,
      placementPoints: 0,
      elims: 0,
      points: 0,
      placementSum: 0,
      matchCells: {},
    };

    const wins =
      result.wins_count && result.wins_count > 0
        ? result.wins_count
        : result.placement === 1
          ? 1
          : 0;
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

    if (!isGrandFinalsStage && row.group === "-" && matchGroup !== "-") {
      row.group = matchGroup;
    }

    if (isGrandFinalsStage) {
      row.group = "-";
    }

    standingsMap.set(key, row);
  }

  const standings = [...standingsMap.values()]
    .map((row) => ({
      ...row,
      averageEliminationPosition:
        row.matches > 0 ? row.placementSum / row.matches : null,
    }))
    .sort(compareStageBoardStandings)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  return {
    featuredStage,
    stageMatches: boardMatches,
    standings,
    liveMatch: boardMatches.find((match) => match.status === "live") || null,
    nextMatch:
      boardMatches.find(
        (match) => match.status === "scheduled" && match.scheduled_time,
      ) ||
      boardMatches.find((match) => match.status === "scheduled") ||
      null,
    leader: standings[0] || null,
  };
}
