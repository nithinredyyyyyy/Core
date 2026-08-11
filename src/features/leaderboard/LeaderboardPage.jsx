import { LazyMotion, domAnimation, m } from "framer-motion";
import { useLeaderboardData } from "@/features/leaderboard/hooks/useLeaderboardData";
import { LeaderboardPageHeader } from "@/features/leaderboard/components/LeaderboardPageHeader";
import FeaturedStandingsSection from "@/features/leaderboard/components/FeaturedStandingsSection";
import OverallStatsSection from "@/features/leaderboard/components/OverallStatsSection";

export default function LeaderboardPage() {
  const {
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
  } = useLeaderboardData();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          Loading standings
        </p>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="space-y-5 md:space-y-6">
        <LeaderboardPageHeader boardIntro={boardIntro} featuredTournament={featuredTournament} />
        <FeaturedStandingsSection
          featuredTournament={featuredTournament}
          stageBoard={stageBoard}
          tournamentQuery={tournamentQuery}
          stageOptions={stageOptions}
          nextUpcomingTournament={nextUpcomingTournament}
        />
        <OverallStatsSection
          featuredTournament={featuredTournament}
          teamMapStats={teamMapStats}
          calendarMatches={calendarMatches}
        />

      </div>
    </LazyMotion>
  );
}
