import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useMatches } from "@/hooks/useMatches";
import { aggregateTournamentStandings } from "@/lib/homeContent";

const EMPTY = [];
const MAX_STANDINGS_ROWS = 5;
const MAX_RECENT_RESULTS = 6;
const MAX_UPCOMING_EVENTS = 4;

const byScheduleAsc = (left, right) =>
  new Date(left.scheduledTime || 0).getTime() -
  new Date(right.scheduledTime || 0).getTime();

const byScheduleDesc = (left, right) =>
  new Date(right.scheduledTime || 0).getTime() -
  new Date(left.scheduledTime || 0).getTime();

/**
 * Home page data. Combines the aggregated `/home/view` payload (featured event,
 * news, board) with the shared match hook so the home page and the match center
 * read from the same cache and the same status derivation.
 *
 * Every value here comes from the API. When the backend has nothing to show the
 * caller renders an empty state rather than a placeholder team or score.
 */
export function useHomeData() {
  const homeQuery = useQuery({
    queryKey: ["home-view", "desktop"],
    queryFn: () => base44.home.view("desktop"),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const matchesData = useMatches();

  const homeView = homeQuery.data || {};
  const matchViewModels = matchesData.matchViewModels || EMPTY;
  const results = matchesData.results || EMPTY;
  const tournaments = matchesData.tournaments || EMPTY;
  const teamsById = matchesData.teamsById || null;

  const liveMatch = useMemo(
    () => matchViewModels.find((match) => match.status === "live") || null,
    [matchViewModels],
  );

  const upcomingMatches = useMemo(
    () =>
      matchViewModels
        .filter((match) => match.status === "upcoming")
        .toSorted(byScheduleAsc),
    [matchViewModels],
  );

  const recentMatches = useMemo(
    () =>
      matchViewModels
        .filter((match) => match.status === "completed")
        .toSorted(byScheduleDesc)
        .slice(0, MAX_RECENT_RESULTS),
    [matchViewModels],
  );

  const upcomingTournaments = useMemo(
    () =>
      tournaments
        .filter((tournament) => tournament.status === "upcoming")
        .toSorted(
          (left, right) =>
            new Date(left.start_date || 0).getTime() -
            new Date(right.start_date || 0).getTime(),
        )
        .slice(0, MAX_UPCOMING_EVENTS),
    [tournaments],
  );

  /**
   * Standings preview. Prefers the server-computed board for the featured
   * event; when the featured event has no published results yet, falls back to
   * the most recent completed tournament that does have them.
   */
  const standings = useMemo(() => {
    const board = homeView.homeBoard || EMPTY;
    if (board.length > 0) {
      return {
        rows: board.slice(0, MAX_STANDINGS_ROWS),
        title: homeView.boardHeadline || "Tournament board",
        eyebrow: homeView.boardEyebrow || "Standings",
        tournamentId: homeView.boardTournamentId || null,
      };
    }

    const teamsMap = teamsById ? Object.fromEntries(teamsById) : {};
    const completed = tournaments
      .filter((tournament) => tournament.status === "completed")
      .toSorted(
        (left, right) =>
          new Date(right.end_date || 0).getTime() -
          new Date(left.end_date || 0).getTime(),
      );

    for (const tournament of completed) {
      const tournamentResults = results.filter(
        (result) => result.tournament_id === tournament.id,
      );
      if (tournamentResults.length === 0) continue;

      const rows = aggregateTournamentStandings(tournamentResults, teamsMap);
      if (rows.length === 0) continue;

      return {
        rows: rows.slice(0, MAX_STANDINGS_ROWS).map((row, index) => ({
          rank: index + 1,
          teamName: row.teamName,
          logoName: row.rawTeamName || row.teamName,
          wwcd: row.wins,
          points: row.totalPoints,
        })),
        title: tournament.name,
        eyebrow: "Latest completed board",
        tournamentId: tournament.id,
      };
    }

    return {
      rows: EMPTY,
      title: "Tournament board pending",
      eyebrow: "Standings",
      tournamentId: null,
    };
  }, [
    homeView.homeBoard,
    homeView.boardHeadline,
    homeView.boardEyebrow,
    homeView.boardTournamentId,
    tournaments,
    results,
    teamsById,
  ]);

  return {
    isLoading: homeQuery.isLoading || matchesData.isLoading,
    isError: homeQuery.isError || matchesData.isError,
    hasData: Boolean(
      homeView.featuredTournament || matchViewModels.length > 0,
    ),
    refetch: () => {
      homeQuery.refetch();
      matchesData.refetch();
    },
    liveMatch,
    nextMatch: liveMatch ? null : upcomingMatches[0] || null,
    upcomingMatches,
    recentMatches,
    featuredTournament: homeView.featuredTournament || null,
    featuredStage: homeView.featuredSpotlightStage || null,
    facts: homeView.featuredTournamentFacts || EMPTY,
    standings,
    latestNews: homeView.latestNews || EMPTY,
    upcomingTournaments,
    tournaments,
  };
}
