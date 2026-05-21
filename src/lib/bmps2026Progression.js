import { compareStageBoardStandings, getStageBoardData } from "@/lib/stageBoard";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";

export function buildStageOptions(tournament, matches, matchResults) {
  if (!tournament) return [];
  const labels = new Map();
  const declaredStages = (tournament.stages || []).map((stage) => stage?.name).filter(Boolean);

  for (const stage of tournament.stages || []) {
    if (stage?.name) labels.set(stage.name, stage.name);
  }
  for (const match of matches) {
    if (match.tournament_id === tournament.id && match.stage && declaredStages.includes(match.stage)) {
      labels.set(match.stage, match.stage);
    }
  }
  for (const result of matchResults) {
    if (result.tournament_id === tournament.id && result.stage && declaredStages.includes(result.stage)) {
      labels.set(result.stage, result.stage);
    }
  }

  return [...labels.values()];
}

export function buildParticipantEntries(tournament) {
  return (tournament?.participants || []).map((entry) => ({
    team: entry.team,
    phase: entry.phase || "Participants",
    players: entry.players || [],
  }));
}

export function isBmps2026PromotionStage(stageName) {
  return /^round\s+[123]$/i.test(String(stageName || "").trim());
}

export function getBmps2026NextStageName(stageName) {
  const normalized = String(stageName || "").trim().toLowerCase();
  if (normalized === "round 1") return "Round 2";
  if (normalized === "round 2") return "Round 3";
  if (normalized === "round 3") return "Round 4";
  return null;
}

export function getBmps2026MovementGroup(group, placement, totalTeams) {
  const label = String(group || "").trim().toUpperCase();
  const total = Math.max(Number(totalTeams) || 0, 0);
  const bottomCutoff = Math.max(total - 3, 13);

  if (label === "A") {
    if (placement >= bottomCutoff) return "B";
    return "A";
  }
  if (label === "B") {
    if (placement <= 4) return "A";
    if (placement >= bottomCutoff) return "C";
    return "B";
  }
  if (label === "C") {
    if (placement <= 4) return "B";
    if (placement >= bottomCutoff) return "D";
    return "C";
  }
  if (label === "D") {
    if (placement <= 4) return "C";
    return "D";
  }
  return label || "A";
}

export function deriveBmps2026ParticipantEntries(participantEntries, stageBoards, options = {}) {
  const {
    getRows = (stage) => stage?.standings || [],
    getGroup = (row) => row?.group,
    getTeamName = (row) => row?.teamName || row?.fullTeam || row?.team,
    buildDerivedEntry,
  } = options;

  const baseEntries = Array.isArray(participantEntries) ? participantEntries : [];
  const derivedEntries = [...baseEntries];
  const teamEntryMap = new Map(
    baseEntries.map((entry) => [normalizeOrganizationName(entry.team), entry])
  );

  for (const stage of stageBoards || []) {
    const stageName = stage?.name;
    const nextStageName = getBmps2026NextStageName(stageName);
    if (!isBmps2026PromotionStage(stageName) || !nextStageName) continue;

    const stageStandings = (getRows(stage) || []).filter((row) => {
      const group = String(getGroup(row) || "").trim();
      return Boolean(group) && group !== "-";
    });
    if (!stageStandings.length) continue;

    const existingNextStageEntries = derivedEntries.filter((entry) =>
      String(entry.phase || "").toLowerCase().startsWith(`${nextStageName.toLowerCase()} - group `)
    );
    if (existingNextStageEntries.length > 0) continue;

    const rowsByGroup = new Map();
    for (const row of stageStandings) {
      const group = String(getGroup(row) || "").trim().toUpperCase();
      if (!group) continue;
      const current = rowsByGroup.get(group) || [];
      current.push(row);
      rowsByGroup.set(group, current);
    }

    for (const [group, rows] of rowsByGroup.entries()) {
      const orderedRows = [...rows].sort(compareStageBoardStandings);
      orderedRows.forEach((row, index) => {
        const destinationGroup = getBmps2026MovementGroup(group, index + 1, orderedRows.length);
        const teamName = getTeamName(row) || "Unknown Team";
        const sourceEntry = teamEntryMap.get(normalizeOrganizationName(teamName));

        derivedEntries.push(
          buildDerivedEntry
            ? buildDerivedEntry({ sourceEntry, row, teamName, destinationGroup, nextStageName })
            : {
                ...(sourceEntry || {}),
                team: sourceEntry?.team || teamName,
                phase: `${nextStageName} - Group ${destinationGroup}`,
                players: sourceEntry?.players || [],
              }
        );
      });
    }
  }

  return derivedEntries;
}

export function resolveTournamentParticipantState({
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

  if (!tournament) {
    return {
      participantEntries: [],
      stageBoards: [],
    };
  }

  const resolvedStageNames = Array.isArray(stageNames) && stageNames.length > 0
    ? stageNames
    : buildStageOptions(tournament, matches, matchResults);

  if (tournament?.name !== "Battlegrounds Mobile India Pro Series 2026") {
    const stageBoards = resolvedStageNames.map((stageName) => ({
      name: stageName,
      standings: getStageBoardData({
        featuredTournament: tournament,
        teams,
        matches,
        matchResults,
        requestedStage: stageName,
        participantEntries: baseEntries,
      }).standings,
    }));

    return {
      participantEntries: baseEntries,
      stageBoards,
    };
  }

  const progressionOptions = {
    getRows: (stage) => stage?.standings || [],
    getGroup: (row) => row?.group,
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

    if (isBmps2026PromotionStage(stageName)) {
      resolvedEntries = deriveBmps2026ParticipantEntries(
        resolvedEntries,
        [stageBoard],
        progressionOptions
      );
    }
  }

  return {
    participantEntries: resolvedEntries,
    stageBoards,
  };
}
