import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Users, Award } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import { applyCurrentRosterOverride } from "@/lib/currentRosterOverrides";
import { buildLiveRoster } from "@/lib/rosterUtils";
import { getStageBoardData } from "@/lib/stageBoard";
import { resolveTournamentParticipantState } from "@/lib/tournamentProgression";
import { decorateMatchesWithLiveStatus } from "@/lib/liveCalendar";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import { getOfficialParticipantEntries, getOfficialParticipantCount, isBmps2026Tournament } from "@/lib/tournamentParticipants";
import { getTournamentLogo } from "@/features/tournaments/utils/tournamentBranding";
import { getTournamentAllocations } from "@/features/tournaments/utils/tournamentAllocations";
import { BMPS_2026_STYLE_STAGE_TOURNAMENTS, EMPTY_NORMALIZED_STAGES, EMPTY_STAGE_MATCH_RESULTS, EMPTY_STAGE_MATCHES, EMPTY_STAGE_PARTICIPANT_ENTRIES, EMPTY_STAGE_PLAYERS, EMPTY_STAGE_TEAMS } from "@/features/tournaments/constants";
import { buildNormalizedParticipantEntries, buildNormalizedStageBoardStages, getCleanStageLabel, getParticipantSectionLabel, mergeDisplayStages } from "@/features/tournaments/utils/stageHelpers";
import { getChampionDisplayName, getChampionLogoOverride, normalizeTeamName } from "@/features/tournaments/utils/participantHelpers";

