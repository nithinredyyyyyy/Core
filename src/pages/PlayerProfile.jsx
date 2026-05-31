import React, { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Shield, ShieldCheck, Swords, Trophy, UserCircle2 } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import EmptyState from "@/components/shared/EmptyState";
import LogoBlock from "@/components/shared/LogoBlock";
import ProfilePanel from "@/components/shared/ProfilePanel";
import ProfileStatGrid from "@/components/shared/ProfileStatGrid";
import ResultsByYearTable from "@/components/shared/ResultsByYearTable";
import { getTeamLogoByName, getTeamLogoSurfaceTone } from "@/lib/teamLogos";
import { decorateMatchesWithLiveStatus } from "@/lib/liveCalendar";
import {
  buildPlayerAliasIndex,
  buildPlayerTeamHistoryMap,
  buildTeamAliasIndex,
  getOrganizationMetaFromAliases,
  pickBestPlayerRowForTeamContext,
  resolvePlayerRowsByAlias,
} from "@/lib/normalizedIdentity";
import {
  buildNormalizedTournamentResultMaps,
  getPrizeForOrganization,
  getTournamentResultForOrganization,
} from "@/lib/tournamentResults";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import {
  BMPS_2026_PLAYER_ROW_TEAM_OVERRIDES,
  BMPS_2026_PLAYER_TEAM_OVERRIDES,
  BMPS_2026_QUALIFIER_PLAYER_STATS,
} from "@/lib/bmps2026PlayerStats";
import { getPlayerPhotoByIgn } from "@/lib/playerPhotos";
import { getPlayerDisplayName } from "@/lib/playerDisplayName";
import { getFeaturedTournamentStage } from "@/lib/stageBoard";
import { useToast } from "@/components/ui/use-toast";

function decodeIgn(value) {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
}

function normalizeIgn(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeStatPlayerKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isMajorTier(tier) {
  return ["S-Tier", "A-Tier", "B-Tier"].includes(String(tier || "").trim());
}

function getHistoryYear(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Undated";
  return String(date.getFullYear());
}

function formatProfileDate(value, pattern, fallback) {
  if (!value) return fallback;
  return format(new Date(value), pattern);
}

function findParticipantTeamForPlayer(tournaments, ign) {
  const target = normalizeIgn(ign);
  for (const tournament of tournaments) {
    const participants = Array.isArray(tournament?.participants)
      ? tournament.participants
      : [];
    for (const participant of participants) {
      const players = Array.isArray(participant?.players)
        ? participant.players
        : [];
      let match = null;
      for (const player of players) {
        if (
          normalizeIgn(typeof player === "string" ? player : player?.name) ===
          target
        ) {
          match = player;
          break;
        }
      }
      if (match) {
        return {
          tournament,
          participant,
          snapshot: typeof match === "string" ? { name: match } : match,
        };
      }
    }
  }
  return null;
}

function resolveTournamentParticipantForPlayer({
  tournament,
  ign,
  preferredTeamMeta,
  historyOrgKeys = new Set(),
  teamAliasIndex,
}) {
  const target = normalizeIgn(ign);
  const participants = Array.isArray(tournament?.participants)
    ? tournament.participants
    : [];

  let bestParticipant = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const participant of participants) {
    if (
      !Array.isArray(participant?.players) ||
      !participant.players.some(
        (player) =>
          normalizeIgn(typeof player === "string" ? player : player?.name) ===
          target,
      )
    ) {
      continue;
    }

    const orgMeta = getOrganizationMetaFromAliases(
      participant.team,
      teamAliasIndex,
    );
    let score = 0;
    if (preferredTeamMeta && orgMeta.key === preferredTeamMeta.key) score += 120;
    if (historyOrgKeys.has(orgMeta.key)) score += 60;

    if (score > bestScore) {
      bestParticipant = participant;
      bestScore = score;
    }
  }

  return bestParticipant;
}

