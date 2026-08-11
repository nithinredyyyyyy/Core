import { compareStageBoardStandings, getStageBoardData } from "./stageBoard.js";
import { normalizeOrganizationName } from "./organizationIdentity.js";
import { buildParticipantEntries, buildStageOptions } from "./bmps2026Progression.js";

export function isPmwc2026Tournament(tournament) {
  return tournament?.name === "PUBG Mobile World Cup 2026";
}

export function normalizeStageName(stageName) {
  return String(stageName || "")
    .trim()
    .toLowerCase();
}

export function getPmwc2026NextStageName(stageName) {
  const normalized = normalizeStageName(stageName);
  if (normalized === "group stage") return "Survival Stage";
  if (normalized === "survival stage") return "Grand Finals";
  return null;
}

export function shouldDerivePmwc2026Stage(stageName) {
  const normalized = normalizeStageName(stageName);
  return normalized === "group stage" || normalized === "survival stage";
}

export function getPmwc2026StageDestination({ stageName, group, placement }) {
  const normalized = normalizeStageName(stageName);
  if (normalized === "group stage") {
    if (placement >= 1 && placement <= 5) return "Grand Finals";
    if (placement >= 6 && placement <= 13) return "Survival Stage";
    return null;
  }
  if (normalized === "survival stage") {
    return placement >= 1 && placement <= 6 ? "Grand Finals" : null;
  }
  return null;
}

export function getPmwc2026MovementRule(stageName, group, position) {
  const normalizedStage = normalizeStageName(stageName);

  if (normalizedStage === "group stage") {
    if (!group || String(group).trim().toLowerCase() === "overall") return null;
    if (position >= 1 && position <= 5) return { label: "Advance to Grand Finals", tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
    if (position >= 6 && position <= 13) return { label: "Advance to Survival Stage", tone: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" };
    if (position >= 14) return { label: "Eliminated", tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400" };
  }
  if (normalizedStage === "survival stage") {
    if (position >= 1 && position <= 6) return { label: "Advance to Grand Finals", tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
    if (position >= 7) return { label: "Eliminated", tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400" };
  }
  return null;
}

export function derivePmwc2026ParticipantEntries(
  participantEntries,
  stageBoards,
  options = {},
) {
  const {
    getRows = (stage) => stage?.standings || [],
    getGroup = (row) => row?.grp || row?.group,
    getTeamName = (row) => row?.teamName || row?.fullTeam || row?.team,
  } = options;

  const baseEntries = Array.isArray(participantEntries) ? participantEntries : [];
  const derivedEntries = [...baseEntries];
  const teamEntryMap = new Map(
    baseEntries.map((entry) => [normalizeOrganizationName(entry.team), entry]),
  );

  const hasStageEntry = (teamName, stageName) => {
    const teamKey = normalizeOrganizationName(teamName);
    const stageKey = normalizeStageName(stageName);
    return derivedEntries.some((entry) => {
      return (
        normalizeOrganizationName(entry.team) === teamKey &&
        normalizeStageName(entry.phase).startsWith(stageKey)
      );
    });
  };

  for (const stage of stageBoards || []) {
    const stageName = stage?.name;
    if (!shouldDerivePmwc2026Stage(stageName)) continue;

    const stageStandings = (getRows(stage) || []).filter(Boolean);
    if (!stageStandings.length) continue;

    const rowsByGroup = new Map();
    for (const row of stageStandings) {
      const group = String(getGroup(row) || "").trim().toUpperCase();
      const key = group || "_overall";
      const current = rowsByGroup.get(key) || [];
      current.push(row);
      rowsByGroup.set(key, current);
    }

    for (const [, rows] of rowsByGroup.entries()) {
      const ordered = rows.toSorted(compareStageBoardStandings);
      ordered.forEach((row, index) => {
        const placement = index + 1;
        const destinationStage = getPmwc2026StageDestination({
          stageName,
          group: getGroup(row),
          placement,
        });
        if (!destinationStage) return;

        const teamName = getTeamName(row) || "Unknown Team";
        if (hasStageEntry(teamName, destinationStage)) return;

        const sourceEntry = teamEntryMap.get(normalizeOrganizationName(teamName));
        derivedEntries.push({
          ...(sourceEntry || {}),
          placement,
          team: sourceEntry?.team || teamName,
          group_name: undefined,
          phase: destinationStage,
          players: sourceEntry?.players || [],
        });
      });
    }
  }

  return derivedEntries;
}

export function resolvePmwc2026ParticipantState({
  tournament,
  teams = [],
  matches = [],
  matchResults = [],
  participantEntries = null,
  stageNames = null,
}) {
  const baseEntries = Array.isArray(participantEntries)
    ? participantEntries
    : buildParticipantEntries(tournament);

  const resolvedStageNames =
    Array.isArray(stageNames) && stageNames.length > 0
      ? stageNames
      : buildStageOptions(tournament, matches, matchResults);

  const progressionOptions = {
    getRows: (stage) => stage?.standings || [],
    getGroup: (row) => row?.grp || row?.group,
    getTeamName: (row) => row?.teamName || row?.fullTeam || row?.team,
  };

  let resolvedEntries = [...baseEntries];
  const stageBoards = [];

  for (const stageName of resolvedStageNames) {
    const board = getStageBoardData({
      featuredTournament: tournament,
      teams,
      matches,
      matchResults,
      requestedStage: stageName,
      participantEntries: resolvedEntries,
    });

    const stageBoard = {
      name: stageName,
      standings: board.standings,
    };
    stageBoards.push(stageBoard);

    if (shouldDerivePmwc2026Stage(stageName)) {
      resolvedEntries = derivePmwc2026ParticipantEntries(
        resolvedEntries,
        [stageBoard],
        progressionOptions,
      );
    }
  }

  return {
    participantEntries: resolvedEntries,
    stageBoards,
  };
}
