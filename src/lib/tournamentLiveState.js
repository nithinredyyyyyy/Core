import {
  buildParticipantEntries,
  resolveTournamentParticipantState,
} from "./bmps2026Progression.js";
import {
  decorateMatchesWithLiveStatus,
  decorateTournamentsWithLiveStatus,
} from "./liveCalendar.js";
import { sortStageBoardMatches, getStageBoardData } from "./stageBoard.js";

export function getTournamentSortDate(tournament) {
  return new Date(
    tournament?.start_date ||
      tournament?.end_date ||
      tournament?.updated_date ||
      tournament?.created_date ||
      0,
  ).getTime();
}

export function getFeaturedTournamentFromCalendar(
  calendarTournaments = [],
  requestedTournamentId = "",
) {
  if (requestedTournamentId) {
    const requested = calendarTournaments.find(
      (tournament) => tournament.id === requestedTournamentId,
    );
    if (requested) return requested;
  }

  const ongoing = calendarTournaments.find(
    (tournament) => tournament.status === "ongoing",
  );
  if (ongoing) return ongoing;

  const upcoming = calendarTournaments.reduce((best, tournament) => {
    if (tournament.status !== "upcoming") return best;
    if (!best) return tournament;
    return getTournamentSortDate(tournament) < getTournamentSortDate(best)
      ? tournament
      : best;
  }, null);
  if (upcoming) return upcoming;

  const completed = calendarTournaments.reduce((best, tournament) => {
    if (tournament.status !== "completed") return best;
    if (!best) return tournament;
    return getTournamentSortDate(tournament) > getTournamentSortDate(best)
      ? tournament
      : best;
  }, null);
  if (completed) return completed;

  return calendarTournaments[0] || null;
}

export function resolveTournamentLiveState({
  tournaments = [],
  teams = [],
  matches = [],
  matchResults = [],
  requestedTournamentId = "",
  requestedStage = null,
}) {
  const calendarMatches = decorateMatchesWithLiveStatus(matches, matchResults);
  const calendarTournaments = decorateTournamentsWithLiveStatus(
    tournaments,
    calendarMatches,
    matchResults,
  );
  const featuredTournament = getFeaturedTournamentFromCalendar(
    calendarTournaments,
    requestedTournamentId,
  );
  const featuredParticipantEntries = featuredTournament
    ? resolveTournamentParticipantState({
        tournament: featuredTournament,
        teams,
        matches: calendarMatches,
        matchResults,
        participantEntries: buildParticipantEntries(featuredTournament),
      }).participantEntries
    : [];
  const stageBoard = getStageBoardData({
    featuredTournament,
    teams,
    matches: calendarMatches,
    matchResults,
    requestedStage,
    participantEntries: featuredParticipantEntries,
  });
  const featuredMatches = featuredTournament
    ? sortStageBoardMatches(
        calendarMatches.filter(
          (match) => match.tournament_id === featuredTournament.id,
        ),
      )
    : [];
  const stageScopedMatches =
    stageBoard.stageMatches.length > 0
      ? stageBoard.stageMatches
      : featuredMatches;

  return {
    calendarMatches,
    calendarTournaments,
    featuredTournament,
    featuredParticipantEntries,
    featuredMatches,
    stageBoard,
    stageScopedMatches,
  };
}
