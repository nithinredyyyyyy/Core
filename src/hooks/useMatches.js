import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MATCHES_QUERY_KEY,
  MATCH_RESULTS_QUERY_KEY,
  listMatchResults,
  listMatches,
} from "@/services/matches";
import { TOURNAMENT_QUERY_KEY, listTournaments } from "@/services/tournaments";
import { TEAMS_QUERY_KEY, listTeams } from "@/services/teams";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import { decorateMatchesWithLiveStatus } from "@/lib/liveCalendar";
import { buildMatchViewModel } from "@/lib/matchViewModel";

const EMPTY = [];

/** Shared query options so every match surface uses the same cache window. */
function matchQueryOptions(queryKey, queryFn) {
  return {
    queryKey,
    queryFn,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  };
}

/**
 * Match Center data: matches decorated with live/upcoming/recent status, their
 * published results, owning tournaments, teams, and per-match view models.
 */
export function useMatches() {
  const matchesQuery = useQuery(
    matchQueryOptions([MATCHES_QUERY_KEY], () => listMatches(500)),
  );
  const resultsQuery = useQuery(
    matchQueryOptions([MATCH_RESULTS_QUERY_KEY], () => listMatchResults(2000)),
  );
  const tournamentsQuery = useQuery(
    matchQueryOptions([TOURNAMENT_QUERY_KEY], () => listTournaments(100)),
  );
  const teamsQuery = useQuery(
    matchQueryOptions([TEAMS_QUERY_KEY], () => listTeams(400)),
  );

  const rawMatches = matchesQuery.data || EMPTY;
  const rawResults = resultsQuery.data || EMPTY;
  const tournaments = tournamentsQuery.data || EMPTY;
  const teams = teamsQuery.data || EMPTY;

  const results = useMemo(
    () => filterPublishedMatchResults(rawResults),
    [rawResults],
  );

  const matches = useMemo(
    () => decorateMatchesWithLiveStatus(rawMatches, results),
    [rawMatches, results],
  );

  const resultsByMatch = useMemo(() => {
    const map = new Map();
    for (const result of results) {
      if (!result?.match_id) continue;
      if (!map.has(result.match_id)) map.set(result.match_id, []);
      map.get(result.match_id).push(result);
    }
    for (const rows of map.values()) {
      rows.sort((left, right) => (left.placement ?? 999) - (right.placement ?? 999));
    }
    return map;
  }, [results]);

  const tournamentsById = useMemo(
    () => new Map(tournaments.map((tournament) => [tournament.id, tournament])),
    [tournaments],
  );

  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );

  /** Match cards render from these view models, never from raw API rows. */
  const matchViewModels = useMemo(
    () =>
      matches.map((match) =>
        buildMatchViewModel({
          match,
          tournament: tournamentsById.get(match.tournament_id) || null,
          results: resultsByMatch.get(match.id) || EMPTY,
          teamsById,
        }),
      ),
    [matches, tournamentsById, resultsByMatch, teamsById],
  );

  return {
    matches,
    matchViewModels,
    results,
    resultsByMatch,
    tournaments,
    tournamentsById,
    teams,
    teamsById,
    isLoading:
      matchesQuery.isLoading ||
      resultsQuery.isLoading ||
      tournamentsQuery.isLoading ||
      teamsQuery.isLoading,
    isError:
      matchesQuery.isError ||
      resultsQuery.isError ||
      tournamentsQuery.isError ||
      teamsQuery.isError,
    refetch: () => {
      matchesQuery.refetch();
      resultsQuery.refetch();
      tournamentsQuery.refetch();
      teamsQuery.refetch();
    },
  };
}
