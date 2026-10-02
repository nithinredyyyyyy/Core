import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { Shield, Swords, Trophy, UserCircle2 } from "lucide-react";
import { getPlayerDetailPage } from "@/services/players";
import { getTeamLogoByName, getTeamLogoSurfaceTone } from "@/lib/teamLogos";
import { decorateMatchesWithLiveStatus } from "@/lib/liveCalendar";
import { buildPlayerAliasIndex, buildPlayerTeamHistoryMap, buildTeamAliasIndex, getOrganizationMetaFromAliases, pickBestPlayerRowForTeamContext, resolvePlayerRowsByAlias } from "@/lib/normalizedIdentity";
import { buildNormalizedTournamentResultMaps, getPrizeForOrganization, getTournamentResultForOrganization } from "@/lib/tournamentResults";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import { BMPS_2026_PLAYER_ROW_TEAM_OVERRIDES, BMPS_2026_PLAYER_TEAM_OVERRIDES, BMPS_2026_QUALIFIER_PLAYER_STATS } from "@/lib/bmps2026PlayerStats";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { getPlayerDisplayName } from "@/lib/playerDisplayName";
import { getFeaturedTournamentStage } from "@/lib/stageBoard";
import { decodeIgn, findParticipantTeamForPlayer, resolveTournamentParticipantForPlayer, isMajorTier, normalizeIgn, normalizeStatPlayerKey, getHistoryYear } from "@/components/players/utils/playerProfileHelpers";