function usePlayerProfileData() {
  const { playerIgn } = useParams();
  const [searchParams] = useSearchParams();
  const decodedIgn = decodeIgn(playerIgn);
  const queryTeam = searchParams.get("team");

  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list("-created_date", 800),
  });
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list("-total_points", 400),
  });
  const { data: teamAliases = [], isLoading: teamAliasesLoading } = useQuery({
    queryKey: ["team-aliases"],
    queryFn: () => base44.entities.TeamAlias.list("-created_date", 2000),
  });
  const { data: playerAliases = [], isLoading: playerAliasesLoading } =
    useQuery({
      queryKey: ["player-aliases"],
      queryFn: () => base44.entities.PlayerAlias.list("-created_date", 3000),
    });
  const { data: playerTeamHistory = [], isLoading: playerTeamHistoryLoading } =
    useQuery({
      queryKey: ["player-team-history"],
      queryFn: () =>
        base44.entities.PlayerTeamHistory.list("-updated_date", 4000),
    });
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 100),
  });
  const { data: rawResults = [], isLoading: resultsLoading } = useQuery({
    queryKey: ["results"],
    queryFn: () => base44.entities.MatchResult.list("-created_date", 3000),
  });
  const results = useMemo(
    () => filterPublishedMatchResults(rawResults),
    [rawResults],
  );
  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("-scheduled_time", 2000),
  });
  const { data: normalizedStages = [], isLoading: normalizedStagesLoading } =
    useQuery({
      queryKey: ["normalized-tournament-stages"],
      queryFn: () => base44.entities.TournamentStage.list("stage_order", 1000),
    });
  const {
    data: normalizedParticipants = [],
    isLoading: normalizedParticipantsLoading,
  } = useQuery({
    queryKey: ["normalized-tournament-participants"],
    queryFn: () =>
      base44.entities.TournamentParticipant.list("-created_date", 2000),
  });
  const {
    data: normalizedStandings = [],
    isLoading: normalizedStandingsLoading,
  } = useQuery({
    queryKey: ["normalized-stage-standings"],
    queryFn: () => base44.entities.StageStanding.list("rank", 5000),
  });
  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ["news"],
    queryFn: () => base44.news.listPublished("-created_date", 80),
  });

  const isLoading =
    playersLoading ||
    teamsLoading ||
    teamAliasesLoading ||
    playerAliasesLoading ||
    playerTeamHistoryLoading ||
    tournamentsLoading ||
    resultsLoading ||
    matchesLoading ||
    articlesLoading;
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
  const isNormalizedLoading =
    normalizedStagesLoading ||
    normalizedParticipantsLoading ||
    normalizedStandingsLoading;
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

