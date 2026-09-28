import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PLAYER_MATCH_STATS_QUERY_KEY,
  listPlayerMatchStatsForMatch,
} from "@/services/matches";
import { buildPlayerStatRows } from "@/lib/playerMatchStats";

// Player-level statistics are optional: many matches (and every stage snapshot)
// have none. An empty result is a valid, expected state, so this hook never
// treats "zero rows" as an error.
export function useMatchPlayerStats(matchId) {
  const query = useQuery({
    queryKey: [PLAYER_MATCH_STATS_QUERY_KEY, matchId],
    queryFn: () => listPlayerMatchStatsForMatch(matchId),
    enabled: Boolean(matchId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const rows = useMemo(
    () => buildPlayerStatRows(query.data || []),
    [query.data],
  );

  return { rows, isLoading: query.isLoading, isError: query.isError };
}
