import { entityConfigs } from "../db.js";
import {
  applyListQuery,
  getPublishedNewsArticles,
  listEntity,
} from "./listQuery.js";
import {
  slimMatchRecord,
  slimMatchResultRecord,
  slimPlayerRecord,
  slimTeamRecord,
  stripPageAuditFields,
} from "./records.js";
import { getNormalizedTournamentSafe } from "./tournaments.js";

export function getHomeSummaryPayload() {
  const tournaments = applyListQuery(
    "Tournament",
    entityConfigs.Tournament,
    {},
    {
      sort_by: "-created_date",
      limit: 100,
    },
  );
  const teams = applyListQuery(
    "Team",
    entityConfigs.Team,
    {},
    {
      sort_by: "-total_points",
      limit: 400,
    },
  );
  const matches = applyListQuery(
    "Match",
    entityConfigs.Match,
    {},
    {
      sort_by: "-scheduled_time",
      limit: 80,
    },
  );
  const results = applyListQuery(
    "MatchResult",
    entityConfigs.MatchResult,
    {},
    {
      sort_by: "-created_date",
      limit: 1200,
    },
  );
  const news = getPublishedNewsArticles({
    sort_by: "-created_date",
    limit: 100,
  });

  return {
    tournaments,
    teams,
    matches,
    results,
    news,
  };
}

function getFeaturedTournament(tournaments) {
  return (
    tournaments.find((entry) => entry.status === "ongoing") ||
    tournaments[0] ||
    null
  );
}

export function getTournamentCorePayload(tournamentId) {
  return {
    matches: listEntity(
      "Match",
      { tournament_id: tournamentId },
      { sort_by: "-scheduled_time", limit: 300 },
    ).map(slimMatchRecord),
    matchResults: listEntity(
      "MatchResult",
      { tournament_id: tournamentId },
      { sort_by: "-created_date", limit: 5000 },
    ).map(slimMatchResultRecord),
    normalizedTournamentData: stripPageAuditFields(
      getNormalizedTournamentSafe(tournamentId),
    ),
  };
}

export function getTournamentFullPayload(tournamentId) {
  return {
    teams: listEntity("Team", {}, { sort_by: "-total_points", limit: 300 }).map(
      slimTeamRecord,
    ),
    players: listEntity("Player", {}, { sort_by: "-total_kills", limit: 500 }).map(
      slimPlayerRecord,
    ),
    transfers: listEntity("TransferWindow", {}, { sort_by: "-date", limit: 500 }),
  };
}

export function getTournamentPagePayload(tournamentId) {
  return {
    ...getTournamentCorePayload(tournamentId),
    ...getTournamentFullPayload(tournamentId),
  };
}

export function getTeamsPagePayload() {
  return {
    teams: listEntity("Team", {}, { sort_by: "-total_points", limit: 400 }).map(
      slimTeamRecord,
    ),
    players: listEntity("Player", {}, { sort_by: "-created_date", limit: 500 }).map(
      slimPlayerRecord,
    ),
    transferWindows: listEntity(
      "TransferWindow",
      {},
      { sort_by: "-date", limit: 500 },
    ),
    tournaments: listEntity(
      "Tournament",
      {},
      { sort_by: "-created_date", limit: 100 },
    ),
    teamAliases: listEntity("TeamAlias", {}, { sort_by: "-created_date", limit: 2000 }),
  };
}

export function getLeaderboardPagePayload(requestedTournamentId = "") {
  const tournaments = listEntity(
    "Tournament",
    {},
    { sort_by: "-created_date", limit: 100 },
  );
  const selectedTournament =
    tournaments.find((tournament) => tournament.id === requestedTournamentId) ||
    getFeaturedTournament(tournaments);
  const tournamentId = selectedTournament?.id || "";

  return {
    tournaments,
    selectedTournament,
    matches: tournamentId
      ? listEntity(
          "Match",
          { tournament_id: tournamentId },
          { sort_by: "-scheduled_time", limit: 300 },
        ).map(slimMatchRecord)
      : [],
    matchResults: tournamentId
      ? listEntity(
          "MatchResult",
          { tournament_id: tournamentId },
          { sort_by: "-created_date", limit: 5000 },
        ).map(slimMatchResultRecord)
      : [],
    teams: listEntity("Team", {}, { sort_by: "-created_date", limit: 300 }).map(
      slimTeamRecord,
    ),
  };
}

export function getTeamDetailPagePayload() {
  return {
    teams: listEntity("Team", {}, { sort_by: "-total_points", limit: 400 }),
    tournaments: listEntity(
      "Tournament",
      {},
      { sort_by: "-created_date", limit: 50 },
    ),
    teamAliases: listEntity("TeamAlias", {}, { sort_by: "-created_date", limit: 2000 }),
    results: listEntity("MatchResult", {}, { sort_by: "-created_date", limit: 5000 }),
    matches: listEntity("Match", {}, { sort_by: "-scheduled_time", limit: 200 }),
    normalizedStages: listEntity(
      "TournamentStage",
      {},
      { sort_by: "stage_order", limit: 1000 },
    ),
    normalizedParticipants: listEntity(
      "TournamentParticipant",
      {},
      { sort_by: "-created_date", limit: 2000 },
    ),
    normalizedStandings: listEntity(
      "StageStanding",
      {},
      { sort_by: "rank", limit: 5000 },
    ),
    articles: getPublishedNewsArticles({ sort_by: "-created_date", limit: 50 }),
  };
}
