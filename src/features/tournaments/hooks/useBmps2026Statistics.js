import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  BMPS_2026_FMVP_STATS,
  BMPS_2026_IGL_STATS,
  BMPS_2026_GRAND_FINALS_PLAYER_STATS,
  BMPS_2026_LCQ_PLAYER_STATS,
  BMPS_2026_MVP_STATS,
  BMPS_2026_OVERALL_PLAYER_STATS,
  BMPS_2026_QUALIFIER_PLAYER_STATS,
  BMPS_2026_SEMI_FINALS_PLAYER_STATS,
  BMPS_2026_SURVIVAL_PLAYER_STATS,
  buildBmps2026OverallPlayerStats,
  parseBmps2026EliminatorStats,
} from "@/lib/bmps2026PlayerStats";
import { getOrganizationMeta, normalizeOrganizationName } from "@/lib/organizationIdentity";
import { sortTableRows } from "@/features/tournaments/utils/tableSort";

function parseStatisticsOverride(raw, fallback) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return fallback;
  return parseBmps2026EliminatorStats(trimmed);
}

export function useBmps2026Statistics({
  isBmps2026Detail,
  teams = [],
  players = [],
  resolvedParticipantEntries = [],
}) {
  const { data: bmps2026PlayerStatsOverride = {} } = useQuery({
    queryKey: ["bmps-2026-player-stats"],
    queryFn: () => base44.site.bmps2026PlayerStats(),
    enabled: isBmps2026Detail,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const bmps2026PlayerStats = useMemo(() => {
    const qualifier = parseStatisticsOverride(
      bmps2026PlayerStatsOverride?.qualifierRaw,
      BMPS_2026_QUALIFIER_PLAYER_STATS,
    );
    const survival = parseStatisticsOverride(
      bmps2026PlayerStatsOverride?.survivalRaw,
      BMPS_2026_SURVIVAL_PLAYER_STATS,
    );
    const semiFinals = parseStatisticsOverride(
      bmps2026PlayerStatsOverride?.semiFinalsRaw,
      BMPS_2026_SEMI_FINALS_PLAYER_STATS,
    );
    const grandFinals = parseStatisticsOverride(
      bmps2026PlayerStatsOverride?.grandFinalsRaw,
      BMPS_2026_GRAND_FINALS_PLAYER_STATS,
    );
    const lcq = parseStatisticsOverride(
      bmps2026PlayerStatsOverride?.lcqRaw,
      BMPS_2026_LCQ_PLAYER_STATS,
    );
    const overall =
      qualifier === BMPS_2026_QUALIFIER_PLAYER_STATS &&
      survival === BMPS_2026_SURVIVAL_PLAYER_STATS &&
      semiFinals === BMPS_2026_SEMI_FINALS_PLAYER_STATS &&
      lcq === BMPS_2026_LCQ_PLAYER_STATS &&
      grandFinals === BMPS_2026_GRAND_FINALS_PLAYER_STATS
        ? BMPS_2026_OVERALL_PLAYER_STATS
        : buildBmps2026OverallPlayerStats([qualifier, survival, semiFinals, lcq, grandFinals]);

    return { qualifier, survival, semiFinals, grandFinals, lcq, overall };
  }, [bmps2026PlayerStatsOverride]);

  const statisticsCategories = useMemo(() => {
    const categories = [];
    if (
      bmps2026PlayerStats.qualifier.length > 0 ||
      bmps2026PlayerStats.survival.length > 0 ||
      bmps2026PlayerStats.semiFinals.length > 0 ||
      bmps2026PlayerStats.lcq.length > 0 ||
      bmps2026PlayerStats.grandFinals.length > 0
    ) {
      categories.push({ key: "eliminator", label: "Eliminator" });
    }
    if (BMPS_2026_IGL_STATS.length > 0) {
      categories.push({ key: "igl", label: "IGL" });
    }
    if (BMPS_2026_MVP_STATS.length > 0) {
      categories.push({ key: "mvp", label: "MVP" });
    }
    if (BMPS_2026_FMVP_STATS.length > 0) {
      categories.push({ key: "fmvp", label: "FMVP" });
    }
    return categories;
  }, [bmps2026PlayerStats]);

  const eliminatorSubStages = useMemo(() => {
    const subStages = [];
    if (bmps2026PlayerStats.overall.length > 0) {
      subStages.push({ key: "overall", label: "Overall" });
    }
    if (bmps2026PlayerStats.qualifier.length > 0) {
      subStages.push({ key: "qualifier stage", label: "Qualifier Stage" });
    }
    if (bmps2026PlayerStats.survival.length > 0) {
      subStages.push({ key: "survival stage", label: "Survival Stage" });
    }
    if (bmps2026PlayerStats.semiFinals.length > 0) {
      subStages.push({ key: "semi finals", label: "Semi Finals" });
    }
    if (bmps2026PlayerStats.lcq.length > 0) {
      subStages.push({ key: "last chance stage", label: "Last Chance" });
    }
    if (bmps2026PlayerStats.grandFinals.length > 0) {
      subStages.push({ key: "grand finals", label: "Grand Finals" });
    }
    return subStages;
  }, [bmps2026PlayerStats]);

  const hasBmps2026Statistics =
    isBmps2026Detail &&
    (bmps2026PlayerStats.qualifier.length > 0 ||
      bmps2026PlayerStats.survival.length > 0 ||
      bmps2026PlayerStats.semiFinals.length > 0 ||
      bmps2026PlayerStats.lcq.length > 0 ||
      bmps2026PlayerStats.grandFinals.length > 0);
  const bmps2026StatisticsRowCount =
    bmps2026PlayerStats.qualifier.length +
    bmps2026PlayerStats.survival.length +
    bmps2026PlayerStats.semiFinals.length +
    bmps2026PlayerStats.lcq.length +
    bmps2026PlayerStats.grandFinals.length;

  const bmps2026PlayerTeams = useMemo(() => {
    const teamNameById = new Map(teams.map((team) => [team.id, team.name]));
    const teamCandidatesByPlayer = new Map();

    const registerPlayerTeam = (playerName, teamName) => {
      const normalizedPlayer = normalizeOrganizationName(playerName);
      const canonicalTeamName = getOrganizationMeta(teamName).name;
      const normalizedTeam = normalizeOrganizationName(canonicalTeamName);
      if (!normalizedPlayer || !normalizedTeam) return;
      const current = teamCandidatesByPlayer.get(normalizedPlayer) || new Set();
      current.add(canonicalTeamName);
      teamCandidatesByPlayer.set(normalizedPlayer, current);
    };

    resolvedParticipantEntries.forEach((entry) => {
      const teamName = entry?.team;
      if (!teamName) return;

      (entry.players || []).forEach((playerName) => registerPlayerTeam(playerName, teamName));
      (entry.roster || []).forEach((playerEntry) => {
        const playerName = typeof playerEntry === "string" ? playerEntry : playerEntry?.name;
        registerPlayerTeam(playerName, teamName);
      });
    });

    players.forEach((player) => {
      const teamName = teamNameById.get(player.team_id);
      if (!teamName) return;
      registerPlayerTeam(player.ign, teamName);
    });

    const resolvedPlayerTeams = new Map();
    for (const [playerKey, teamNames] of teamCandidatesByPlayer.entries()) {
      resolvedPlayerTeams.set(playerKey, teamNames.size === 1 ? [...teamNames][0] : null);
    }
    return resolvedPlayerTeams;
  }, [players, resolvedParticipantEntries, teams]);

  return {
    bmps2026PlayerStats,
    statisticsCategories,
    eliminatorSubStages,
    hasBmps2026Statistics,
    bmps2026StatisticsRowCount,
    bmps2026PlayerTeams,
  };
}

export function useStatisticsRows({
  statisticsCategories,
  eliminatorSubStages,
  selectedStatisticsCategory,
  selectedStatisticsSubStage,
  tableSort,
  bmps2026PlayerStats,
  bmps2026PlayerTeams,
}) {
  const currentStatisticsCategory = statisticsCategories.some(
    (category) => category.key === selectedStatisticsCategory,
  )
    ? selectedStatisticsCategory
    : (statisticsCategories[0]?.key ?? "eliminator");
  const currentStatisticsSubStage =
    currentStatisticsCategory === "eliminator" &&
    eliminatorSubStages.some((subStage) => subStage.key === selectedStatisticsSubStage)
      ? selectedStatisticsSubStage
      : (eliminatorSubStages[0]?.key ?? "overall");

  const statisticsTableRows = useMemo(() => {
    if (currentStatisticsCategory !== "eliminator") return [];
    if (currentStatisticsSubStage === "overall") {
      return bmps2026PlayerStats.overall;
    }
    if (currentStatisticsSubStage === "survival stage") {
      return bmps2026PlayerStats.survival;
    }
    if (currentStatisticsSubStage === "semi finals") {
      return bmps2026PlayerStats.semiFinals;
    }
    if (currentStatisticsSubStage === "last chance stage") {
      return bmps2026PlayerStats.lcq;
    }
    if (currentStatisticsSubStage === "grand finals") {
      return bmps2026PlayerStats.grandFinals;
    }
    if (currentStatisticsSubStage !== "qualifier stage") return [];
    return bmps2026PlayerStats.qualifier;
  }, [bmps2026PlayerStats, currentStatisticsCategory, currentStatisticsSubStage]);
  const statisticsTableKey = `bmps-2026-statistics:${currentStatisticsCategory}:${currentStatisticsSubStage}`;
  const sortedStatisticsTableRows = useMemo(
    () =>
      sortTableRows(statisticsTableRows, tableSort, statisticsTableKey, (entry, field) => {
        switch (field) {
          case "rank":
            return entry.rank;
          case "player":
            return entry.player;
          case "matches":
            return entry.matches;
          case "finishes":
            return entry.finishes;
          case "fpm":
            return entry.fpm;
          case "contribution":
            return entry.contribution;
          case "best":
            return entry.best;
          case "fivePlus":
            return entry.fivePlusFinishes;
          case "erangel":
            return entry.erangel;
          case "miramar":
            return entry.miramar;
          case "rondo":
            return entry.rondo;
          default:
            return "";
        }
      }),
    [statisticsTableKey, statisticsTableRows, tableSort],
  );
  const statisticsPanelTitle = useMemo(() => {
    if (currentStatisticsCategory === "eliminator") return "ELIMINATOR";
    if (currentStatisticsCategory === "igl") return "IGL";
    if (currentStatisticsCategory === "mvp") return "MVP";
    if (currentStatisticsCategory === "fmvp") return "FMVP";
    return "STATISTICS";
  }, [currentStatisticsCategory]);
  const selectedMvpStats =
    currentStatisticsCategory === "fmvp" ? BMPS_2026_FMVP_STATS : BMPS_2026_MVP_STATS;

  return {
    currentStatisticsCategory,
    currentStatisticsSubStage,
    statisticsTableRows,
    statisticsTableKey,
    sortedStatisticsTableRows,
    statisticsPanelTitle,
    selectedMvpStats,
    bmps2026PlayerTeams,
  };
}
