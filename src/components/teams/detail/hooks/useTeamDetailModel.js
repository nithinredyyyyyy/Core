import { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { getTeamLogoSurfaceTone } from "@/lib/teamLogos";
import { buildTeamAliasIndex, normalizeOrganizationKeyWithAliases } from "@/lib/normalizedIdentity";
import { buildNormalizedTournamentResultMaps, getPrizeForOrganization, getTournamentResultForOrganization } from "@/lib/tournamentResults";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import { getOfficialParticipantEntries } from "@/lib/tournamentParticipants";
import { EMPTY_TEAM_DETAIL_PAGE_ARRAY, getDisplayedTeamLogo, getTeamStatus, isMajorTier, getHistoryYear } from "@/components/teams/detail/utils/teamDetailHelpers";

export function useTeamDetailModel({ team, participant }) {
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
