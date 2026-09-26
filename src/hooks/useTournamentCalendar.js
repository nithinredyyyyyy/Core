import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TOURNAMENT_MATCHES_QUERY_KEY,
  TOURNAMENT_QUERY_KEY,
  TOURNAMENT_RESULTS_QUERY_KEY,
  listTournamentMatches,
  listTournamentResults,
  listTournaments,
} from "@/services/tournaments";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import {
  decorateMatchesWithLiveStatus,
  decorateTournamentsWithLiveStatus,
} from "@/lib/liveCalendar";

const EMPTY = [];

/**
 * Tournament calendar: tournaments decorated with derived live status plus the
 * matches and published results that drive those statuses.
 *
 * Shared by the tournaments list, match center, and home so the same status
 * derivation is applied everywhere.
 */
export function useTournamentCalendar({ enabled = true } = {}) {
  const tournamentsQuery = useQuery({
    queryKey: [TOURNAMENT_QUERY_KEY],
    queryFn: () => listTournaments(100),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled,
  });
  const matchesQuery = useQuery({
    queryKey: [TOURNAMENT_MATCHES_QUERY_KEY],
    queryFn: () => listTournamentMatches(500),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled,
  });
  const resultsQuery = useQuery({
    queryKey: [TOURNAMENT_RESULTS_QUERY_KEY],
    queryFn: () => listTournamentResults(1500),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled,
  });

  const tournaments = tournamentsQuery.data || EMPTY;
  const matches = matchesQuery.data || EMPTY;
  const rawResults = resultsQuery.data || EMPTY;

  const results = useMemo(
    () => filterPublishedMatchResults(rawResults),
    [rawResults],
  );

  const calendarMatches = useMemo(
    () => decorateMatchesWithLiveStatus(matches, results),
    [matches, results],
  );

  const calendarTournaments = useMemo(
    () => decorateTournamentsWithLiveStatus(tournaments, matches, results),
    [tournaments, matches, results],
  );

  return {
    tournaments,
    matches,
    results,
    calendarMatches,
    calendarTournaments,
    isLoading:
      tournamentsQuery.isLoading ||
      matchesQuery.isLoading ||
      resultsQuery.isLoading,
    isError:
      tournamentsQuery.isError ||
      matchesQuery.isError ||
      resultsQuery.isError,
    refetch: () => {
      tournamentsQuery.refetch();
      matchesQuery.refetch();
      resultsQuery.refetch();
    },
  };
}
