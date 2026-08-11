import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { getTeamLogoByName, getTeamLogoSurfaceTone } from "@/lib/teamLogos";
import { format } from "date-fns";
import { isOrganizationInactive } from "@/lib/organizationIdentity";
import {
  buildTeamAliasIndex,
  normalizeOrganizationKeyWithAliases,
} from "@/lib/normalizedIdentity";
import LogoBlock from "@/components/shared/LogoBlock";
import ProfilePanel from "@/components/shared/ProfilePanel";
import ProfileStatGrid from "@/components/shared/ProfileStatGrid";
import ResultsByYearTable from "@/components/shared/ResultsByYearTable";
import {
  buildNormalizedTournamentResultMaps,
  getPrizeForOrganization,
  getTournamentResultForOrganization,
} from "@/lib/tournamentResults";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import { getPlayerDisplayName } from "@/lib/playerDisplayName";
import { getOfficialParticipantEntries } from "@/lib/tournamentParticipants";

const EMPTY_TEAM_DETAIL_PAGE_ARRAY = [];

function getDisplayedTeamLogo(team) {
  return getTeamLogoByName(team?.name) || team?.logo_url || null;
}

function getTeamStatus(team) {
  if (isOrganizationInactive(team)) {
    return {
      label: "Inactive",
      className: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    };
  }

  return {
    label: "Active",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  };
}

function isMajorTier(tier) {
  return ["S-Tier", "A-Tier", "B-Tier"].includes(String(tier || "").trim());
}

function getHistoryYear(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Undated";
  return String(date.getFullYear());
}

function formatTeamDetailDate(value, pattern, fallback) {
  if (!value) return fallback;
  return format(new Date(value), pattern);
}

