import { useMemo, useReducer } from "react";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import { compareStageBoardStandings, getFeaturedTournamentStage } from "@/lib/stageBoard";
import { isBmps2026PromotionStage } from "@/lib/bmps2026Progression";
import { createStageBoardUiState, stageBoardUiReducer } from "@/features/tournaments/hooks/stageBoardUiReducer";
import { EMPTY_STAGE_MATCH_RESULTS, EMPTY_STAGE_MATCHES, EMPTY_STAGE_PARTICIPANT_ENTRIES, EMPTY_STAGE_PLAYERS, EMPTY_STAGE_RANKINGS, EMPTY_STAGE_TEAMS } from "@/features/tournaments/constants";
import { getBmps2026PreviousStageName } from "@/features/tournaments/utils/stageHelpers";
import { dedupeParticipantEntriesByOrganization, getBmps2026FallbackGroupForTeam, getBmps2026GroupDrawEntries, getGroupMovementAccent, getGroupMovementRule, getOutcomeTone, getParticipantEntryPhases, getParticipantStageGroup, getStrictParticipantStageGroup, isBmps2026KnockoutStage, isBmps2026SemiFinalsStage, isBmps2026SurvivalStage } from "@/features/tournaments/utils/participantHelpers";
import { useBmps2026Statistics, useStatisticsRows } from "@/features/tournaments/hooks/useBmps2026Statistics";

