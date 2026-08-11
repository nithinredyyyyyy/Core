import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import { resolveTournamentLiveState } from "@/lib/tournamentLiveState";
import { buildTeamMapStats } from "@/features/leaderboard/data/buildTeamMapStats";

const EMPTY_LEADERBOARD_PAGE_ARRAY = [];

export function useLeaderboardData() {
  const [searchParams] = useSearchParams();
  const requestedTournamentId = searchParams.get("tournament");
  const requestedStage = searchParams.get("stage");

  const { data: leaderboardPage = {}, isLoading } = useQuery({
    queryKey: ["leaderboard-page", requestedTournamentId || ""],
    queryFn: () => base44.pages.leaderboard(requestedTournamentId || ""),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const tournaments = leaderboardPage.tournaments || EMPTY_LEADERBOARD_PAGE_ARRAY;
  const matches = leaderboardPage.matches || EMPTY_LEADERBOARD_PAGE_ARRAY;
  const rawMatchResults =
    leaderboardPage.matchResults || EMPTY_LEADERBOARD_PAGE_ARRAY;
  const matchResults = useMemo(
    () => filterPublishedMatchResults(rawMatchResults),
    [rawMatchResults],
  );
  const teams = leaderboardPage.teams || EMPTY_LEADERBOARD_PAGE_ARRAY;

  const liveState = useMemo(
    () =>
      resolveTournamentLiveState({
        tournaments,
        teams,
        matches,
        matchResults,
        requestedTournamentId,
        requestedStage,
      }),
    [
      matches,
      matchResults,
      requestedStage,
      requestedTournamentId,
      teams,
      tournaments,
    ],
  );
  const {
    calendarMatches,
    calendarTournaments,
    featuredTournament,
    stageBoard,
  } = liveState;

  const tournamentQuery = useMemo(() => {
    if (!featuredTournament) return "";
    const params = new URLSearchParams();
    params.set("id", featuredTournament.id);
    if (stageBoard.featuredStage) {
      params.set("stage", stageBoard.featuredStage);
    }
    return `?${params.toString()}`;
  }, [featuredTournament, stageBoard.featuredStage]);

  const stageOptions = useMemo(() => {
    if (!featuredTournament) return [];

    const labels = new Map();
    const declaredStages = (featuredTournament.stages || []).flatMap((stage) =>
      stage?.name ? [stage.name] : [],
    );
    const declaredStageSet = new Set(declaredStages);

    for (const stage of featuredTournament.stages || []) {
      if (stage?.name) labels.set(stage.name, stage.name);
    }
    for (const match of matches) {
      if (
        match.tournament_id === featuredTournament.id &&
        match.stage &&
        declaredStageSet.has(match.stage)
      ) {
        labels.set(match.stage, match.stage);
      }
    }
    for (const result of matchResults) {
      if (
        result.tournament_id === featuredTournament.id &&
        result.stage &&
        declaredStageSet.has(result.stage)
      ) {
        labels.set(result.stage, result.stage);
      }
    }

    return Array.from(labels.values());
  }, [featuredTournament, matches, matchResults]);

  const nextUpcomingTournament = useMemo(() => {
    const now = new Date();
    return (
      calendarTournaments
        .filter(
          (tournament) =>
            tournament.status === "upcoming" &&
            tournament.start_date &&
            new Date(tournament.start_date) >= now,
        )
        .toSorted((a, b) => new Date(a.start_date) - new Date(b.start_date))[0] ||
      null
    );
  }, [calendarTournaments]);

  const teamMapStats = useMemo(
    () =>
      buildTeamMapStats({
        featuredTournament,
        stageBoard,
        matches: calendarMatches,
        matchResults,
      }),
    [featuredTournament, stageBoard, calendarMatches, matchResults],
  );
  const stageMaps = useMemo(
    () => [
      ...new Set(
        teamMapStats.flatMap((team) =>
          Array.isArray(team.maps)
            ? team.maps.flatMap((entry) => (entry.map ? [entry.map] : []))
            : [],
        ),
      ),
    ],
    [teamMapStats],
  );

  const boardState =
    featuredTournament?.status === "upcoming"
      ? "upcoming"
      : stageBoard.liveMatch
        ? "live"
        : stageBoard.standings.length > 0
          ? "active"
          : "waiting";

  const boardIntro =
    boardState === "live"
      ? "Live scoreboard, up-next signal, and match-by-match scoring in one connected standings view."
      : boardState === "upcoming"
        ? "The next tournament board is armed with scheduled lobbies and will populate the moment results land."
        : stageBoard.standings.length > 0
          ? "Current stage standings, mapped match columns, and leaderboard movement in one connected surface."
          : "Standings will appear here as soon as verified match scores are attached to the selected stage.";


  return {
    isLoading,
    boardIntro,
    featuredTournament,
    stageBoard,
    tournamentQuery,
    stageOptions,
    nextUpcomingTournament,
    teamMapStats,
    calendarMatches,
    stageMaps,
  };
}