function TeamDetailHero({
  team,
  participant,
  status,
  displayLogo,
  displayLogoSurfaceTone,
  primaryStats,
  secondaryStats,
}) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-brand-gold-olive bg-[radial-gradient(circle_at_top_left,_rgba(184,140,40,0.24),_rgba(18,15,11,0.98)_50%,_rgba(10,10,12,1)_100%)]">
      <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.28em] text-brand-gold">
                BGIS 2026 participant
              </p>
              <h1 className="text-3xl font-heading font-semibold text-white">
                {team.name}
              </h1>
              <p className="text-sm text-brand-border-stone">
                {participant?.seed || "Qualifier"} |{" "}
                {participant?.phase || "Participant"} | #
                {participant?.placement || "-"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${status.className}`}
              >
                {status.label}
              </span>
            </div>
          </div>

          <ProfileStatGrid
            primary={primaryStats}
            secondary={secondaryStats}
            variant="dark"
          />
        </div>

        <div className="flex items-center justify-center">
          {displayLogo ? (
            <LogoBlock
              src={displayLogo}
              alt={team.name}
              sizeClass="size-56"
              roundedClass="rounded-[30px]"
              paddingClass="p-7"
              surfaceTone={displayLogoSurfaceTone}
              className="border-brand-gold-earth bg-[linear-gradient(180deg,_rgba(24,20,15,0.95),_rgba(12,11,10,1))] shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
            />
          ) : (
            <LogoBlock
              sizeClass="size-56"
              roundedClass="rounded-[30px]"
              paddingClass="p-7"
              className="border-brand-gold-earth bg-[linear-gradient(180deg,_rgba(24,20,15,0.95),_rgba(12,11,10,1))]"
            >
              <span className="font-heading text-6xl font-bold text-brand-gold">
                {team.tag?.slice(0, 3)}
              </span>
            </LogoBlock>
          )}
        </div>
      </div>
    </div>
  );
}

function TeamDetailMainColumn({ participant, team, achievementHistory, achievementYears }) {
  return (
    <div className="space-y-4">
      <ProfilePanel
        title="BGIS 2026 Roster"
        panelClassName="rounded-xl border border-border bg-card"
        titleClassName="font-heading text-sm font-bold uppercase tracking-wider p-5 border-b border-border"
      >
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {(participant?.roster || []).map((player) => (
            <Link
              key={player.name}
              to={`/players/${encodeURIComponent(player.name)}?team=${encodeURIComponent(team.name)}`}
              className="block rounded-xl border border-border bg-secondary/20 p-4 transition-colors hover:border-primary/30"
            >
              <p className="font-semibold text-foreground">
                {getPlayerDisplayName(player.name)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {player.country}
              </p>
              {player.captain ? (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                  <Star className="size-3" /> Captain
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </ProfilePanel>

      <ProfilePanel
        title="Achievements"
        panelClassName="rounded-xl border border-border bg-card"
        titleClassName="font-heading text-sm font-bold uppercase tracking-wider p-5 border-b border-border"
      >
        {achievementHistory.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No S/A/B-Tier result rows are available for this organization yet.
          </p>
        ) : (
          <ResultsByYearTable
            buckets={achievementYears}
            title="Results by Year"
            wrapperClassName="space-y-5 border-t border-border p-5"
            headingClassName="text-[11px] font-bold uppercase tracking-[0.18em] text-primary"
            yearClassName="text-[11px] font-bold uppercase tracking-[0.18em] text-primary"
            tableClassName="w-full text-sm"
            headerRowClassName="border-b border-border bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground"
            cellClassName="p-4 text-left"
            bodyRowClassName="border-b border-border last:border-b-0"
            hoverRowClassName="hover:bg-secondary/20 transition-colors"
          />
        )}
      </ProfilePanel>
    </div>
  );
}

function TeamDetailSideColumn({
  team,
  activeYearsLabel,
  organizationAliases,
  recentMatches,
  relatedArticles,
}) {
  return (
    <div className="space-y-4">
      <ProfilePanel
        title="Organization Profile"
        panelClassName="rounded-xl border border-border bg-card"
        titleClassName="font-heading text-sm font-bold uppercase tracking-wider p-5 border-b border-border"
      >
        <div className="grid gap-4 p-5 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="text-[10px] uppercase tracking-wider text-primary">
              Short Tag
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {team.tag || "---"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="text-[10px] uppercase tracking-wider text-primary">
              Active Years
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {activeYearsLabel}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <p className="text-[10px] uppercase tracking-wider text-primary">
              Known Aliases
            </p>
            <p className="mt-2 text-sm text-foreground">
              {organizationAliases.slice(0, 3).join(" / ") || "No aliases mapped"}
            </p>
          </div>
        </div>
      </ProfilePanel>

      <ProfilePanel
        title="Recent Matches"
        panelClassName="rounded-xl border border-border bg-card"
        titleClassName="font-heading text-sm font-bold uppercase tracking-wider p-5 border-b border-border"
      >
        {recentMatches.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            No recent match records are attached to this team yet.
          </p>
        ) : (
          <div className="space-y-3 p-5">
            {recentMatches.map((match) => (
              <div
                key={match.id}
                className="rounded-xl border border-border bg-secondary/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{match.stage}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Match #{match.match_number || "-"} | {match.map || "Map TBA"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-primary">
                      {match.status}
                    </p>
                    <p
                      className="mt-1 text-xs text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {formatTeamDetailDate(
                        match.scheduled_time,
                        "MMM d, h:mm a",
                        "TBA",
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ProfilePanel>

      {relatedArticles.length > 0 ? (
        <ProfilePanel
          title="Related Coverage"
          panelClassName="rounded-xl border border-border bg-card"
          titleClassName="font-heading text-sm font-bold uppercase tracking-wider p-5 border-b border-border"
        >
          <div className="space-y-3 p-5">
            {relatedArticles.map((article) => (
              <Link
                key={article.id}
                to={`/news/${article.id}`}
                className="rounded-xl border border-border bg-secondary/20 p-4"
              >
                <p className="font-semibold text-foreground">{article.title}</p>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {article.content}
                </p>
              </Link>
            ))}
          </div>
        </ProfilePanel>
      ) : null}
    </div>
  );
}

function useTeamDetailModel({ team, participant }) {
  const { data: teamDetailPage = {} } = useQuery({
    queryKey: ["team-detail-page", "guest"],
    queryFn: () => base44.pages.teamDetail(),
  });
  const teams = teamDetailPage.teams || EMPTY_TEAM_DETAIL_PAGE_ARRAY;
  const tournaments = teamDetailPage.tournaments || EMPTY_TEAM_DETAIL_PAGE_ARRAY;
  const teamAliases = teamDetailPage.teamAliases || EMPTY_TEAM_DETAIL_PAGE_ARRAY;
  const rawResults = teamDetailPage.results || EMPTY_TEAM_DETAIL_PAGE_ARRAY;
  const results = useMemo(
    () => filterPublishedMatchResults(rawResults),
    [rawResults],
  );
  const matches = teamDetailPage.matches || EMPTY_TEAM_DETAIL_PAGE_ARRAY;
  const normalizedStages =
    teamDetailPage.normalizedStages || EMPTY_TEAM_DETAIL_PAGE_ARRAY;
  const normalizedParticipants =
    teamDetailPage.normalizedParticipants || EMPTY_TEAM_DETAIL_PAGE_ARRAY;
  const normalizedStandings =
    teamDetailPage.normalizedStandings || EMPTY_TEAM_DETAIL_PAGE_ARRAY;
  const articles = teamDetailPage.articles || EMPTY_TEAM_DETAIL_PAGE_ARRAY;

  const displayLogo = getDisplayedTeamLogo(team);
  const displayLogoSurfaceTone = getTeamLogoSurfaceTone(team?.name);
  const status = getTeamStatus(team);
  const teamAliasIndex = useMemo(
    () => buildTeamAliasIndex(teams, teamAliases),
    [teamAliases, teams],
  );
  const organizationAliases = useMemo(
    () => [
      ...new Set(
        [
          team.name,
          ...(team.aliases || []),
          ...teamAliases.flatMap((alias) =>
            (team.representativeIds || [team.id]).includes(alias.team_id) &&
            alias.alias
              ? [alias.alias]
              : [],
          ),
        ].filter(Boolean),
      ),
    ],
    [team.aliases, team.id, team.name, team.representativeIds, teamAliases],
  );
  const normalizedTeamName = normalizeOrganizationKeyWithAliases(
    team,
    teamAliasIndex,
  );
  const teamIds = useMemo(
    () => team.representativeIds || [team.id],
    [team.id, team.representativeIds],
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

  const siteTournamentNames = useMemo(
    () =>
      new Set(
        (tournaments || []).flatMap((entry) => {
          const name = String(entry?.name || "").trim();
          return name ? [name] : [];
        }),
      ),
    [tournaments],
  );

  const achievementHistory = useMemo(() => {
    return tournaments
      .reduce((items, tournament) => {
        const participantEntry = getOfficialParticipantEntries(tournament).find(
          (entry) =>
            normalizeOrganizationKeyWithAliases(entry.team, teamAliasIndex) ===
            normalizedTeamName,
        );
        const resolvedResult = getTournamentResultForOrganization({
          tournament,
          organizationName: participantEntry?.team || team.name,
          teams,
          matches,
          matchResults: results,
          fallbackParticipant: participantEntry,
          normalizedStages:
            normalizedResultMaps.stagesByTournament.get(tournament.id) || [],
          normalizedStandings:
            normalizedResultMaps.standingsByTournament.get(tournament.id) || [],
        });

        if (!participantEntry && !resolvedResult) return items;

        items.push({
          id: tournament.id,
          tournament: tournament.name,
          tier: tournament.tier || null,
          placement: resolvedResult?.placement || null,
          date:
            tournament.end_date ||
            tournament.start_date ||
            tournament.created_date,
          team: team.name,
          prize: getPrizeForOrganization(
            tournament,
            resolvedResult?.team || participantEntry?.team || team.name,
            resolvedResult?.placement,
          ),
        });
        return items;
      }, [])
      .filter((entry) => entry.placement && isMajorTier(entry.tier))
      .sort((a, b) => {
        if (a.date && b.date) return new Date(b.date) - new Date(a.date);
        return 0;
      });
  }, [
    matches,
    normalizedTeamName,
    normalizedResultMaps,
    results,
    team,
    teamAliasIndex,
    teams,
    tournaments,
  ]);

  const recentMatches = useMemo(() => {
    const teamIdSet = new Set(teamIds);
    const teamMatchIds = new Set(
      results.reduce((ids, entry) => {
        if (teamIdSet.has(entry.team_id)) ids.push(entry.match_id);
        return ids;
      }, []),
    );
    return matches
      .filter((match) => teamMatchIds.has(match.id))
      .toSorted(
        (a, b) =>
          new Date(b.scheduled_time || 0) - new Date(a.scheduled_time || 0),
      )
      .slice(0, 6);
  }, [matches, results, teamIds]);

  const relatedArticles = useMemo(() => {
    return articles
      .filter((article) => {
        const title = article.title?.toLowerCase() || "";
        const content = article.content?.toLowerCase() || "";
        return organizationAliases.some((alias) => {
          const query = `${alias} ${team.tag || ""}`.toLowerCase();
          return title.includes(alias.toLowerCase()) || content.includes(query);
        });
      })
      .slice(0, 3);
  }, [articles, organizationAliases, team.tag]);

  const bestFinish = achievementHistory.reduce((best, entry) => {
    if (!entry.placement) return best;
    const numericPlacement = parseInt(String(entry.placement), 10);
    if (Number.isNaN(numericPlacement)) return best;
    return best === null || numericPlacement < best ? numericPlacement : best;
  }, null);

  const totalPodiums = achievementHistory.filter((entry) => {
    const numericPlacement = parseInt(String(entry.placement), 10);
    return !Number.isNaN(numericPlacement) && numericPlacement <= 3;
  }).length;

  const tierTitleCounts = achievementHistory.reduce(
    (acc, entry) => {
      const numericPlacement = parseInt(String(entry.placement), 10);
      if (
        numericPlacement === 1 &&
        entry.tier !== "Qualifier" &&
        acc[entry.tier] !== undefined
      ) {
        acc[entry.tier] += 1;
      }
      return acc;
    },
    { "S-Tier": 0, "A-Tier": 0, "B-Tier": 0, "C-Tier": 0 },
  );
  const achievementYears = useMemo(() => {
    const grouped = new Map();
    for (const entry of achievementHistory) {
      const year = getHistoryYear(entry.date);
      const bucket = grouped.get(year) || [];
      bucket.push(entry);
      grouped.set(year, bucket);
    }
    return Array.from(grouped.entries())
      .toSorted((a, b) => Number(b[0]) - Number(a[0]))
      .map(([year, entries]) => ({ year, entries }));
  }, [achievementHistory]);
  const activeYearsLabel = useMemo(() => {
    const years = achievementHistory
      .flatMap((entry) => {
        const date = entry.date ? new Date(entry.date) : null;
        return date && !Number.isNaN(date.getTime())
          ? [date.getFullYear()]
          : [];
      })
      .toSorted((a, b) => a - b);
    if (!years.length) return "Current era";
    return `${years[0]}-${years[years.length - 1]}`;
  }, [achievementHistory]);
  const primaryStats = useMemo(
    () => [
      { label: "S-Tier Titles", value: tierTitleCounts["S-Tier"] },
      { label: "A-Tier Titles", value: tierTitleCounts["A-Tier"] },
      { label: "Players", value: participant?.roster?.length || 0 },
      { label: "Matches Logged", value: team.matches_played || 0 },
    ],
    [participant?.roster?.length, team.matches_played, tierTitleCounts],
  );
  const secondaryStats = useMemo(
    () => [
      {
        label: "Best Finish",
        value: bestFinish ? `#${bestFinish}` : "No finish yet",
      },
      { label: "Podiums", value: totalPodiums },
      { label: "Badges", value: participant?.badges?.join(" / ") || "None" },
    ],
    [bestFinish, participant?.badges, totalPodiums],
  );

  return {
    achievementHistory,
    achievementYears,
    activeYearsLabel,
    displayLogo,
    displayLogoSurfaceTone,
    organizationAliases,
    primaryStats,
    recentMatches,
    relatedArticles,
    secondaryStats,
    status,
  };
}

export default function TeamDetail({ team, participant, onBack }) {
  const {
    achievementHistory,
    achievementYears,
    activeYearsLabel,
    displayLogo,
    displayLogoSurfaceTone,
    organizationAliases,
    primaryStats,
    recentMatches,
    relatedArticles,
    secondaryStats,
    status,
  } = useTeamDetailModel({ team, participant });

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 size-4" /> Back to Teams
      </Button>

      <TeamDetailHero
        team={team}
        participant={participant}
        status={status}
        displayLogo={displayLogo}
        displayLogoSurfaceTone={displayLogoSurfaceTone}
        primaryStats={primaryStats}
        secondaryStats={secondaryStats}
      />

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <TeamDetailMainColumn
          participant={participant}
          team={team}
          achievementHistory={achievementHistory}
          achievementYears={achievementYears}
        />
        <TeamDetailSideColumn
          team={team}
          activeYearsLabel={activeYearsLabel}
          organizationAliases={organizationAliases}
          recentMatches={recentMatches}
          relatedArticles={relatedArticles}
        />
      </div>
    </div>
  );
}