export function useStageStandingsModel({
  stages,
  participantEntries = EMPTY_STAGE_PARTICIPANT_ENTRIES,
  tournamentName,
  tournamentId,
  teams = EMPTY_STAGE_TEAMS,
  players = EMPTY_STAGE_PLAYERS,
  matches = EMPTY_STAGE_MATCHES,
  matchResults = EMPTY_STAGE_MATCH_RESULTS,
  requestedStage = "",
  rankings = EMPTY_STAGE_RANKINGS,
}) {
  const isBmps2026Detail =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026";
  const resolvedParticipantEntries = useMemo(() => {
    return participantEntries;
  }, [participantEntries]);

  const {
    bmps2026PlayerStats,
    statisticsCategories,
    eliminatorSubStages,
    hasBmps2026Statistics,
    bmps2026StatisticsRowCount,
    bmps2026PlayerTeams,
  } = useBmps2026Statistics({
    isBmps2026Detail,
    teams,
    players,
    resolvedParticipantEntries,
  });

  const stageOptions = useMemo(
    () => {
      const options = stages.reduce((acc, stage) => {
        const stageHasParticipants = resolvedParticipantEntries.some((entry) =>
          getParticipantEntryPhases(entry).some(
            (phase) =>
              phase.toLowerCase() === String(stage.name || "").trim().toLowerCase() ||
              phase.toLowerCase().startsWith(`${String(stage.name || "").trim().toLowerCase()} - group `)
          )
        );
        const stageHasMatches = (tournamentName?.startsWith("PUBG Mobile World Cup") || tournamentName === "Battlegrounds Mobile India Pro Series 2026") && matches.some(
          (m) => m.tournament_id === tournamentId && m.stage === stage.name,
        );
        if (!stage.name || !(stage.standings?.length || stage.summary || stage.teamCount || stageHasParticipants || stageHasMatches)) {
          return acc;
        }

        acc.push({
          ...stage,
          standings: (stage.standings || []).toSorted(
            (a, b) => (a.placement ?? 999) - (b.placement ?? 999),
          ),
        });
        return acc;
      }, []);

      if (hasBmps2026Statistics) {
        options.push({
          name: "Statistics",
          summary: "Player statistics for BMPS 2026.",
          teamCount: bmps2026StatisticsRowCount,
          standings: [],
          isStatistics: true,
          statisticsType: "bmps-players",
        });
      } else if (rankings.length > 0) {
        options.push({
          name: "Statistics",
          summary: "Player and team rankings for this tournament.",
          teamCount: rankings.length,
          standings: [],
          isStatistics: true,
          statisticsType: "rankings",
        });
      }

      return options;
    },
    [bmps2026StatisticsRowCount, hasBmps2026Statistics, rankings.length, resolvedParticipantEntries, stages, matches, tournamentId, tournamentName]
  );
  const stageOptionsKey = useMemo(
    () => stageOptions.map((stage) => `${stage.name}:${stage.standings?.length || 0}`).join("|"),
    [stageOptions]
  );
  const defaultStageName = useMemo(() => {
    if (requestedStage && stageOptions.some((stage) => stage.name === requestedStage)) {
      return requestedStage;
    }
    const tournamentMatches = matches.filter((match) => match.tournament_id === tournamentId);
    const tournamentResults = matchResults.filter((result) => result.tournament_id === tournamentId);
    const featuredStageName = getFeaturedTournamentStage(
      { id: tournamentId, stages: stageOptions },
      tournamentMatches,
      tournamentResults
    );

    if (featuredStageName && stageOptions.some((stage) => stage.name === featuredStageName)) {
      return featuredStageName;
    }

    return stageOptions[0]?.name || "";
  }, [matchResults, matches, requestedStage, stageOptions, tournamentId]);
  const [stageBoardUi, dispatchStageBoardUi] = useReducer(
    stageBoardUiReducer,
    defaultStageName,
    createStageBoardUiState,
  );
  const {
    selectedStage,
    selectedGroup,
    selectedStatisticsCategory,
    selectedStatisticsSubStage,
    tableSort,
  } = stageBoardUi;
  const currentSelectedStage = stageOptions.some((stage) => stage.name === selectedStage)
    ? selectedStage
    : defaultStageName;
  const activeStage = stageOptions.find((stage) => stage.name === currentSelectedStage) || stageOptions[0] || null;
  const isStatisticsStage = Boolean(activeStage?.isStatistics);
  const isRankingsStatisticsStage = activeStage?.statisticsType === "rankings";
  const isGrandFinalsStage = String(activeStage?.name || "").trim().toLowerCase() === "grand finals";
  const groups = useMemo(() => {
    if (!activeStage) return [];
    const activeStageKey = String(activeStage.name || "").trim().toLowerCase();
    if (activeStageKey === "grand finals") return [];
    if (
      tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
      activeStageKey === "last chance stage"
    ) {
      return [];
    }
    if (
      tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
      (isBmps2026SurvivalStage(activeStage.name) ||
        isBmps2026SemiFinalsStage(activeStage.name))
    ) {
      const participantGroups = participantEntries.flatMap((entry) => {
        const group = getStrictParticipantStageGroup(entry, activeStage.name);
        return group ? [group] : [];
      });
      if (participantGroups.length > 0) {
        return [...new Set(participantGroups)].toSorted();
      }
      if (isBmps2026SurvivalStage(activeStage.name)) {
        return ["A", "B", "C", "D"];
      }
      if (isBmps2026SemiFinalsStage(activeStage.name)) {
        return ["A", "B", "C"];
      }
      return [];
    }

    if (tournamentName?.startsWith("PUBG Mobile World Cup")) {
      const participantGroups = resolvedParticipantEntries.flatMap((entry) => {
        const group = getParticipantStageGroup(entry, activeStage.name);
        return group ? [group] : [];
      });
      const standingsGroups = (activeStage.standings || []).flatMap((entry) =>
        entry.grp ? [String(entry.grp).replace(/^Group\s+/i, "").trim()] : []
      );
      const combined = [...new Set([...standingsGroups, ...participantGroups])].toSorted();
      if (combined.length > 0) return combined;
      const matchGroups = matches
        .filter(
          (m) =>
            m.tournament_id === tournamentId &&
            m.stage === activeStage?.name &&
            m.group_name,
        )
        .flatMap((m) => {
          const raw = String(m.group_name).replace(/^group\s+/i, "").trim();
          return raw ? [raw] : [];
        });
      return [...new Set([...standingsGroups, ...participantGroups, ...matchGroups])].toSorted();
    }

    const participantGroups = resolvedParticipantEntries.flatMap((entry) => {
      const group = getParticipantStageGroup(entry, activeStage.name);
      return group ? [group] : [];
    });
    const standingsGroups = (activeStage.standings || []).flatMap((entry) =>
      entry.grp ? [String(entry.grp).replace(/^Group\s+/i, "").trim()] : []
    );
    if (
      tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
      standingsGroups.length === 0 &&
      participantGroups.length === 0
    ) {
      if (isBmps2026SurvivalStage(activeStage.name)) {
        return ["A", "B", "C", "D"];
      }
      if (isBmps2026SemiFinalsStage(activeStage.name)) {
        return ["A", "B", "C"];
      }
    }

    return [...new Set([...standingsGroups, ...participantGroups])].toSorted();
  }, [activeStage, participantEntries, resolvedParticipantEntries, tournamentName, matches, tournamentId]);

  const survivalStageHasGroupedLobby =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
    isBmps2026SurvivalStage(activeStage?.name) &&
    groups.length > 0;
  const isBmps2026SemiFinalsGroupDraw =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
    String(activeStage?.name || "").trim().toLowerCase() === "semi finals" &&
    groups.length > 0;
  const visibleGroupOptions =
    survivalStageHasGroupedLobby || isBmps2026SemiFinalsGroupDraw ? [] : groups;
  const hideOverallGroupOption =
    (tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
      (isBmps2026PromotionStage(activeStage?.name) ||
        activeStage?.name === "Round 4") &&
      groups.length > 0) ||
    (tournamentName?.startsWith("PUBG Mobile World Cup") && groups.length > 0) ||
    (tournamentName === "PUBG Mobile Global Championship 2025" && groups.length > 0);
  const fallbackSelectedGroup = hideOverallGroupOption ? "groups" : "overall";
  const currentSelectedGroup =
    selectedGroup === "overall" && hideOverallGroupOption
      ? fallbackSelectedGroup
      : selectedGroup !== "overall" && selectedGroup !== "groups" && !visibleGroupOptions.includes(selectedGroup)
      ? fallbackSelectedGroup
      : selectedGroup;

  const filteredStandings = useMemo(() => {
    if (!activeStage) return [];
    if (currentSelectedGroup === "overall") return activeStage.standings || [];
    if (currentSelectedGroup === "groups") return [];
    return (activeStage.standings || []).filter((entry) => String(entry.grp || "").replace(/^Group\s+/i, "").trim() === currentSelectedGroup);
  }, [activeStage, currentSelectedGroup]);
  const groupParticipants = useMemo(() => {
    if (!activeStage || currentSelectedGroup === "overall" || currentSelectedGroup === "groups") return [];
    const seen = new Set();
    return resolvedParticipantEntries.filter((entry) => {
      if (getParticipantStageGroup(entry, activeStage.name) !== currentSelectedGroup) return false;
      const key = normalizeOrganizationName(entry.team || "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [activeStage, currentSelectedGroup, resolvedParticipantEntries]);
  const stageParticipants = useMemo(() => {
    if (!activeStage || currentSelectedGroup !== "overall") return [];
    const stageKey = String(activeStage.name || "").trim().toLowerCase();
    const seen = new Set();
    return resolvedParticipantEntries
      .filter((entry) => {
        const matches =
          getParticipantStageGroup(entry, activeStage.name) ||
          getParticipantEntryPhases(entry).some(
            (phase) => String(phase || "").trim().toLowerCase() === stageKey
          );
        if (!matches) return false;
        const key = normalizeOrganizationName(entry.team || "");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .toSorted((left, right) =>
        String(left.team || "").localeCompare(String(right.team || ""))
      );
  }, [activeStage, currentSelectedGroup, resolvedParticipantEntries]);
  const bmps2026SurvivalQualifiedTeamsByRank = useMemo(() => {
    const teamsByRank = new Map();
    if (tournamentName !== "Battlegrounds Mobile India Pro Series 2026") {
      return teamsByRank;
    }

    const survivalStage = stageOptions.find((stage) =>
      isBmps2026SurvivalStage(stage?.name)
    );
    const survivalStandings = (survivalStage?.standings || [])
      .toSorted(compareStageBoardStandings)
      .slice(0, 8);

    survivalStandings.forEach((row, index) => {
      const teamName = row?.teamName || row?.fullTeam || row?.team;
      if (teamName) teamsByRank.set(String(index + 1), teamName);
    });

    return teamsByRank;
  }, [stageOptions, tournamentName]);
  const bmps2026SurvivalRankByTeam = useMemo(() => {
    const rankByTeam = new Map();
    for (const [rank, teamName] of bmps2026SurvivalQualifiedTeamsByRank.entries()) {
      rankByTeam.set(normalizeOrganizationName(teamName), Number(rank));
    }
    return rankByTeam;
  }, [bmps2026SurvivalQualifiedTeamsByRank]);
  const groupedParticipants = useMemo(() => {
    if (!activeStage || groups.length === 0) return [];
    const useOfficialDrawOnly =
      tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
      (isBmps2026SurvivalStage(activeStage.name) ||
        isBmps2026SemiFinalsStage(activeStage.name));
    const fixtureEntries =
      tournamentName === "Battlegrounds Mobile India Pro Series 2026"
        ? getBmps2026GroupDrawEntries(activeStage.name)
        : [];
    const groupSourceEntries = fixtureEntries.length > 0
      ? fixtureEntries
      : useOfficialDrawOnly
        ? participantEntries
        : resolvedParticipantEntries;
    const resolveSemiFinalPlaceholder = (entry) => {
      if (
        tournamentName !== "Battlegrounds Mobile India Pro Series 2026" ||
        !isBmps2026SemiFinalsStage(activeStage.name)
      ) {
        return entry;
      }

      const placeholderRank = String(entry?.team || "")
        .trim()
        .match(/^survival\s*#\s*(\d+)$/i)?.[1];
      const qualifiedTeam = placeholderRank
        ? bmps2026SurvivalQualifiedTeamsByRank.get(placeholderRank)
        : null;

      return qualifiedTeam
        ? { ...entry, team: qualifiedTeam, sourcePlaceholder: entry.team }
        : entry;
    };

    return groups.map((group) => {
      let entries = groupSourceEntries
        .filter((entry) => {
          const entryGroup =
            useOfficialDrawOnly
              ? getStrictParticipantStageGroup(entry, activeStage.name)
              : getParticipantStageGroup(entry, activeStage.name);
          return entryGroup === group;
        })
        .map(resolveSemiFinalPlaceholder)
        .toSorted((left, right) => {
          const leftPlacement = Number(left?.placement) || Number.MAX_SAFE_INTEGER;
          const rightPlacement = Number(right?.placement) || Number.MAX_SAFE_INTEGER;
          return leftPlacement - rightPlacement || String(left?.team || "").localeCompare(String(right?.team || ""));
        });

      if (
        entries.length === 0 &&
        tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
        (isBmps2026SurvivalStage(activeStage.name) ||
          isBmps2026SemiFinalsStage(activeStage.name))
      ) {
        const fallbackSourceEntries =
          isBmps2026SemiFinalsStage(activeStage.name) && stageParticipants.length > 0
            ? stageParticipants
            : groupSourceEntries;
        entries = fallbackSourceEntries.filter(
          (entry) =>
            getBmps2026FallbackGroupForTeam(
              entry.team,
              activeStage.name,
              bmps2026SurvivalRankByTeam,
            ) === group,
        );
      }

      return {
        group,
        entries: dedupeParticipantEntriesByOrganization(entries),
      };
    });
  }, [
    activeStage,
    bmps2026SurvivalQualifiedTeamsByRank,
    bmps2026SurvivalRankByTeam,
    groups,
    participantEntries,
    resolvedParticipantEntries,
    stageParticipants,
    tournamentName,
  ]);
  const maxGroupRows = useMemo(
    () => Math.max(0, ...groupedParticipants.map((section) => section.entries.length)),
    [groupedParticipants]
  );
  const usesPromotionGroups =
    hideOverallGroupOption;
  const usesBmpsKnockoutMovement =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
    isBmps2026KnockoutStage(activeStage?.name) &&
    !isStatisticsStage &&
    currentSelectedGroup === "overall" &&
    Boolean(filteredStandings.length || activeStage?.standings?.length);
  const showGroupParticipantMovement = usesPromotionGroups || (tournamentName?.startsWith("PUBG Mobile World Cup") && !isStatisticsStage);
  const isSurvivalStageLobbyView =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
    isBmps2026SurvivalStage(activeStage?.name) &&
    currentSelectedGroup !== "overall";
  const isPmwcMovementStage = tournamentName?.startsWith("PUBG Mobile World Cup") && !isStatisticsStage && !isGrandFinalsStage && (tournamentName?.startsWith("PUBG Mobile World Cup") || currentSelectedGroup === "overall");
  const showMovementColumn = usesPromotionGroups || usesBmpsKnockoutMovement || isPmwcMovementStage;
  const isGroupDrawStage = groupedParticipants.length > 0 && !activeStage?.standings?.length;
  const showsGroupedDrawTab =
    isGroupDrawStage ||
    usesPromotionGroups ||
    survivalStageHasGroupedLobby ||
    isBmps2026SemiFinalsGroupDraw ||
    (tournamentName?.startsWith("PUBG Mobile World Cup") && groups.length > 0) ||
    (tournamentName === "PUBG Mobile Global Championship 2025" && groups.length > 0);
  const completeGroupStandings = useMemo(() => {
    if (!usesPromotionGroups || currentSelectedGroup === "overall") return filteredStandings;
    const selectedGroupMatchIds = new Set();
    for (const match of matches) {
      if (
        match.tournament_id === tournamentId &&
        match.stage === activeStage?.name
      ) {
        const matchGroupLetter = String(match.group_name || "").replace(/^group\s+/i, "").trim().toUpperCase();
        if (matchGroupLetter === String(currentSelectedGroup).toUpperCase()) {
          selectedGroupMatchIds.add(match.id);
        }
      }
    }
    const teamMap = new Map(teams.map((team) => [team.id, team]));
    const liveGroupStandings = new Map();

    for (const result of matchResults) {
      if (!selectedGroupMatchIds.has(result.match_id)) continue;
      const team = teamMap.get(result.team_id);
      const displayName = team?.name || result.team_name || "-";
      const key = normalizeOrganizationName(displayName);
      const existing = liveGroupStandings.get(key) || {
        placement: null,
        team: displayName,
        fullTeam: displayName,
        grp: currentSelectedGroup,
        matches: 0,
        wwcd: 0,
        pos: 0,
        elimins: 0,
        points: 0,
        placementSum: 0,
      };

      const wins = result.wins_count && result.wins_count > 0 ? result.wins_count : result.placement === 1 ? 1 : 0;
      existing.matches += result.matches_count || 1;
      existing.wwcd += wins;
      existing.pos += result.placement_points || 0;
      existing.elimins += result.kill_points || 0;
      existing.points += result.total_points || 0;
      existing.placementSum += Number(result.placement) || 0;

      liveGroupStandings.set(key, existing);
    }

    const standingsByTeam = new Map(
      [...liveGroupStandings.values(), ...filteredStandings].map((entry) => [
        normalizeOrganizationName(entry.fullTeam || entry.team),
        entry,
      ])
    );

    const hasRealStandingsData = liveGroupStandings.size > 0 || filteredStandings.length > 0;
    const completeRows = (groupParticipants.length > 0 && !hasRealStandingsData)
      ? groupParticipants.map((entry) => {
        const key = normalizeOrganizationName(entry.team);
        const existing = standingsByTeam.get(key);
        if (existing) {
          return {
            ...existing,
            team: existing.fullTeam || existing.team,
            fullTeam: existing.fullTeam || existing.team,
            teamName: existing.fullTeam || existing.team,
            grp: currentSelectedGroup,
          };
        }

        return {
          placement: null,
          team: entry.team,
          fullTeam: entry.team,
          teamName: entry.team,
          grp: currentSelectedGroup,
          matches: 0,
          wwcd: 0,
          pos: 0,
          elimins: 0,
          points: 0,
          placementSum: 0,
        };
      })
      : [...standingsByTeam.values()].map((entry) => ({
        ...entry,
        team: entry.fullTeam || entry.team,
        fullTeam: entry.fullTeam || entry.team,
        teamName: entry.fullTeam || entry.team,
        grp: currentSelectedGroup,
      }));

    const sorted = completeRows
      .map((row) => ({
        ...row,
        placementPoints: row.pos || 0,
        elims: row.elimins || 0,
        averageEliminationPosition: row.matches > 0 ? row.placementSum / row.matches : null,
      }))
      .sort(compareStageBoardStandings);

    return sorted;
  }, [usesPromotionGroups, currentSelectedGroup, filteredStandings, groupParticipants, matches, matchResults, teams, tournamentId, activeStage]);

  const showGroupColumn =
    !isGrandFinalsStage &&
    !usesPromotionGroups &&
    !isGroupDrawStage &&
    currentSelectedGroup === "overall" &&
    groups.length > 1;
  const getOverallStandingGroupLabel = (entry) => {
    if (
      tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
      (isBmps2026SurvivalStage(activeStage?.name) ||
        isBmps2026SemiFinalsStage(activeStage?.name))
    ) {
      const fallbackGroup = getBmps2026FallbackGroupForTeam(
        entry?.fullTeam || entry?.team || entry?.teamName,
        activeStage?.name,
        bmps2026SurvivalRankByTeam,
      );
      if (fallbackGroup) return fallbackGroup;
    }

    const rawGroup = String(entry?.grp ?? "-").replace(/^Group\s+/i, "").trim();
    return rawGroup || "-";
  };
  const shouldHideProjectedStageTeams =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
    isBmps2026SemiFinalsStage(activeStage?.name) &&
    currentSelectedGroup === "overall";
  const useContainedGroupLogos = groups.length > 0;
  const bmpsWaitingStageName =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026" && /^round\s+[234]$/i.test(activeStage?.name || "")
      ? getBmps2026PreviousStageName(activeStage?.name)
      : null;
  const legendItems = useMemo(() => {
    if (isStatisticsStage) return [];
    if (usesPromotionGroups) return [];
    if (usesBmpsKnockoutMovement) {
      const rows = filteredStandings.length || groupParticipants.length || activeStage?.standings?.length || 0;
      const seen = new Map();
      for (let index = 0; index < rows; index += 1) {
        const movement = getGroupMovementRule(tournamentName, activeStage?.name, currentSelectedGroup, index + 1, rows);
        const dotClass = getGroupMovementAccent(tournamentName, activeStage?.name, currentSelectedGroup, index + 1, rows)?.dot;
        if (movement && dotClass && !seen.has(movement.label)) {
          seen.set(movement.label, dotClass);
        }
      }
      return [...seen.entries()];
    }
    const seen = new Map();
    for (const entry of activeStage?.standings || []) {
      const tone = getOutcomeTone(entry.outcome);
      if (tone.label === "Stage result") {
        continue;
      }
      if (!seen.has(tone.label)) seen.set(tone.label, tone.dot);
    }
    return [...seen.entries()];
  }, [activeStage, currentSelectedGroup, filteredStandings.length, groupParticipants.length, isStatisticsStage, usesBmpsKnockoutMovement, usesPromotionGroups]);
  const {
    currentStatisticsCategory,
    currentStatisticsSubStage,
    statisticsTableRows,
    statisticsTableKey,
    sortedStatisticsTableRows,
    statisticsPanelTitle,
    selectedMvpStats,
  } = useStatisticsRows({
    statisticsCategories,
    eliminatorSubStages,
    selectedStatisticsCategory,
    selectedStatisticsSubStage,
    tableSort,
    bmps2026PlayerStats,
    bmps2026PlayerTeams,
  });
  return {
    activeStage,
    stageOptions,
    dispatchStageBoardUi,
    groups,
    showsGroupedDrawTab,
    hideOverallGroupOption,
    currentSelectedGroup,
    visibleGroupOptions,
    legendItems,
    isStatisticsStage,
    isRankingsStatisticsStage,
    statisticsCategories,
    currentStatisticsCategory,
    eliminatorSubStages,
    currentStatisticsSubStage,
    statisticsTableKey,
    tableSort,
    sortedStatisticsTableRows,
    bmps2026PlayerTeams,
    selectedMvpStats,
    groupedParticipants,
    maxGroupRows,
    usesPromotionGroups,
    completeGroupStandings,
    filteredStandings,
    showMovementColumn,
    isPmwcMovementStage,
    useContainedGroupLogos,
    showGroupColumn,
    getOverallStandingGroupLabel,
    groupParticipants,
    isSurvivalStageLobbyView,
    showGroupParticipantMovement,
    stageParticipants,
    shouldHideProjectedStageTeams,
    bmpsWaitingStageName,
  };
}
