import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PLAYERS_QUERY_KEY, listPlayers } from "@/services/players";
import { TEAMS_PAGE_QUERY_KEY, getTeamsPage } from "@/services/teams";
import { buildTeamAliasIndex } from "@/lib/normalizedIdentity";
import { getOrganizationMetaFromAliases } from "@/lib/normalizedIdentity";
import { getOfficialParticipantEntries } from "@/lib/tournamentParticipants";
import { getPlayerDisplayName } from "@/lib/playerDisplayName";

const EMPTY = [];

/**
 * Player directory. Resolves each player's team name through the shared alias
 * index so search by IGN, real name, or team works consistently.
 *
 * Team aliases and the tournament list come from the public `/pages/teams`
 * payload: the raw alias entities are admin-scoped and return 403 to visitors.
 */
export function usePlayers() {
  const playersQuery = useQuery({
    queryKey: [PLAYERS_QUERY_KEY],
    queryFn: () => listPlayers(800),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const teamsPageQuery = useQuery({
    queryKey: [TEAMS_PAGE_QUERY_KEY],
    queryFn: () => getTeamsPage(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const players = playersQuery.data || EMPTY;
  const teamsPage = teamsPageQuery.data || {};
  const teams = teamsPage.teams || EMPTY;
  const teamAliases = teamsPage.teamAliases || EMPTY;
  const tournaments = teamsPage.tournaments || EMPTY;

  const teamAliasIndex = useMemo(
    () => buildTeamAliasIndex(teams, teamAliases),
    [teams, teamAliases],
  );

  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );

  /** Participant rosters per tournament, keyed by normalized team name. */
  const participantTeamIndex = useMemo(() => {
    const index = new Map();
    for (const tournament of tournaments) {
      for (const entry of getOfficialParticipantEntries(tournament)) {
        const meta = getOrganizationMetaFromAliases(entry.team, teamAliasIndex);
        if (!meta?.key || index.has(meta.key)) continue;
        index.set(meta.key, {
          teamName: meta.name,
          tournamentId: tournament.id,
          tournamentName: tournament.name,
        });
      }
    }
    return index;
  }, [tournaments, teamAliasIndex]);

  const directory = useMemo(
    () =>
      players.map((player) => {
        const teamRow = teamsById.get(player.team_id) || null;
        const meta = teamRow
          ? getOrganizationMetaFromAliases(teamRow, teamAliasIndex)
          : null;
        const participant = meta?.key
          ? participantTeamIndex.get(meta.key) || null
          : null;
        return {
          ...player,
          displayIgn: getPlayerDisplayName(player.ign),
          teamName: meta?.name || participant?.teamName || null,
          teamKey: meta?.key || null,
          tournamentName: participant?.tournamentName || null,
        };
      }),
    [players, teamsById, teamAliasIndex, participantTeamIndex],
  );

  return {
    players: directory,
    teams,
    tournaments,
    teamAliasIndex,
    isLoading: playersQuery.isLoading || teamsPageQuery.isLoading,
    isError: playersQuery.isError || teamsPageQuery.isError,
    refetch: () => {
      playersQuery.refetch();
      teamsPageQuery.refetch();
    },
  };
}
