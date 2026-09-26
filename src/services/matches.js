import { base44 } from "@/api/base44Client";

export const MATCHES_QUERY_KEY = "matches";
export const MATCH_RESULTS_QUERY_KEY = "match-results";

export function listMatches(limit = 500) {
  return base44.entities.Match.list("-scheduled_time", limit);
}

export function listMatchResults(limit = 2000) {
  return base44.entities.MatchResult.list("-created_date", limit);
}

export function getMatch(matchId) {
  return base44.entities.Match.get(matchId);
}
