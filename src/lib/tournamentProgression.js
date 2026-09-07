import { isBmps2026PromotionStage, buildParticipantEntries, buildStageOptions, resolveBmps2026ParticipantState } from "./bmps2026Progression.js";
export { isBmps2026PromotionStage, buildParticipantEntries, buildStageOptions };
import { resolvePmwc2026ParticipantState, isPmwcTournament } from "./pmwc2026Progression.js";
import { getStageBoardData } from "./stageBoard.js";

export function resolveTournamentParticipantState({
  tournament,
  teams = [],
  matches = [],
  matchResults = [],
  participantEntries = null,
  stageNames = null,
  stageStandings = null,
}) {
  if (!tournament) {
    return {
      participantEntries: [],
      stageBoards: [],
    };
  }

  if (tournament.name === "Battlegrounds Mobile India Pro Series 2026") {
    return resolveBmps2026ParticipantState({
      tournament,
      teams,
      matches,
      matchResults,
      participantEntries,
      stageNames,
      stageStandings,
    });
  }

  if (isPmwcTournament(tournament)) {
    return resolvePmwc2026ParticipantState({
      tournament,
      teams,
      matches,
      matchResults,
      participantEntries,
      stageNames,
      stageStandings,
    });
  }

  // Default fallback for other tournaments
  const baseEntries = Array.isArray(participantEntries)
    ? participantEntries
    : buildParticipantEntries(tournament);

  const resolvedStageNames =
    Array.isArray(stageNames) && stageNames.length > 0
      ? stageNames
      : buildStageOptions(tournament, matches, matchResults);

  const stageBoards = resolvedStageNames.map((stageName) => ({
    name: stageName,
    standings: getStageBoardData({
      featuredTournament: tournament,
      teams,
      matches,
      matchResults,
      requestedStage: stageName,
      participantEntries: baseEntries,
      stageStandings,
    }).standings,
  }));

  return {
    participantEntries: baseEntries,
    stageBoards,
  };
}
