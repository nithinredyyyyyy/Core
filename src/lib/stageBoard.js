import { getTeamLogoByName } from "./teamLogos.js";
import { normalizeOrganizationName } from "./organizationIdentity.js";

const BMPS_2026_SURVIVAL_STAGE_GROUPS = {
  madkingsesports: "A",
  madkings: "A",
  teamaryan: "A",
  aryan: "A",
  hadxesports: "A",
  hadx: "A",
  nonxesports: "A",
  nonx: "A",
  rapidchaosesports: "A",
  rapidchaos: "A",
  vxt: "A",
  teamversatile: "A",
  versatile: "A",
  aresesport: "A",
  ares: "A",
  likithaesports: "A",
  likitha: "A",

  jaguaresports: "B",
  jaguar: "B",
  k9esports: "B",
  k9: "B",
  esportsocial: "B",
  santaesports: "B",
  santa: "B",
  truerippers: "B",
  quantumsparks: "B",
  quantumspark: "B",
  risingesports: "B",
  rising: "B",
  teamdoxy: "B",
  doxy: "B",

  naqshesports: "C",
  naqsh: "C",
  learnfrompast: "C",
  lefp: "C",
  teamredxross: "C",
  redxross: "C",
  thundergodsxtortugagaming: "C",
  tdr: "C",
  godsentesports: "C",
  godsent: "C",
  teamapexgaming: "C",
  apexgaming: "C",
  dcxscr: "C",
  dcxscresports: "C",
  genxfmesports: "C",
  genxfm: "C",

  phoenixesports: "D",
  phoenix: "D",
  phoneix: "D",
  lastadeesports: "D",
  lastade: "D",
  teamh4k: "D",
  h4k: "D",
  riotnationz: "D",
  riotnation: "D",
  riotnations: "D",
  t7xorionesports: "D",
  t7: "D",
  troytamilianesports: "D",
  troytamilian: "D",
  auraxesports: "D",
  aurax: "D",
  mythofficial: "D",
  myth: "D",
};

function getBmps2026SurvivalStageGroup(teamName) {
  const aliasKey = normalizeOrganizationName(teamName);
  const compactKey = normalizeStageBoardValue(teamName);
  return (
    BMPS_2026_SURVIVAL_STAGE_GROUPS[aliasKey] ||
    BMPS_2026_SURVIVAL_STAGE_GROUPS[compactKey] ||
    null
  );
}

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
  const matches = Array.from(value.matchAll(/group\s+([a-z0-9]+)/gi));
  if (matches.length > 0) return matches[matches.length - 1][1].toUpperCase();
  if (/^[A-Z0-9]$/i.test(value)) return value.toUpperCase();
  return value || "-";
}

export function getStageBoardTeamGroups(
  featuredTournament,
  participantEntries = null,
  requestedStage = "",
) {
  const map = new Map();
  const sourceEntries = Array.isArray(participantEntries)
    ? participantEntries
    : featuredTournament?.participants || [];
  const stageKey = String(requestedStage || "").trim().toLowerCase();
  const stageScopedEntries = stageKey
    ? sourceEntries.filter((participant) =>
        new RegExp(`^${stageKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*-\\s*group\\s+[a-d]$`, "i").test(
          String(participant?.phase || "").trim(),
        ),
      )
    : [];
  const entries = stageScopedEntries.length > 0 ? stageScopedEntries : sourceEntries;

  for (const participant of entries) {
    const rawKey = normalizeStageBoardValue(participant.team);
    const organizationKey = normalizeOrganizationName(participant.team);
    if (!rawKey && !organizationKey) continue;
    const rawGroup =
      participant.group_name || participant.group || participant.phase || "-";
    const group = extractGroupLabel(rawGroup);
    if (rawKey) map.set(rawKey, group);
    if (organizationKey) map.set(organizationKey, group);
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
  const isBmps2026SurvivalStage =
    featuredTournament?.name === "Battlegrounds Mobile India Pro Series 2026" &&
    String(featuredStage || "").trim().toLowerCase() === "survival stage";
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
    featuredStage,
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
      groupMap.get(normalizeStageBoardValue(displayName)) ||
      groupMap.get(normalizeOrganizationName(displayName)) ||
      "-";
    const bmpsSurvivalGroup = isBmps2026SurvivalStage
      ? getBmps2026SurvivalStageGroup(displayName)
      : null;
    const resolvedGroup =
      bmpsSurvivalGroup ||
      (participantGroup && participantGroup !== "-"
        ? participantGroup
        : isBmps2026SurvivalStage
          ? "-"
          : matchGroup);
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

    if (!isGrandFinalsStage && row.group === "-") {
      row.group = resolvedGroup;
    }

    if (isGrandFinalsStage) {
      row.group = "-";
    }

    standingsMap.set(key, row);
  }

  const isBmps2026KnockoutStage =
    featuredTournament?.name === "Battlegrounds Mobile India Pro Series 2026" &&
    ["survival stage", "semi finals", "last chance stage"].includes(
      String(featuredStage || "").trim().toLowerCase(),
    );

  if (isBmps2026KnockoutStage && Array.isArray(participantEntries)) {
    const stageKey = String(featuredStage || "").trim().toLowerCase();
    const listedTeams = new Set(
      [...standingsMap.values()].map((row) => normalizeOrganizationName(row.teamName)),
    );

    for (const participant of participantEntries) {
      const phases = [
        participant?.phase,
        ...(Array.isArray(participant?.stageEntries)
          ? participant.stageEntries.map((stageEntry) =>
              stageEntry?.phase || stageEntry?.stageName,
            )
          : []),
      ];
      const matchingPhase = phases.find((phase) =>
        String(phase || "").trim().toLowerCase().startsWith(stageKey),
      );
      const teamName = participant?.team;
      const teamKey = normalizeOrganizationName(teamName);
      if (!matchingPhase || !teamName || !teamKey || listedTeams.has(teamKey)) continue;

      const group = isBmps2026SurvivalStage
        ? getBmps2026SurvivalStageGroup(teamName)
        : extractGroupLabel(matchingPhase);
      standingsMap.set(`participant:${teamKey}`, {
        teamId: null,
        teamName,
        logoName: teamName,
        logoSrc: getTeamLogoByName(teamName) || null,
        group: group || "-",
        matches: 0,
        wwcd: 0,
        placementPoints: 0,
        elims: 0,
        points: 0,
        placementSum: 0,
        matchCells: {},
      });
      listedTeams.add(teamKey);
    }
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