export function useTournamentDetailModel({ tournament, requestedStage = "" }) {
  const { data: coreData = {}, isLoading: isCoreLoading } = useQuery({
    queryKey: ["tournament-core", tournament.id],
    queryFn: () => base44.pages.tournamentCore(tournament.id),
    enabled: Boolean(tournament?.id),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });
  const { data: fullData = {}, isLoading: isFullLoading } = useQuery({
    queryKey: ["tournament-full", tournament.id],
    queryFn: () => base44.pages.tournamentFull(tournament.id),
    enabled: Boolean(tournament?.id),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });
  const stageBoardRef = useRef(null);
  const [stageBoardVisible, setStageBoardVisible] = useState(false);
  useEffect(() => {
    if (!stageBoardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStageBoardVisible(true); },
      { rootMargin: "200px" }
    );
    observer.observe(stageBoardRef.current);
    return () => observer.disconnect();
  }, []);

  const teams = fullData.teams || EMPTY_STAGE_TEAMS;
  const matches = coreData.matches || EMPTY_STAGE_MATCHES;
  const rawMatchResults = coreData.matchResults || EMPTY_STAGE_MATCH_RESULTS;
  const matchResults = useMemo(() => filterPublishedMatchResults(rawMatchResults), [rawMatchResults]);
  const players = fullData.players || EMPTY_STAGE_PLAYERS;
  const dbTransfers = fullData.transfers || EMPTY_STAGE_PLAYERS;
  const normalizedTournamentData = coreData.normalizedTournamentData || null;

  const normalizedParticipants =
    normalizedTournamentData?.participants ?? EMPTY_STAGE_PARTICIPANT_ENTRIES;
  const normalizedStages =
    normalizedTournamentData?.stages ?? EMPTY_NORMALIZED_STAGES;
  const rawParticipantEntries = isBmps2026Tournament(tournament)
    ? getOfficialParticipantEntries(tournament)
    : tournament.participants ?? EMPTY_STAGE_PARTICIPANT_ENTRIES;
  const rawTournamentStages = tournament.stages ?? EMPTY_NORMALIZED_STAGES;
  const calendarMatches = useMemo(
    () => decorateMatchesWithLiveStatus(matches, matchResults),
    [matches, matchResults]
  );

  const participantEntries = useMemo(() => {
    const cleanEntries = (entries) =>
      (entries || []).map((entry) => ({
        ...entry,
        phase: getCleanStageLabel(entry.phase || "Participants"),
      }));

    if (normalizedParticipants.length > 0) {
      const hasDbFormat = normalizedParticipants.some(
        (p) => p.team && typeof p.team === "object" && p.team?.name,
      );
      if (hasDbFormat) {
        const normalizedEntries = buildNormalizedParticipantEntries(normalizedParticipants);
        if (normalizedEntries.length >= rawParticipantEntries.length) {
          return cleanEntries(normalizedEntries);
        }
      }

      return cleanEntries(normalizedParticipants);
    }

    return cleanEntries(rawParticipantEntries);
  }, [normalizedParticipants, rawParticipantEntries]);

  const rankings = tournament.rankings ?? [];
  const useIntegratedRankingsStage =
    BMPS_2026_STYLE_STAGE_TOURNAMENTS.has(tournament.name) && rankings.length > 0;
  const tournamentLogo = getTournamentLogo(tournament);
  const allocations = getTournamentAllocations(tournament);
  const resolvedParticipantState = useMemo(() => {
    const sourceStages =
      normalizedStages.length > 0 ? normalizedStages : rawTournamentStages;
    return resolveTournamentParticipantState({
      tournament,
      teams,
      matches: calendarMatches,
      matchResults,
      participantEntries,
      stageNames: sourceStages.flatMap((stage) => (stage?.name ? [getCleanStageLabel(stage.name)] : [])),
    });
  }, [
    calendarMatches,
    matchResults,
    normalizedStages,
    participantEntries,
    rawTournamentStages,
    teams,
    tournament,
  ]);
  const derivedStageBoards = useMemo(() => {
    const map = new Map();
    const sourceStages =
      normalizedStages.length > 0 ? normalizedStages : rawTournamentStages;
    for (const stage of sourceStages) {
      if (!stage?.name) continue;
      map.set(
        stage.name,
        getStageBoardData({
          featuredTournament: tournament,
          teams,
          matches: calendarMatches,
          matchResults,
          requestedStage: stage.name,
          participantEntries: resolvedParticipantState.participantEntries,
        })
      );
    }
    return map;
  }, [
    calendarMatches,
    matchResults,
    normalizedStages,
    rawTournamentStages,
    resolvedParticipantState.participantEntries,
    teams,
    tournament,
  ]);
  const tournamentStageFocus = useMemo(
    () =>
      getStageBoardData({
        featuredTournament: tournament,
        teams,
        matches: calendarMatches,
        matchResults,
        requestedStage: requestedStage || null,
          participantEntries: resolvedParticipantState.participantEntries,
      }),
    [calendarMatches, matchResults, requestedStage, resolvedParticipantState.participantEntries, teams, tournament]
  );
  const stageBoardStages = useMemo(
    () => {
      if (normalizedStages.length > 0) {
        const normalizedBoardStages = buildNormalizedStageBoardStages(normalizedStages, normalizedParticipants);
        const rawStageMap = new Map(
          rawTournamentStages.map((stage) => [getCleanStageLabel(stage.name), stage]),
        );
        const mergedStages = normalizedBoardStages.map((stage) => {
          const stageName = getCleanStageLabel(stage.name);
          const rawStage = rawStageMap.get(stageName);
          const derived = derivedStageBoards.get(stage.name) || derivedStageBoards.get(stageName);
          const rawStandings = Array.isArray(rawStage?.standings) ? rawStage.standings : [];
          const deduplicatedRawStandings = rawStandings.length > 0
            ? Array.from(new Map(rawStandings.map((s) => [s.team, s])).values())
            : rawStandings;
          const normalizedStandings = Array.isArray(stage.standings) ? stage.standings : [];
          const derivedStandings = derived?.standings
            ?.filter((entry) => entry.teamId != null)
            ?.map((entry) => ({
              placement: entry.rank,
              team: entry.teamName,
              fullTeam: entry.teamName,
              grp: entry.group && entry.group !== "-" ? entry.group : undefined,
              matches: entry.matches,
              wwcd: entry.wwcd,
              pos: entry.placementPoints,
              elimins: entry.elims,
              points: entry.points,
            })) || [];
          const preferredStandings =
            deduplicatedRawStandings.length > normalizedStandings.length
              ? deduplicatedRawStandings
              : normalizedStandings;
          const finalStandings =
            normalizedStandings.length > 0
              ? normalizedStandings
              : derivedStandings.length > 0
                ? derivedStandings
                : preferredStandings;

          return {
            ...stage,
            name: stageName,
            summary: stage.summary || rawStage?.summary || "",
            teamCount: Math.max(stage.teamCount || 0, rawStage?.teamCount || 0, finalStandings.length || 0),
            standings: finalStandings,
          };
        });

        const normalizedNames = new Set(mergedStages.map((stage) => getCleanStageLabel(stage.name)));
        const rawOnlyStages = rawTournamentStages.reduce((stagesAcc, stage) => {
          const stageName = getCleanStageLabel(stage?.name);
          if (!stageName || normalizedNames.has(stageName)) {
            return stagesAcc;
          }

          const stageStandings = Array.isArray(stage.standings) ? stage.standings : [];
          const dedupedRawStandings = stageStandings.length > 0
            ? Array.from(new Map(stageStandings.map((s) => [s.team, s])).values())
            : stageStandings;
          stagesAcc.push({
            ...stage,
            name: stageName,
            standings: dedupedRawStandings,
          });
          return stagesAcc;
        }, []);

        return mergeDisplayStages([...mergedStages, ...rawOnlyStages]);
      }

      return mergeDisplayStages(rawTournamentStages.map((stage) => {
        const stageName = getCleanStageLabel(stage.name);
        const derived = derivedStageBoards.get(stage.name) || derivedStageBoards.get(stageName);
        const derivedStandings = derived?.standings
          ?.filter((entry) => entry.teamId != null)
          ?.map((entry) => ({
          placement: entry.rank,
          team: entry.teamName,
          fullTeam: entry.teamName,
          grp: entry.group && entry.group !== "-" ? entry.group : undefined,
          matches: entry.matches,
          wwcd: entry.wwcd,
          pos: entry.placementPoints,
          elimins: entry.elims,
          points: entry.points,
        })) || [];

        const fallbackStandings = stage.standings || [];
        const dedupedFallbackStandings = fallbackStandings.length > 0
          ? Array.from(new Map(fallbackStandings.map((s) => [s.team, s])).values())
          : fallbackStandings;
        return {
          ...stage,
          name: stageName,
          standings: dedupedFallbackStandings.length > 0 ? dedupedFallbackStandings : derivedStandings,
        };
      }));
    },
    [derivedStageBoards, normalizedParticipants, normalizedStages, rawTournamentStages, tournament.name]
  );
  const hasStageProgression = stageBoardStages.some(
    (stage) => stage?.name && (stage.summary || stage.standings?.length || stage.teamCount),
  );
  const spotlightStage =
    stageBoardStages.find((stage) => stage.name === tournamentStageFocus.featuredStage) ||
    stageBoardStages.find((stage) => stage.summary || stage.standings?.length) ||
    null;
  const championEntry = stageBoardStages
    ?.find((stage) => stage.name === "Grand Finals" && stage.standings?.length)
    ?.standings?.find((entry) => entry.placement === 1);
  const championImageSrc =
    tournament.name === "Battlegrounds Mobile India Series 2026"
      ? "/images/bgis2026-champion.webp"
      : tournament.name === "Battlegrounds Mobile India Series 2023"
        ? "/images/bgis2023-champion.webp"
      : tournament.name === "Battlegrounds Mobile India Series 2024"
        ? "/images/bgis2024-champion.webp"
      : tournament.name === "Battlegrounds Mobile India Series 2025"
        ? "/images/bgis2025-champion.webp"
      : tournament.name === "India - Korea Invitational"
        ? "/images/in-kr-champion.webp"
      : tournament.name === "Battlegrounds Mobile India Showdown 2025"
        ? "/images/bmsd2025-champion.webp"
      : tournament.name === "Battlegrounds Mobile India International Cup 2025"
        ? "/images/bmic2025-champion.webp"
      : tournament.name === "Battlegrounds Mobile India Pro Series 2023"
        ? "/images/bmps2023-champion.webp"
      : tournament.name === "Battlegrounds Mobile India Pro Series 2024"
        ? "/images/bmps2024-champion.webp"
      : tournament.name === "Battlegrounds Mobile India Pro Series 2025"
        ? "/images/bmps2025-champion.webp"
      : tournament.name === "Battlegrounds Mobile India Pro Series 2026"
        ? "/images/bmps2026-champion.webp"
      : tournament.name?.startsWith("PUBG Mobile World Cup")
        ? "/images/pmwc2026-champion.jpg"
      : null;
  const championRoster =
    participantEntries.find(
      (entry) => normalizeTeamName(entry.team) === normalizeTeamName(championEntry?.fullTeam || championEntry?.team)
    )?.players ?? null;
  const championTeamName =
    participantEntries.find(
      (entry) => normalizeTeamName(entry.team) === normalizeTeamName(championEntry?.fullTeam || championEntry?.team)
    )?.team ??
    championEntry?.fullTeam ??
    championEntry?.team;
  const championDisplayName = getChampionDisplayName(championTeamName);
  const championLogoOverride = getChampionLogoOverride(championEntry?.fullTeam || championTeamName);
  const displayParticipantEntries = useMemo(() => {
    if (!isBmps2026Tournament(tournament)) {
      return participantEntries;
    }

    return getOfficialParticipantEntries({
      ...tournament,
      participants: participantEntries,
    });
  }, [participantEntries, tournament]);
  const participantCount = Math.max(
    getOfficialParticipantCount({
      ...tournament,
      participants: displayParticipantEntries,
    }),
    16,
  );
  const participantSections = useMemo(() => {
    if (tournament.name === "Battlegrounds Mobile India Pro Series 2026" || tournament.name === "BGMI Masters Series Season 5" || tournament.name?.startsWith("PUBG Mobile World Cup")) {
      return [
        {
          phase: "Teams",
          entries: displayParticipantEntries,
          order: -1,
        },
      ];
    }

    const sections = new Map();
    const getOrder = (phase) => {
      if (/round 1 - group a/i.test(phase)) return 0;
      if (/round 1 - group b/i.test(phase)) return 1;
      if (/round 1 - group c/i.test(phase)) return 2;
      if (/round 1 - group d/i.test(phase)) return 3;
      if (/round 2/i.test(phase)) return 4;
      if (/round 3/i.test(phase)) return 5;
      if (/round 4/i.test(phase)) return 6;
      if (/semi/i.test(phase)) return 7;
      if (/survival/i.test(phase)) return 8;
      if (/grand finals/i.test(phase)) return 9;
      return 50;
    };

    for (const entry of participantEntries) {
      const phase = getParticipantSectionLabel(entry.phase || "Participants");
      if (!sections.has(phase)) {
        sections.set(phase, []);
      }
      sections.get(phase).push(entry);
    }

    return Array.from(sections.entries())
      .toSorted((a, b) => {
        const orderDiff = getOrder(a[0]) - getOrder(b[0]);
        if (orderDiff !== 0) return orderDiff;
        return a[0].localeCompare(b[0]);
      })
      .map(([phase, entries]) => ({
        phase,
        entries: entries.toSorted((left, right) => {
          const leftPlacement = Number(left?.placement);
          const rightPlacement = Number(right?.placement);
          const leftHasPlacement = Number.isFinite(leftPlacement);
          const rightHasPlacement = Number.isFinite(rightPlacement);
          if (leftHasPlacement && rightHasPlacement && leftPlacement !== rightPlacement) {
            return leftPlacement - rightPlacement;
          }
          if (leftHasPlacement !== rightHasPlacement) {
            return leftHasPlacement ? -1 : 1;
          }
          return String(left?.team || "").localeCompare(String(right?.team || ""));
        }),
      }));
  }, [displayParticipantEntries, participantEntries, tournament.name]);
  const liveParticipantRosters = useMemo(() => {
    const rosterMap = {};
    const teamIdsByNormalizedName = new Map();

    for (const team of teams) {
      const normalizedTeam = normalizeOrganizationName(team.name);
      const currentIds = teamIdsByNormalizedName.get(normalizedTeam) || [];
      currentIds.push(team.id);
      teamIdsByNormalizedName.set(normalizedTeam, currentIds);
    }

    for (const participant of participantEntries) {
      const normalizedKey = normalizeOrganizationName(participant.team);
      const participantTeamIds = teamIdsByNormalizedName.get(normalizedKey) || [];

      rosterMap[normalizedKey] = buildLiveRoster({
        teamName: participant.team,
        normalizedTeam: normalizeOrganizationName,
        teamIds: participantTeamIds,
        players,
        transferEntries: dbTransfers,
        applyOverride: applyCurrentRosterOverride,
      });
    }

    return rosterMap;
  }, [dbTransfers, participantEntries, players, teams]);
  const featuredFacts = useMemo(() => [
    {
      label: "Game",
      value: tournament.game || "BGMI",
      icon: Award,
      variant: "blue",
    },
    {
      label: "Prize Pool",
      value: tournament.prize_pool || "TBA",
      icon: Award,
      variant: "lime",
    },
    {
      label: "Teams",
      value: String(participantCount),
      icon: Users,
      variant: "default",
    },
    {
      label: "Stage Focus",
      value: spotlightStage?.name || tournament.status,
      icon: Calendar,
      variant: "dark",
    },
  ], [tournament.game, tournament.prize_pool, tournament.status, participantCount, spotlightStage]);
  const stageDetails = useMemo(() => {
    const calendarByLabel = new Map(
      (tournament.calendar || []).map((item) => [getCleanStageLabel(item.label), item.week])
    );

    return mergeDisplayStages(stageBoardStages).flatMap((stage) =>
      stage.summary || stage.standings?.length || stage.teamCount
        ? [
            {
              ...stage,
              name: getCleanStageLabel(stage.name),
              calendarWeek: calendarByLabel.get(getCleanStageLabel(stage.name)) || null,
            },
          ]
        : [],
    );
  }, [tournament.calendar, stageBoardStages]);
  const prizeColumns = useMemo(() => {
    const rows = Array.isArray(tournament.prize_breakdown)
      ? tournament.prize_breakdown
      : [];
    return {
      hasInr: rows.some((entry) => entry?.inr),
      hasCny: rows.some((entry) => entry?.cny),
      hasUsd: rows.some((entry) => entry?.usd),
      hasQualifiesTo: rows.some((entry) => entry?.qualifiesTo),
    };
  }, [tournament.prize_breakdown]);
  return {
    tournamentLogo,
    participantCount,
    featuredFacts,
    spotlightStage,
    allocations,
    stageDetails,
    prizeColumns,
    participantEntries,
    participantSections,
    liveParticipantRosters,
    rankings,
    useIntegratedRankingsStage,
    championEntry,
    championImageSrc,
    championRoster,
    championTeamName,
    championDisplayName,
    championLogoOverride,
    stageBoardRef,
    hasStageProgression,
    stageBoardVisible,
    stageBoardStages,
    resolvedParticipantState,
    teams,
    players,
    calendarMatches,
    matchResults,
  };
}
