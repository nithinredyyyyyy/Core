import { base44 } from "@/api/base44Client";

/**
 * Tournament data access. Pages call these helpers instead of talking to the
 * entity client directly so query keys and limits stay in one place.
 */

export const TOURNAMENT_QUERY_KEY = "tournaments";
export const TOURNAMENT_MATCHES_QUERY_KEY = "tournaments-matches";
export const TOURNAMENT_RESULTS_QUERY_KEY = "tournaments-results";

/** @param {number} [limit]
 * @returns {Promise<import("@/types/tournaments").Tournament[]>}
 */
export function listTournaments(limit = 100) {
  return base44.entities.Tournament.list("-created_date", limit);
}

/** @param {number} [limit]
 * @returns {Promise<import("@/types/tournaments").TournamentMatch[]>}
 */
export function listTournamentMatches(limit = 500) {
  return base44.entities.Match.list("-scheduled_time", limit);
}

/** @param {number} [limit]
 * @returns {Promise<import("@/types/tournaments").TournamentResult[]>}
 */
export function listTournamentResults(limit = 1500) {
  return base44.entities.MatchResult.list("-created_date", limit);
}

export function getTournamentPage(tournamentId) {
  return base44.pages.tournament(tournamentId);
}

export const tournamentQueryOptions = { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 };
export function getTournamentCore(id) { return base44.pages.tournamentCore(id); }
export function getTournamentFull(id) { return base44.pages.tournamentFull(id); }
