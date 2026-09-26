import { base44 } from "@/api/base44Client";

export const RANKINGS_QUERY_KEY = "rankings-page";
export const LEADERBOARD_QUERY_KEY = "leaderboard-page";

/**
 * Long-term rankings: cross-season team/player rating plus EWC club ranking.
 * This is deliberately separate from the tournament-specific leaderboard.
 */
export function getRankingsPage() {
  return base44.pages.rankings();
}

/** Tournament-specific standings board. */
export function getLeaderboardPage(tournamentId = "") {
  return base44.pages.leaderboard(tournamentId);
}
