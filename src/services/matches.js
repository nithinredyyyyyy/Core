import { base44 } from "@/api/base44Client";
import { paginateList } from "./pagination";

export const MATCHES_QUERY_KEY = "matches";
export const MATCH_RESULTS_QUERY_KEY = "match-results";
export const PLAYER_MATCH_STATS_QUERY_KEY = "player-match-stats";

// The server caps Match at 3000 and MatchResult/PlayerMatchStat at 5000 per
// response, so these go through the paginating helper instead of assuming one
// request returns everything. Page size stays under every cap.
const MATCH_PAGE_SIZE = 1000;
const MATCH_RESULT_PAGE_SIZE = 2000;
const PLAYER_MATCH_STAT_PAGE_SIZE = 2000;

export function listMatches(limit = MATCH_PAGE_SIZE) {
  return paginateList(base44.entities.Match, "-scheduled_time", {
    pageSize: Math.min(limit, MATCH_PAGE_SIZE),
  });
}

export function listMatchResults(limit = MATCH_RESULT_PAGE_SIZE) {
  return paginateList(base44.entities.MatchResult, "-created_date", {
    pageSize: Math.min(limit, MATCH_RESULT_PAGE_SIZE),
  });
}

export function listPlayerMatchStats(limit = PLAYER_MATCH_STAT_PAGE_SIZE) {
  return paginateList(base44.entities.PlayerMatchStat, "-created_date", {
    pageSize: Math.min(limit, PLAYER_MATCH_STAT_PAGE_SIZE),
  });
}

export function listPlayerMatchStatsForMatch(matchId) {
  return base44.entities.PlayerMatchStat.filter(
    { match_id: matchId },
    "player_name",
    500,
  );
}

export function getMatch(matchId) {
  return base44.entities.Match.get(matchId);
}