export function usePlayerProfileData() {
  const { playerIgn } = useParams();
  const [searchParams] = useSearchParams();
  const decodedIgn = decodeIgn(playerIgn);
  const queryTeam = searchParams.get("team");

  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ["player-detail-page"],
    queryFn: getPlayerDetailPage,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const {
    players = [], teams = [], teamAliases = [], playerAliases = [],
    playerTeamHistory = [], tournaments = [], results: rawResults = [],
    matches = [], normalizedStages = [], normalizedParticipants = [],
    normalizedStandings = [], articles = [],
  } = pageData || {};
  const results = useMemo(() => filterPublishedMatchResults(rawResults), [rawResults]);
  const teamAliasIndex = useMemo(
    () => buildTeamAliasIndex(teams, teamAliases),
    [teamAliases, teams],
  );
  const playerAliasIndex = useMemo(
    () => buildPlayerAliasIndex(players, playerAliases),
    [playerAliases, players],
  );
  const playerHistoryMap = useMemo(
    () => buildPlayerTeamHistoryMap(playerTeamHistory),
    [playerTeamHistory],
  );
  const normalizedResultMaps = useMemo(
    () =>
      buildNormalizedTournamentResultMaps({
        normalizedStages,
        normalizedParticipants,
        normalizedStandings,
      }),
    [normalizedParticipants, normalizedStages, normalizedStandings],
  );

  const decoratedMatches = useMemo(
    () => decorateMatchesWithLiveStatus(matches, results),
    [matches, results],
  );

  const resolved = useMemo(() => {
    const siteTournamentNames = new Set(
      (tournaments || []).flatMap((entry) => {
        const name = String(entry?.name || "").trim();
        return name ? [name] : [];
      }),
    );
    const matchingPlayerRows = resolvePlayerRowsByAlias(
      decodedIgn,
      playerAliasIndex,
      players,
    );
    const snapshotTeam = findParticipantTeamForPlayer(tournaments, decodedIgn);

    const preferredTeamName =
      queryTeam || snapshotTeam?.participant?.team || null;
    const preferredTeamMeta = preferredTeamName
      ? getOrganizationMetaFromAliases(preferredTeamName, teamAliasIndex)
      : null;

    const playerRow =
      pickBestPlayerRowForTeamContext(
        decodedIgn,
        preferredTeamName,
        playerAliasIndex,
        players,
        playerHistoryMap,
        teamAliasIndex,
      ) ||
      matchingPlayerRows[0] ||
      null;

    const playerHistories = playerRow
      ? playerHistoryMap.get(playerRow.id) || []
      : [];
    const currentHistoryTeam =
      (preferredTeamMeta
        ? playerHistories
            .map((entry) => teams.find((team) => team.id === entry.team_id))
            .find(
              (team) =>
                team &&
                getOrganizationMetaFromAliases(team, teamAliasIndex).key ===
                  preferredTeamMeta.key,
            )
        : null) ||
      playerHistories
        .map((entry) => teams.find((team) => team.id === entry.team_id))
        .find(Boolean);

    const fallbackTeamName =
      currentHistoryTeam?.name ||
      (playerRow?.team_id
        ? teams.find((team) => team.id === playerRow.team_id)?.name
        : null) ||
      snapshotTeam?.participant?.team ||
      queryTeam ||
      null;

    const teamMeta = fallbackTeamName
      ? getOrganizationMetaFromAliases(fallbackTeamName, teamAliasIndex)
      : null;
    const teamRow =
      currentHistoryTeam ||
      (playerRow?.team_id
        ? teams.find((team) => team.id === playerRow.team_id) || null
        : null) ||
      (teamMeta
        ? teams.find(
            (team) =>
              getOrganizationMetaFromAliases(team, teamAliasIndex).key ===
              teamMeta.key,
          ) || null
        : null);

    const historyOrgKeys = new Set(
      playerHistories.reduce((keys, entry) => {
        const team = teams.find((candidate) => candidate.id === entry.team_id);
        if (!team) return keys;
        const key = getOrganizationMetaFromAliases(team, teamAliasIndex).key;
        if (key) keys.push(key);
        return keys;
      }, []),
    );
    if (teamMeta?.key) historyOrgKeys.add(teamMeta.key);

    const relatedTournaments = tournaments
      .reduce((items, tournament) => {
        const participant = resolveTournamentParticipantForPlayer({
          tournament,
          ign: decodedIgn,
          preferredTeamMeta,
          historyOrgKeys,
          teamAliasIndex,
        });
        if (!participant) return items;
        items.push({
          id: tournament.id,
          name: tournament.name,
          phase: participant.phase || "Participant",
          placement: participant.placement || null,
          date: tournament.start_date || tournament.created_date,
        });
        return items;
      }, [])
      .toSorted((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const playerResults = tournaments
      .reduce((items, tournament) => {
        const participant = resolveTournamentParticipantForPlayer({
          tournament,
          ign: decodedIgn,
          preferredTeamMeta,
          historyOrgKeys,
          teamAliasIndex,
        });
        if (!participant) return items;
        const resolvedResult = getTournamentResultForOrganization({
          tournament,
          organizationName: participant.team,
          teams,
          matches,
          matchResults: results,
          fallbackParticipant: participant,
          normalizedStages:
            normalizedResultMaps.stagesByTournament.get(tournament.id) || [],
          normalizedStandings:
            normalizedResultMaps.standingsByTournament.get(tournament.id) || [],
        });

        const entry = {
          id: `${tournament.id}-${participant.team}`,
          date:
            tournament.end_date ||
            tournament.start_date ||
            tournament.created_date ||
            null,
          placement: resolvedResult?.placement || "-",
          tier: tournament.tier || "Unrated",
          tournament: tournament.name,
          team: getOrganizationMetaFromAliases(
            resolvedResult?.team || participant.team,
            teamAliasIndex,
          ).name,
          prize:
            getPrizeForOrganization(
              tournament,
              resolvedResult?.team || participant.team,
              resolvedResult?.placement || participant.placement,
            ) || "-",
        };
        if (
          isMajorTier(entry.tier) &&
          siteTournamentNames.has(String(entry.tournament || "").trim())
        ) {
          items.push(entry);
        }
        return items;
      }, [])
      .toSorted((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const relatedArticles = articles
      .filter((article) => {
        const haystack =
          `${article.title || ""} ${article.content || ""}`.toLowerCase();
        return (
          haystack.includes(normalizeIgn(decodedIgn)) ||
          (teamMeta?.name
            ? haystack.includes(teamMeta.name.toLowerCase())
            : false)
        );
      })
      .slice(0, 3);

    const teamResultRows = teamRow
      ? results.filter((row) => row.team_id === teamRow.id)
      : [];

    return {
      playerRow,
      teamRow,
      teamMeta,
      snapshotTeam,
      relatedTournaments,
      playerResults,
      relatedArticles,
      teamResultRows,
      playerHistories,
    };
  }, [
    articles,
    decodedIgn,
    matches,
    normalizedResultMaps,
    playerAliasIndex,
    playerHistoryMap,
    players,
    queryTeam,
    results,
    teamAliasIndex,
    teams,
    tournaments,
  ]);

  const teamName =
    resolved.teamMeta?.name ||
    resolved.teamRow?.name ||
    resolved.snapshotTeam?.participant?.team ||
    searchParams.get("team") ||
    "Unassigned";
  const teamTag = resolved.teamRow?.tag || resolved.teamMeta?.tag || "---";
  const teamLogo =
    getTeamLogoByName(teamName) || resolved.teamRow?.logo_url || null;
  const teamLogoSurfaceTone = getTeamLogoSurfaceTone(teamName);
  const playerPhoto =
    resolved.playerRow?.photo_url || getPlayerPhotoByIgn(decodedIgn);
  const displayIgn = getPlayerDisplayName(decodedIgn);
  const currentTournament = resolved.relatedTournaments[0] || null;
  const currentTournamentStageFocus = useMemo(() => {
    if (!currentTournament?.id) return null;
    const tournamentRow = tournaments.find(
      (entry) => entry.id === currentTournament.id,
    );
    if (!tournamentRow) return null;
    const tournamentMatches = decoratedMatches.filter(
      (match) => match.tournament_id === currentTournament.id,
    );
    const tournamentResults = results.filter(
      (entry) => entry.tournament_id === currentTournament.id,
    );
    return getFeaturedTournamentStage(
      tournamentRow,
      tournamentMatches,
      tournamentResults,
    );
  }, [currentTournament?.id, decoratedMatches, results, tournaments]);
  const bmpsStatKills = useMemo(() => {
    const playerRow = resolved.playerRow;
    if (!playerRow) return null;

    const aliasSet = new Set([
      normalizeStatPlayerKey(decodedIgn),
      normalizeStatPlayerKey(playerRow.ign),
    ]);
    for (const alias of playerAliases) {
      if (alias.player_id !== playerRow.id) continue;
      aliasSet.add(normalizeStatPlayerKey(alias.alias));
    }

    const matchingRows = BMPS_2026_QUALIFIER_PLAYER_STATS.filter((entry) =>
      aliasSet.has(normalizeStatPlayerKey(entry.player)),
    );

    if (matchingRows.length === 0) return null;

    if (matchingRows.length === 1) {
      return matchingRows[0].finishes;
    }

    const currentTeamKey = resolved.teamMeta?.key || null;
    if (!currentTeamKey) return matchingRows[0].finishes;

    const teamMatchedRow = matchingRows.find((entry) => {
      const teamName =
        BMPS_2026_PLAYER_ROW_TEAM_OVERRIDES[`${entry.rank}:${entry.player}`] ||
        BMPS_2026_PLAYER_TEAM_OVERRIDES[normalizeStatPlayerKey(entry.player)] ||
        null;
      if (!teamName) return false;
      return (
        getOrganizationMetaFromAliases(teamName, teamAliasIndex).key ===
        currentTeamKey
      );
    });

    return (teamMatchedRow || matchingRows[0]).finishes;
  }, [
    decodedIgn,
    playerAliases,
    resolved.playerRow,
    resolved.teamMeta,
    teamAliasIndex,
  ]);
  const appearanceYears = Array.from(
    resolved.relatedTournaments.reduce((grouped, entry) => {
      const year = getHistoryYear(entry.date);
      const bucket = grouped.get(year) || [];
      bucket.push(entry);
      grouped.set(year, bucket);
      return grouped;
    }, new Map()).entries(),
  )
    .toSorted((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, entries]) => ({ year, entries }));
  const resultYears = Array.from(
    resolved.playerResults.reduce((grouped, entry) => {
      const year = getHistoryYear(entry.date);
      const bucket = grouped.get(year) || [];
      bucket.push(entry);
      grouped.set(year, bucket);
      return grouped;
    }, new Map()).entries(),
  )
    .toSorted((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, entries]) => ({ year, entries }));
  const careerTeams = Array.from(
    resolved.playerHistories
      .reduce((entries, history) => {
        const historyTeam = teams.find((entry) => entry.id === history.team_id);
        if (!historyTeam) return entries;
        entries.push({
          id: history.id,
          team: historyTeam.name,
          joined: history.joined_date,
          left: history.left_date,
          role: history.role,
        });
        return entries;
      }, [])
      .toSorted(
        (a, b) =>
          new Date(b.joined || b.left || 0) -
          new Date(a.joined || a.left || 0),
      )
      .reduce((grouped, entry) => {
        grouped.set(`${entry.team}-${entry.joined || ""}-${entry.left || ""}`, entry);
        return grouped;
      }, new Map())
      .values(),
  );
  const primaryStats = [
    { icon: Shield, label: "Team tag", value: teamTag },
    {
      icon: UserCircle2,
      label: "Role",
      value: resolved.playerRow?.role || "Player",
    },
    {
      icon: Swords,
      label: "Kills",
      value: (bmpsStatKills ?? resolved.playerRow?.total_kills) || 0,
    },
    {
      icon: Trophy,
      label: "Matches",
      value:
        resolved.playerRow?.matches_played ||
        resolved.teamResultRows.length ||
        0,
    },
  ];
  const secondaryStats = [
    { label: "Region", value: "India" },
    {
      label: "Avg damage",
      value: resolved.playerRow?.avg_damage
        ? Number(resolved.playerRow.avg_damage).toFixed(0)
        : "-",
    },
    {
      label: "Latest phase",
      value:
        currentTournamentStageFocus ||
        currentTournament?.phase ||
        "Roster active",
    },
  ];


  return {
    articles,
    appearanceYears,
    bmpsStatKills,
    careerTeams,
    currentTournament,
    currentTournamentStageFocus,
    decodedIgn,
    displayIgn,
    isLoading,
    error,
    resolved,
    resultYears,
    primaryStats,
    secondaryStats,
    searchParams,
    teamLogo,
    teamLogoSurfaceTone,
    teamName,
    teamTag,
    playerPhoto,
  };
}