export default function PlayerProfile() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const fanSession = base44.fan.getStoredSession();
  const {
    currentTournament,
    currentTournamentStageFocus,
    displayIgn,
    isLoading,
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
  } = usePlayerProfileData();
  const { data: follows = [] } = useQuery({
    queryKey: ["player-detail-follows", fanSession.userId],
    queryFn: () =>
      base44.entities.FanFollowItem.filter(
        { user_id: fanSession.userId },
        "-created_date",
        80,
      ),
    enabled: Boolean(fanSession.userId),
  });

  const playerFollowRecord = follows.find(
    (entry) =>
      entry.target_type === "player" &&
      (entry.target_id === resolved.playerRow?.id ||
        entry.target_label === displayIgn),
  );

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!fanSession.userId) throw new Error("Open your profile first.");
      if (playerFollowRecord?.id) {
        return base44.entities.FanFollowItem.delete(playerFollowRecord.id);
      }
      return base44.entities.FanFollowItem.create({
        user_id: fanSession.userId,
        display_name: fanSession.displayName,
        target_type: "player",
        target_id: resolved.playerRow?.id || "",
        target_label: displayIgn,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["player-detail-follows", fanSession.userId],
      });
      qc.invalidateQueries({ queryKey: ["profile-follows", fanSession.userId] });
      toast({
        title: playerFollowRecord ? "Player unfollowed" : "Player followed",
        description: playerFollowRecord
          ? `${displayIgn} was removed from your followed players.`
          : `${displayIgn} is now pinned to your followed players.`,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
          Loading player
        </p>
      </div>
    );
  }

  if (!resolved.playerRow && !resolved.snapshotTeam) {
    return (
      <EmptyState
        icon={UserCircle2}
        title="Player not found"
        description="This player profile is not available in the current tournament and roster data."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to={teamName ? `/teams?team=${encodeURIComponent(teamName)}` : "/teams"}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to teams
      </Link>

      <div className="overflow-hidden rounded-[30px] border border-border/70 bg-card shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
                Player profile
              </p>
              <h1 className="mt-2 text-4xl font-semibold uppercase tracking-[-0.05em] text-foreground">
                {displayIgn}
              </h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Current team:{" "}
                <span className="font-semibold text-foreground">
                  {teamName}
                </span>
                {currentTournament
                  ? ` • Active in ${currentTournament.name}`
                  : ""}
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => followMutation.mutate()}
                  disabled={!fanSession.userId || followMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShieldCheck className="size-3.5" />
                  {playerFollowRecord ? "Following player" : "Follow player"}
                </button>
              </div>
            </div>

            <ProfileStatGrid
              primary={primaryStats}
              secondary={secondaryStats}
              variant="light"
            />
          </div>

          <div className="flex items-center justify-center">
            {playerPhoto ? (
              <div className="relative flex h-[26rem] w-full max-w-[24rem] items-end justify-center overflow-hidden rounded-[30px] border border-border bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.14),rgba(255,255,255,0.98)_52%,rgba(248,243,235,0.98)_100%)] shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.18),rgba(27,27,31,0.98)_58%,rgba(17,24,39,1)_100%)]">
                <img
                  src={playerPhoto}
                  alt={displayIgn}
                  className="size-full object-contain object-bottom"
                />
              </div>
            ) : (
              <LogoBlock
                src={teamLogo}
                alt={teamName}
                sizeClass="size-56"
                roundedClass="rounded-[30px]"
                paddingClass="p-7"
                surfaceTone={teamLogoSurfaceTone}
                className="border-border bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.12),rgba(255,255,255,0.98)_72%,rgba(248,243,235,0.98)_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.18),rgba(27,27,31,0.98)_72%,rgba(17,24,39,1)_100%)]"
              >
                {!teamLogo ? (
                  <span className="text-5xl font-black uppercase text-primary">
                    {teamTag.slice(0, 2)}
                  </span>
                ) : null}
              </LogoBlock>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ProfilePanel title="Tournament appearances">
          {resolved.relatedTournaments.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No tournament appearances have been mapped for this player yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {resolved.relatedTournaments.map((entry) => (
                <Link
                  key={`${entry.id}-${entry.phase}`}
                  to={`/tournaments?id=${entry.id}`}
                  className="block rounded-[18px] border border-border bg-background/75 p-4 transition-colors hover:border-primary/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {entry.name}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {entry.phase}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {entry.placement ? `#${entry.placement}` : "—"}
                      </p>
                      <p
                        className="mt-1 text-xs text-muted-foreground"
                        suppressHydrationWarning
                      >
                        {formatProfileDate(
                          entry.date,
                          "MMM d, yyyy",
                          "Date pending",
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ProfilePanel>

        <div className="space-y-4">
          <ProfilePanel title="Current team">
            <Link
              to={`/teams?team=${encodeURIComponent(teamName)}`}
              className="mt-4 flex items-center gap-3 rounded-[18px] border border-border bg-background/75 p-4 transition-colors hover:border-primary/30"
            >
              <LogoBlock
                src={teamLogo}
                alt={teamName}
                sizeClass="size-14"
                roundedClass="rounded-2xl"
                paddingClass="p-2.5"
                surfaceTone={teamLogoSurfaceTone}
                className="bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.14),rgba(255,255,255,0.98)_72%,rgba(248,243,235,0.98)_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.18),rgba(27,27,31,0.98)_72%,rgba(17,24,39,1)_100%)]"
              />
              <div>
                <p className="font-semibold text-foreground">{teamName}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {teamTag}
                </p>
              </div>
            </Link>
          </ProfilePanel>

          <ProfilePanel title="Career path">
            {careerTeams.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No mapped team history is available for this player yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {careerTeams.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[18px] border border-border bg-background/75 p-4"
                  >
                    <p className="font-semibold text-foreground">
                      {entry.team}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {entry.role || "Player"}
                    </p>
                    <p
                      className="mt-2 text-xs text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {formatProfileDate(
                        entry.joined,
                        "MMM yyyy",
                        "Start unknown",
                      )}
                      {" · "}
                      {formatProfileDate(entry.left, "MMM yyyy", "Present")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ProfilePanel>

          <ProfilePanel title="Related stories">
            {resolved.relatedArticles.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No linked stories have been found for this player yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {resolved.relatedArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/news/${article.id}`}
                    className="block rounded-[18px] border border-border bg-background/75 p-4 transition-colors hover:border-primary/30"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {article.title}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {article.category?.replace(/_/g, " ") || "Story"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </ProfilePanel>
        </div>
      </div>

      <ProfilePanel title="Individual results">
        {resolved.playerResults.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No S/A/B-Tier result rows have been mapped for this player yet.
          </p>
        ) : (
          <ResultsByYearTable
            buckets={resultYears}
            title="Results by Year"
            wrapperClassName="mt-6 space-y-5 border-t border-border pt-5"
            headingClassName="text-[11px] font-bold uppercase tracking-[0.24em] text-primary"
            yearClassName="text-[11px] font-bold uppercase tracking-[0.18em] text-primary"
            tableClassName="w-full min-w-[760px] text-sm"
            headerRowClassName="border-b border-border text-left text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
            cellClassName="p-3"
            bodyRowClassName="border-b border-border/70 last:border-b-0"
          />
        )}
      </ProfilePanel>
    </div>
  );
}
