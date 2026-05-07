import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Shield, Swords, Trophy, UserCircle2 } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import EmptyState from "@/components/shared/EmptyState";
import LogoBlock from "@/components/shared/LogoBlock";
import ProfilePanel from "@/components/shared/ProfilePanel";
import ProfileStatGrid from "@/components/shared/ProfileStatGrid";
import ResultsByYearTable from "@/components/shared/ResultsByYearTable";
import { getTeamLogoByName } from "@/lib/teamLogos";
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

function decodeIgn(value) {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
}

function normalizeIgn(value) {
  return String(value || "").trim().toLowerCase();
}

function isMajorTier(tier) {
  return ["S-Tier", "A-Tier", "B-Tier"].includes(String(tier || "").trim());
}

function getHistoryYear(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Undated";
  return String(date.getFullYear());
}

function findParticipantTeamForPlayer(tournaments, ign) {
  const target = normalizeIgn(ign);
  for (const tournament of tournaments) {
    const participants = Array.isArray(tournament?.participants) ? tournament.participants : [];
    for (const participant of participants) {
      const players = Array.isArray(participant?.players) ? participant.players : [];
      const match = players.find(
        (player) => normalizeIgn(typeof player === "string" ? player : player?.name) === target
      );
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
  const participants = Array.isArray(tournament?.participants) ? tournament.participants : [];

  const scored = participants
    .filter(
      (participant) =>
        Array.isArray(participant?.players) &&
        participant.players.some(
          (player) =>
            normalizeIgn(typeof player === "string" ? player : player?.name) === target
        )
    )
    .map((participant) => {
      const orgMeta = getOrganizationMetaFromAliases(participant.team, teamAliasIndex);
      let score = 0;
      if (preferredTeamMeta && orgMeta.key === preferredTeamMeta.key) score += 120;
      if (historyOrgKeys.has(orgMeta.key)) score += 60;
      return { participant, score };
    })
    .sort((left, right) => right.score - left.score);

  return scored[0]?.participant || null;
}

export default function PlayerProfile() {
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
  const { data: playerAliases = [], isLoading: playerAliasesLoading } = useQuery({
    queryKey: ["player-aliases"],
    queryFn: () => base44.entities.PlayerAlias.list("-created_date", 3000),
  });
  const { data: playerTeamHistory = [], isLoading: playerTeamHistoryLoading } = useQuery({
    queryKey: ["player-team-history"],
    queryFn: () => base44.entities.PlayerTeamHistory.list("-updated_date", 4000),
  });
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ["tournaments"],
    queryFn: () => base44.entities.Tournament.list("-created_date", 100),
  });
  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: ["results"],
    queryFn: () => base44.entities.MatchResult.list("-created_date", 3000),
  });
  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("-scheduled_time", 2000),
  });
  const { data: normalizedStages = [], isLoading: normalizedStagesLoading } = useQuery({
    queryKey: ["normalized-tournament-stages"],
    queryFn: () => base44.entities.TournamentStage.list("stage_order", 1000),
  });
  const { data: normalizedParticipants = [], isLoading: normalizedParticipantsLoading } = useQuery({
    queryKey: ["normalized-tournament-participants"],
    queryFn: () => base44.entities.TournamentParticipant.list("-created_date", 2000),
  });
  const { data: normalizedStandings = [], isLoading: normalizedStandingsLoading } = useQuery({
    queryKey: ["normalized-stage-standings"],
    queryFn: () => base44.entities.StageStanding.list("rank", 5000),
  });
  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ["news"],
    queryFn: () => base44.entities.NewsArticle.list("-created_date", 80),
  });

  const isLoading =
    playersLoading || teamsLoading || teamAliasesLoading || playerAliasesLoading || playerTeamHistoryLoading || tournamentsLoading || resultsLoading || matchesLoading || articlesLoading;
  const teamAliasIndex = useMemo(
    () => buildTeamAliasIndex(teams, teamAliases),
    [teamAliases, teams]
  );
  const playerAliasIndex = useMemo(
    () => buildPlayerAliasIndex(players, playerAliases),
    [playerAliases, players]
  );
  const playerHistoryMap = useMemo(
    () => buildPlayerTeamHistoryMap(playerTeamHistory),
    [playerTeamHistory]
  );
  const normalizedResultMaps = useMemo(
    () =>
      buildNormalizedTournamentResultMaps({
        normalizedStages,
        normalizedParticipants,
        normalizedStandings,
      }),
    [normalizedParticipants, normalizedStages, normalizedStandings]
  );
  const isNormalizedLoading =
    normalizedStagesLoading || normalizedParticipantsLoading || normalizedStandingsLoading;

  const resolved = useMemo(() => {
    const siteTournamentNames = new Set(
      (tournaments || []).map((entry) => String(entry?.name || "").trim()).filter(Boolean)
    );
    const matchingPlayerRows = resolvePlayerRowsByAlias(decodedIgn, playerAliasIndex, players);
    const snapshotTeam = findParticipantTeamForPlayer(tournaments, decodedIgn);

    const preferredTeamName = queryTeam || snapshotTeam?.participant?.team || null;
    const preferredTeamMeta = preferredTeamName ? getOrganizationMetaFromAliases(preferredTeamName, teamAliasIndex) : null;

    const playerRow =
      pickBestPlayerRowForTeamContext(
        decodedIgn,
        preferredTeamName,
        playerAliasIndex,
        players,
        playerHistoryMap,
        teamAliasIndex
      ) ||
      matchingPlayerRows[0] ||
      null;

    const playerHistories = playerRow ? playerHistoryMap.get(playerRow.id) || [] : [];
    const currentHistoryTeam =
      (preferredTeamMeta
        ? playerHistories
            .map((entry) => teams.find((team) => team.id === entry.team_id))
            .find(
              (team) =>
                team &&
                getOrganizationMetaFromAliases(team, teamAliasIndex).key === preferredTeamMeta.key
            )
        : null) ||
      playerHistories
        .map((entry) => teams.find((team) => team.id === entry.team_id))
        .find(Boolean);

    const fallbackTeamName = currentHistoryTeam?.name ||
      (playerRow?.team_id
        ? teams.find((team) => team.id === playerRow.team_id)?.name
        : null) ||
      snapshotTeam?.participant?.team || queryTeam || null;

    const teamMeta = fallbackTeamName ? getOrganizationMetaFromAliases(fallbackTeamName, teamAliasIndex) : null;
    const teamRow =
      currentHistoryTeam ||
      (playerRow?.team_id
        ? teams.find((team) => team.id === playerRow.team_id) || null
        : null) ||
      (teamMeta
        ? teams.find((team) => getOrganizationMetaFromAliases(team, teamAliasIndex).key === teamMeta.key) || null
        : null);

    const historyOrgKeys = new Set(
      playerHistories
        .map((entry) => teams.find((team) => team.id === entry.team_id))
        .filter(Boolean)
        .map((team) => getOrganizationMetaFromAliases(team, teamAliasIndex).key)
        .filter(Boolean)
    );
    if (teamMeta?.key) historyOrgKeys.add(teamMeta.key);

    const relatedTournaments = tournaments
      .map((tournament) => {
        const participant = resolveTournamentParticipantForPlayer({
          tournament,
          ign: decodedIgn,
          preferredTeamMeta,
          historyOrgKeys,
          teamAliasIndex,
        });
        if (!participant) return null;
        return {
          id: tournament.id,
          name: tournament.name,
          phase: participant.phase || "Participant",
          placement: participant.placement || null,
          date: tournament.start_date || tournament.created_date,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const playerResults = tournaments
      .map((tournament) => {
        const participant = resolveTournamentParticipantForPlayer({
          tournament,
          ign: decodedIgn,
          preferredTeamMeta,
          historyOrgKeys,
          teamAliasIndex,
        });
        if (!participant) return null;
        const resolvedResult = getTournamentResultForOrganization({
          tournament,
          organizationName: participant.team,
          teams,
          matches,
          matchResults: results,
          fallbackParticipant: participant,
          normalizedStages: normalizedResultMaps.stagesByTournament.get(tournament.id) || [],
          normalizedStandings: normalizedResultMaps.standingsByTournament.get(tournament.id) || [],
        });

        return {
          id: `${tournament.id}-${participant.team}`,
          date: tournament.end_date || tournament.start_date || tournament.created_date || null,
          placement: resolvedResult?.placement || "-",
          tier: tournament.tier || "Unrated",
          tournament: tournament.name,
          team: getOrganizationMetaFromAliases(
            resolvedResult?.team || participant.team,
            teamAliasIndex
          ).name,
          prize:
            getPrizeForOrganization(
              tournament,
              resolvedResult?.team || participant.team,
              resolvedResult?.placement || participant.placement
            ) || "-",
        };
      })
      .filter((entry) => entry && isMajorTier(entry.tier))
      .filter((entry) => siteTournamentNames.has(String(entry.tournament || "").trim()))
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const relatedArticles = articles
      .filter((article) => {
        const haystack = `${article.title || ""} ${article.content || ""}`.toLowerCase();
        return (
          haystack.includes(normalizeIgn(decodedIgn)) ||
          (teamMeta?.name ? haystack.includes(teamMeta.name.toLowerCase()) : false)
        );
      })
      .slice(0, 3);

    const teamResultRows = teamRow ? results.filter((row) => row.team_id === teamRow.id) : [];

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
  }, [articles, decodedIgn, matches, playerAliasIndex, playerHistoryMap, players, queryTeam, results, teamAliasIndex, teams, tournaments]);

  const teamName =
    resolved.teamMeta?.name ||
    resolved.teamRow?.name ||
    resolved.snapshotTeam?.participant?.team ||
    searchParams.get("team") ||
    "Unassigned";
  const teamTag = resolved.teamRow?.tag || resolved.teamMeta?.tag || "---";
  const teamLogo = getTeamLogoByName(teamName) || resolved.teamRow?.logo_url || null;
  const currentTournament = resolved.relatedTournaments[0] || null;
  const appearanceYears = [...resolved.relatedTournaments.reduce((grouped, entry) => {
    const year = getHistoryYear(entry.date);
    const bucket = grouped.get(year) || [];
    bucket.push(entry);
    grouped.set(year, bucket);
    return grouped;
  }, new Map()).entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, entries]) => ({ year, entries }));
  const resultYears = [...resolved.playerResults.reduce((grouped, entry) => {
    const year = getHistoryYear(entry.date);
    const bucket = grouped.get(year) || [];
    bucket.push(entry);
    grouped.set(year, bucket);
    return grouped;
  }, new Map()).entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, entries]) => ({ year, entries }));
  const careerTeams = Array.from(
    new Map(
      resolved.playerHistories
        .map((history) => {
          const historyTeam = teams.find((entry) => entry.id === history.team_id);
          if (!historyTeam) return null;
          return {
            id: history.id,
            team: historyTeam.name,
            joined: history.joined_date,
            left: history.left_date,
            role: history.role,
          };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.joined || b.left || 0) - new Date(a.joined || a.left || 0))
        .map((entry) => [`${entry.team}-${entry.joined || ""}-${entry.left || ""}`, entry])
    ).values()
  );
  const primaryStats = [
    { icon: Shield, label: "Team tag", value: teamTag },
    { icon: UserCircle2, label: "Role", value: resolved.playerRow?.role || "Player" },
    { icon: Swords, label: "Kills", value: resolved.playerRow?.total_kills || 0 },
    {
      icon: Trophy,
      label: "Matches",
      value: resolved.playerRow?.matches_played || resolved.teamResultRows.length || 0,
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
    { label: "Latest phase", value: currentTournament?.phase || "Roster active" },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Loading player</p>
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
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to teams
      </Link>

      <div className="overflow-hidden rounded-[30px] border border-border/70 bg-card shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">Player profile</p>
              <h1 className="mt-2 text-4xl font-black uppercase tracking-[-0.05em] text-foreground">
                {decodedIgn}
              </h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Current team: <span className="font-semibold text-foreground">{teamName}</span>
                {currentTournament ? ` • Active in ${currentTournament.name}` : ""}
              </p>
            </div>

            <ProfileStatGrid primary={primaryStats} secondary={secondaryStats} variant="light" />
          </div>

          <div className="flex items-center justify-center">
            <LogoBlock
              src={teamLogo}
              alt={teamName}
              sizeClass="h-56 w-56"
              roundedClass="rounded-[30px]"
              paddingClass="p-7"
              className="border-border bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.12),rgba(255,255,255,0.98)_72%,rgba(248,243,235,0.98)_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.18),rgba(27,27,31,0.98)_72%,rgba(17,24,39,1)_100%)]"
            >
              {!teamLogo ? (
                <span className="text-5xl font-black uppercase text-primary">
                  {teamTag.slice(0, 2)}
                </span>
              ) : null}
            </LogoBlock>
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
                      <p className="font-semibold text-foreground">{entry.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {entry.phase}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">
                        {entry.placement ? `#${entry.placement}` : "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {entry.date ? format(new Date(entry.date), "MMM d, yyyy") : "Date pending"}
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
                sizeClass="h-14 w-14"
                roundedClass="rounded-2xl"
                paddingClass="p-2.5"
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
                  <div key={entry.id} className="rounded-[18px] border border-border bg-background/75 p-4">
                    <p className="font-semibold text-foreground">{entry.team}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {entry.role || "Player"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {entry.joined ? format(new Date(entry.joined), "MMM yyyy") : "Start unknown"}
                      {" · "}
                      {entry.left ? format(new Date(entry.left), "MMM yyyy") : "Present"}
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
                    <p className="text-sm font-semibold text-foreground">{article.title}</p>
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
            cellClassName="px-3 py-3"
            bodyRowClassName="border-b border-border/70 last:border-b-0"
          />
        )}
      </ProfilePanel>
    </div>
  );
}
