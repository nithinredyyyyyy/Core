import React, { useEffect, useMemo, useReducer, useState } from "react";
import { ArrowLeft, Calendar, Users, Award, ChevronDown, Trophy } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TeamIdentity from "@/components/shared/TeamIdentity";
import LogoBlock from "@/components/shared/LogoBlock";
import StatusBadge from "../shared/StatusBadge";
import { Link } from "react-router-dom";
import { getOrganizationMeta, normalizeOrganizationName } from "@/lib/organizationIdentity";
import { applyCurrentRosterOverride } from "@/lib/currentRosterOverrides";
import { buildLiveRoster } from "@/lib/rosterUtils";
import { compareStageBoardStandings, getFeaturedTournamentStage, getStageBoardData } from "@/lib/stageBoard";
import {
  deriveBmps2026ParticipantEntries,
  isBmps2026PromotionStage,
  resolveTournamentParticipantState,
} from "@/lib/bmps2026Progression";
import {
  BMPS_2026_IGL_STATS,
  BMPS_2026_MVP_STATS,
  BMPS_2026_PLAYER_ROW_TEAM_OVERRIDES,
  BMPS_2026_PLAYER_TEAM_OVERRIDES,
  BMPS_2026_QUALIFIER_PLAYER_STATS,
} from "@/lib/bmps2026PlayerStats";
import { decorateMatchesWithLiveStatus } from "@/lib/liveCalendar";
import { filterPublishedMatchResults } from "@/lib/matchResultPublication";
import { useIsMobile } from "@/hooks/use-mobile";

function getTournamentLogo(tournament) {
  if (tournament.name === "Battlegrounds Mobile India Series 2026") {
    return "/images/bgis-logo.png";
  }
  if (tournament.name === "Battlegrounds Mobile India Series 2023") {
    return "/images/bgis-2023.png";
  }
  if (tournament.name === "Battlegrounds Mobile India Series 2024") {
    return "/images/bgis-2024.png";
  }
  if (tournament.name === "Battlegrounds Mobile India Series 2025") {
    return "/images/bgis-2025.png";
  }
  if (tournament.name === "India - Korea Invitational") {
    return "/images/in-kr.png";
  }
  if (tournament.name === "Battlegrounds Mobile India Showdown 2025") {
    return "/images/bmsd-2025.png";
  }
  if (tournament.name === "Battlegrounds Mobile India International Cup 2025") {
    return "/images/bmic-2025.png";
  }
  if (tournament.name === "Battlegrounds Mobile India Pro Series 2023") {
    return "/images/bmps-2023.png";
  }
  if (tournament.name === "Battlegrounds Mobile India Pro Series 2024") {
    return "/images/bmps-2024.png";
  }
  if (tournament.name === "Battlegrounds Mobile India Pro Series 2025") {
    return "/images/bmps-2025.png";
  }
  if (tournament.name === "Battlegrounds Mobile India Pro Series 2026") {
    return "/images/bmps-2026.png";
  }

  return null;
}

function getTournamentAllocations(tournament) {
  const cleanAllocations = (allocations) =>
    (allocations || []).filter((allocation) => {
      const label = normalizeOrganizationName(
        `${allocation?.title || ""} ${allocation?.event || ""}`,
      );
      return ![...HIDDEN_PARTICIPANT_PHASE_LABELS].some((hidden) =>
        label.includes(hidden),
      );
    });

  if (tournament.name === "Battlegrounds Mobile India Pro Series 2025") {
    return cleanAllocations([
      {
        title: "Champion Slot",
        event: "PUBG Mobile World Cup 2025",
        detail: "Champion qualifies for PMWC 2025.",
      },
    ]);
  }

  if (tournament.name === "Battlegrounds Mobile India Showdown 2025") {
    return cleanAllocations([
      {
        title: "Champion Slot",
        event: "PUBG Mobile Global Championship 2025 - The Gauntlet",
        detail: "Champion qualifies for PMGC 2025: The Gauntlet.",
      },
      {
        title: "Top 8 Slots",
        event: "Battlegrounds Mobile International Cup 2025",
        detail: "Top 8 teams qualify for BMIC 2025.",
      },
    ]);
  }

  if (tournament.name === "Battlegrounds Mobile India International Cup 2025") {
    return cleanAllocations([
      {
        title: "Champion Slot",
        event: "PUBG Mobile Global Championship 2025 - The Gauntlet",
        detail: "Champion qualifies for PMGC 2025: The Gauntlet.",
      },
      {
        title: "Runner-up Slot",
        event: "PUBG Mobile Global Championship 2025 - Group Stage",
        detail: "Runner-up qualifies for PMGC 2025 Group Stage.",
      },
    ]);
  }

  return cleanAllocations(tournament.allocations);
}

const BMPS_2026_STYLE_STAGE_TOURNAMENTS = new Set([
  "Battlegrounds Mobile India Series 2026",
  "Battlegrounds Mobile India International Cup 2025",
  "Battlegrounds Mobile India Showdown 2025",
  "Battlegrounds Mobile India Pro Series 2025",
  "Battlegrounds Mobile India Series 2025",
  "Battlegrounds Mobile India Pro Series 2024",
  "Battlegrounds Mobile India Series 2024",
  "Battlegrounds Mobile India Pro Series 2023",
  "India - Korea Invitational",
  "Battlegrounds Mobile India Series 2023",
]);

const HIDDEN_PARTICIPANT_PHASE_LABELS = new Set(
  [
    "BMIC - India Showdown",
    "Pro Series Korea",
    "Japan League",
    "BMSD - Upper Bracket Invited",
    "Lower Bracket Invited",
    "Grand Finals",
    "Semi Finals 1",
    "Semi Finals 2",
  ].map((label) => normalizeOrganizationName(label)),
);

function getCleanStageLabel(label) {
  const value = String(label || "").trim();
  if (!value) return value;
  return value
    .replace(/\bSemi Finals Week 1\b/gi, "Semi Finals 1")
    .replace(/\bSemi Finals Week 2\b/gi, "Semi Finals 2");
}

function getParticipantSectionLabel(label) {
  const cleaned = getCleanStageLabel(label || "Participants");
  return HIDDEN_PARTICIPANT_PHASE_LABELS.has(normalizeOrganizationName(cleaned))
    ? "Participants"
    : cleaned;
}

function mergeDisplayStages(stages) {
  const merged = new Map();

  for (const stage of stages || []) {
    const name = getCleanStageLabel(stage?.name);
    if (!name) continue;

    const existing = merged.get(name);
    if (!existing) {
      merged.set(name, { ...stage, name });
      continue;
    }

    const existingStandings = Array.isArray(existing.standings) ? existing.standings : [];
    const nextStandings = Array.isArray(stage.standings) ? stage.standings : [];
    merged.set(name, {
      ...existing,
      ...stage,
      name,
      summary: existing.summary || stage.summary || "",
      teamCount: Math.max(existing.teamCount || 0, stage.teamCount || 0),
      standings:
        nextStandings.length > existingStandings.length
          ? nextStandings
          : existingStandings,
    });
  }

  return [...merged.values()];
}
const EMPTY_STAGE_PARTICIPANT_ENTRIES = [];
const EMPTY_STAGE_TEAMS = [];
const EMPTY_STAGE_PLAYERS = [];
const EMPTY_STAGE_MATCHES = [];
const EMPTY_STAGE_MATCH_RESULTS = [];
const EMPTY_STAGE_RANKINGS = [];
const EMPTY_NORMALIZED_STAGES = [];

function createStageBoardUiState(defaultStageName) {
  return {
    selectedStage: defaultStageName,
    selectedGroup: "overall",
    selectedStatisticsCategory: "eliminator",
    selectedStatisticsSubStage: "qualifier stage",
    openMobileMenu: null,
  };
}

function stageBoardUiReducer(state, action) {
  switch (action.type) {
    case "selectStage":
      return {
        ...state,
        selectedStage: action.payload,
        selectedGroup: "overall",
        openMobileMenu: null,
      };
    case "selectGroup":
      return {
        ...state,
        selectedGroup: action.payload,
        openMobileMenu: null,
      };
    case "toggleMobileMenu":
      return {
        ...state,
        openMobileMenu: state.openMobileMenu === action.payload ? null : action.payload,
      };
    case "closeMobileMenu":
      return {
        ...state,
        openMobileMenu: null,
      };
    case "selectStatisticsCategory":
      return {
        ...state,
        selectedStatisticsCategory: action.payload,
        selectedStatisticsSubStage:
          action.payload === "eliminator" ? "qualifier stage" : state.selectedStatisticsSubStage,
      };
    case "selectStatisticsSubStage":
      return {
        ...state,
        selectedStatisticsSubStage: action.payload,
      };
    default:
      return state;
  }
}

function buildTeamLink(teamName) {
  return `/teams?team=${encodeURIComponent(normalizeTeamName(teamName))}`;
}

function getDisplayTeamName(teamName) {
  return getOrganizationMeta(teamName).name;
}

function getOutcomeTone(outcome) {
  const value = String(outcome || "").toLowerCase();
  if (value.includes("champion")) {
    return { border: "border-l-amber-400", dot: "bg-amber-400", label: "Champion" };
  }
  if (value.includes("runner")) {
    return { border: "border-l-slate-400", dot: "bg-slate-400", label: "Runner-up" };
  }
  if (value.includes("3rd")) {
    return { border: "border-l-orange-500", dot: "bg-orange-500", label: "3rd Place" };
  }
  if (value.includes("grand finals")) {
    return { border: "border-l-emerald-500", dot: "bg-emerald-500", label: "Advance to Grand Finals" };
  }
  if (value.includes("semi") || value.includes("qualif")) {
    return { border: "border-l-emerald-500", dot: "bg-emerald-500", label: "Qualify for next stage" };
  }
  if (value.includes("survival stage")) {
    return { border: "border-l-blue-500", dot: "bg-blue-500", label: "Move to Survival Stage" };
  }
  if (value.includes("wildcard")) {
    return { border: "border-l-blue-500", dot: "bg-blue-500", label: "Move to wildcards" };
  }
  if (value.includes("elimin")) {
    return { border: "border-l-red-500", dot: "bg-red-500", label: "Eliminated" };
  }
  return { border: "border-l-border", dot: "bg-muted-foreground/40", label: "Stage result" };
}

function getGrandFinalsPlacementTone(stageName, placement) {
  if (stageName !== "Grand Finals") return null;
  if (placement === 1) {
    return {
      border: "border-l-amber-400",
      row: "bg-amber-500/8 hover:bg-amber-500/14",
      rank: "text-amber-500",
      points: "text-amber-500",
    };
  }
  if (placement === 2) {
    return {
      border: "border-l-slate-400",
      row: "bg-slate-400/10 hover:bg-slate-400/16",
      rank: "text-slate-500 dark:text-slate-300",
      points: "text-slate-600 dark:text-slate-200",
    };
  }
  if (placement === 3) {
    return {
      border: "border-l-orange-500",
      row: "bg-orange-500/8 hover:bg-orange-500/14",
      rank: "text-orange-600 dark:text-orange-300",
      points: "text-orange-600 dark:text-orange-300",
    };
  }
  return null;
}

function getGroupMovementRule(stageName, group, position, totalTeams) {
  const normalizedStage = String(stageName || "").trim().toLowerCase();
  if (normalizedStage === "round 4") {
    if (group === "A") {
      return position <= 8
        ? {
            label: "Advance to Grand Finals",
            tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
          }
        : {
            label: "Advance to Semi Finals",
            tone: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300",
          };
    }

    if (group === "B") {
      return position <= 8
        ? {
            label: "Advance to Semi Finals",
            tone: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300",
          }
        : {
            label: "Move to Survival Stage",
            tone: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
          };
    }

    if (group === "C") {
      return {
        label: "Move to Survival Stage",
        tone: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
      };
    }

    if (group === "D") {
      return position <= 8
        ? {
            label: "Move to Survival Stage",
            tone: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
          }
        : {
            label: "Eliminated",
            tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
          };
    }
  }

  if (normalizedStage === "survival stage") {
    return position <= 8
      ? {
          label: "Advance to Semi Finals",
          tone: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-300",
        }
      : {
          label: "Eliminated",
          tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
        };
  }

  if (normalizedStage === "semi finals") {
    if (position <= 6) {
      return {
        label: "Advance to Grand Finals",
        tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
      };
    }
    if (position <= 22) {
      return {
        label: "Move to Last Chance",
        tone: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300",
      };
    }
    return {
      label: "Eliminated",
      tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
    };
  }

  if (normalizedStage === "last chance stage") {
    return position <= 2
      ? {
          label: "Advance to Grand Finals",
          tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
        }
      : {
          label: "Eliminated",
          tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
        };
  }

  const bottomCutoff = Math.max(totalTeams - 3, 1);

  if (group === "A") {
    if (position >= bottomCutoff) {
      return {
        label: "Relegation to Group B",
        tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
      };
    }
    return null;
  }

  if (group === "B") {
    if (position <= 4) {
      return {
        label: "Promotion to Group A",
        tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
      };
    }
    if (position >= bottomCutoff) {
      return {
        label: "Relegation to Group C",
        tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
      };
    }
    return null;
  }

  if (group === "C") {
    if (position <= 4) {
      return {
        label: "Promotion to Group B",
        tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
      };
    }
    if (position >= bottomCutoff) {
      return {
        label: "Relegation to Group D",
        tone: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
      };
    }
    return null;
  }

  if (group === "D" && position <= 4) {
    return {
      label: "Promotion to Group C",
      tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    };
  }

  return null;
}

function getGroupMovementAccent(stageName, group, position, totalTeams) {
  const movement = getGroupMovementRule(stageName, group, position, totalTeams);
  if (!movement) {
    return {
      cell: "border-l-slate-300 dark:border-l-slate-700",
      rank: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
      dot: "bg-slate-400",
    };
  }

  if (movement.label.includes("Promotion")) {
    return {
      cell: "border-l-emerald-500",
      rank: "bg-emerald-500 text-white",
      dot: "bg-emerald-500",
    };
  }

  if (movement.label.includes("Grand Finals")) {
    return {
      cell: "border-l-emerald-500",
      rank: "bg-emerald-500 text-white",
      dot: "bg-emerald-500",
    };
  }

  if (movement.label.includes("Semi Finals")) {
    return {
      cell: "border-l-violet-500",
      rank: "bg-violet-500 text-white",
      dot: "bg-violet-500",
    };
  }

  if (movement.label.includes("Survival Stage") || movement.label.includes("Last Chance") || movement.label.includes("wildcards")) {
    return {
      cell: "border-l-blue-500",
      rank: "bg-blue-500 text-white",
      dot: "bg-blue-500",
    };
  }

  return {
    cell: "border-l-red-500",
    rank: "bg-red-500 text-white",
    dot: "bg-red-500",
  };
}

function buildPhaseLabelFromEntry(entry) {
  if (!entry) return null;
  if (entry.phase_label) return entry.phase_label;
  if (entry.stage_name && entry.group_name) return `${entry.stage_name} - ${entry.group_name}`;
  return entry.stage_name || null;
}

function buildNormalizedParticipantEntries(normalizedParticipants) {
  return normalizedParticipants.map((participant) => {
    const stageEntries = Array.isArray(participant.stage_entries) ? participant.stage_entries : [];
    const orderedStageEntries = stageEntries.toSorted((a, b) => {
      const aPlacement = Number.isFinite(Number(a?.placement)) ? Number(a.placement) : 9999;
      const bPlacement = Number.isFinite(Number(b?.placement)) ? Number(b.placement) : 9999;
      return aPlacement - bPlacement;
    });
    const primaryStageEntry = orderedStageEntries[0] || null;

    return {
      placement:
        participant.final_rank ??
        primaryStageEntry?.placement ??
        participant.seed ??
        null,
      team: participant.team?.name || "Unknown Team",
      phase: buildPhaseLabelFromEntry(primaryStageEntry) || "Participants",
      players: (participant.players || []).flatMap((player) =>
        player.player_name ? [player.player_name] : []
      ),
      roster: (participant.players || []).map((player) => ({
        name: player.player_name,
        country: player.country || "India",
        role: player.role || null,
        captain: Boolean(player.is_captain),
        substitute: Boolean(player.is_substitute),
      })),
      stageEntries: orderedStageEntries.map((entry) => ({
        phase: buildPhaseLabelFromEntry(entry),
        placement: entry?.placement ?? null,
        stageName: entry?.stage_name || null,
        groupName: entry?.group_name || null,
      })),
      seed: participant.seed ?? null,
      badges: [],
      invite_status: participant.invite_status || null,
    };
  });
}

function getBmps2026PreviousStageName(stageName) {
  const normalized = String(stageName || "").trim().toLowerCase();
  if (normalized === "round 2") return "Round 1";
  if (normalized === "round 3") return "Round 2";
  if (normalized === "round 4") return "Round 3";
  return null;
}

function buildNormalizedStageBoardStages(normalizedStages, normalizedParticipants) {
  const participantCountsByStage = new Map();

  for (const participant of normalizedParticipants) {
    for (const entry of participant.stage_entries || []) {
      if (!entry.stage_id) continue;
      participantCountsByStage.set(
        entry.stage_id,
        (participantCountsByStage.get(entry.stage_id) || 0) + 1
      );
    }
  }

  return normalizedStages.map((stage) => {
    const groupedRows = [];
    const byGroup = stage?.standings?.by_group || {};

    Object.entries(byGroup).forEach(([groupName, rows]) => {
      const groupLabel = String(groupName || "").replace(/^Group\s+/i, "").trim();
      (rows || []).forEach((entry) => {
        groupedRows.push({
          placement: entry.rank,
          team: entry.team?.name || "Unknown Team",
          fullTeam: entry.team?.name || "Unknown Team",
          grp: groupLabel || undefined,
          matches: entry.matches_played || 0,
          wwcd: entry.wins || 0,
          pos: entry.place_points || 0,
          elimins: entry.elim_points || 0,
          points: entry.total_points || 0,
          outcome: entry.progression_status || null,
        });
      });
    });

    const overallRows = (stage?.standings?.overall || []).map((entry) => ({
      placement: entry.rank,
      team: entry.team?.name || "Unknown Team",
      fullTeam: entry.team?.name || "Unknown Team",
      grp: entry.group_name
        ? String(entry.group_name).replace(/^Group\s+/i, "").trim()
        : undefined,
      matches: entry.matches_played || 0,
      wwcd: entry.wins || 0,
      pos: entry.place_points || 0,
      elimins: entry.elim_points || 0,
      points: entry.total_points || 0,
      outcome: entry.progression_status || null,
    }));

    const standings = overallRows.length > 0 ? overallRows : groupedRows;

    return {
      name: stage.name,
      summary: stage.summary || "",
      teamCount: participantCountsByStage.get(stage.id) || standings.length || 0,
      standings,
      groups: stage.groups || [],
    };
  });
}

function ParticipantRosterCard({ entry, liveParticipantRosters, tournamentStatus }) {
  const liveRoster = liveParticipantRosters[normalizeOrganizationName(entry.team)] || [];
  const displayRoster =
    tournamentStatus === "completed"
      ? entry.players || []
      : liveRoster.length > 0
        ? liveRoster
        : entry.players || [];

  return (
    <div key={`${entry.placement}-${entry.team}`} className="rounded-xl border border-border bg-background/80 p-4">
      <div className="mb-1 flex items-center gap-2">
        <p className="text-sm font-semibold text-foreground">{entry.placement}.</p>
        <Link to={buildTeamLink(entry.team)} className="inline-flex">
          <TeamIdentity
            name={getDisplayTeamName(entry.team)}
            className="font-semibold text-foreground"
          />
        </Link>
      </div>
      {displayRoster?.length ? (
        <p className="mt-3 text-sm text-muted-foreground">{displayRoster.join(", ")}</p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Roster to be announced.</p>
      )}
    </div>
  );
}

function getParticipantEntryPhases(entry) {
  const phases = new Set();
  if (entry?.phase) {
    phases.add(String(entry.phase));
  }
  for (const stageEntry of entry?.stageEntries || []) {
    if (stageEntry?.phase) {
      phases.add(String(stageEntry.phase));
    } else if (stageEntry?.stageName && stageEntry?.groupName) {
      phases.add(`${stageEntry.stageName} - ${stageEntry.groupName}`);
    } else if (stageEntry?.stageName) {
      phases.add(String(stageEntry.stageName));
    }
  }
  return [...phases].map(getCleanStageLabel);
}

function getParticipantStageGroup(entry, stageName) {
  const stageKey = String(stageName || "").trim().toLowerCase();
  for (const phase of getParticipantEntryPhases(entry)) {
    const match = String(phase || "").match(/^(.+?)\s*-\s*Group\s+([A-Z])$/i);
    if (match && match[1].trim().toLowerCase() === stageKey) {
      return match[2].toUpperCase();
    }
  }
  return null;
}

// eslint-disable-next-line
function StageStandingsBoard({
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
  const isMobile = useIsMobile();
  const hasBmps2026Statistics =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
    BMPS_2026_QUALIFIER_PLAYER_STATS.length > 0;
  const resolvedParticipantEntries = useMemo(() => {
    if (tournamentName !== "Battlegrounds Mobile India Pro Series 2026") {
      return participantEntries;
    }
    return deriveBmps2026ParticipantEntries(participantEntries, stages, {
      getRows: (stage) => stage?.standings || [],
      getGroup: (row) => row?.grp,
      getTeamName: (row) => row?.fullTeam || row?.team,
      buildDerivedEntry: ({ sourceEntry, row, teamName, destinationGroup, nextStageName }) => ({
        ...(sourceEntry || {}),
        placement: sourceEntry?.placement ?? row?.placement ?? null,
        team: sourceEntry?.team || teamName || "Unknown Team",
        phase: destinationGroup
          ? `${nextStageName} - Group ${destinationGroup}`
          : nextStageName,
        players: sourceEntry?.players || [],
        roster: sourceEntry?.roster || [],
        seed: sourceEntry?.seed ?? null,
        badges: sourceEntry?.badges || [],
        invite_status: sourceEntry?.invite_status || null,
      }),
    });
  }, [participantEntries, stages, tournamentName]);

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
        if (!stage.name || !(stage.standings?.length || stage.summary || stage.teamCount || stageHasParticipants)) {
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
          summary: "Player qualifier statistics for BMPS 2026.",
          teamCount: BMPS_2026_QUALIFIER_PLAYER_STATS.length,
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
    [hasBmps2026Statistics, rankings.length, resolvedParticipantEntries, stages]
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
    openMobileMenu,
  } = stageBoardUi;
  const statisticsCategories = useMemo(() => {
    const categories = [];
    if (BMPS_2026_QUALIFIER_PLAYER_STATS.length > 0) {
      categories.push({ key: "eliminator", label: "Eliminator" });
    }
    if (BMPS_2026_IGL_STATS.length > 0) {
      categories.push({ key: "igl", label: "IGL" });
    }
    if (BMPS_2026_MVP_STATS.length > 0) {
      categories.push({ key: "mvp", label: "MVP" });
    }
    return categories;
  }, []);
  const eliminatorSubStages = useMemo(() => {
    const subStages = [];
    if (BMPS_2026_QUALIFIER_PLAYER_STATS.length > 0) {
      subStages.push({ key: "qualifier stage", label: "Qualifier Stage" });
    }
    return subStages;
  }, []);
  const currentSelectedStage = stageOptions.some((stage) => stage.name === selectedStage)
    ? selectedStage
    : defaultStageName;
  const currentStatisticsCategory = statisticsCategories.some(
    (category) => category.key === selectedStatisticsCategory
  )
    ? selectedStatisticsCategory
    : (statisticsCategories[0]?.key ?? "eliminator");
  const currentStatisticsSubStage =
    currentStatisticsCategory === "eliminator" &&
    eliminatorSubStages.some((subStage) => subStage.key === selectedStatisticsSubStage)
      ? selectedStatisticsSubStage
      : (eliminatorSubStages[0]?.key ?? "qualifier stage");
  const activeStage = stageOptions.find((stage) => stage.name === currentSelectedStage) || stageOptions[0] || null;
  const isStatisticsStage = Boolean(activeStage?.isStatistics);
  const isRankingsStatisticsStage = activeStage?.statisticsType === "rankings";
  const isGrandFinalsStage = String(activeStage?.name || "").trim().toLowerCase() === "grand finals";
  const groups = useMemo(() => {
    if (!activeStage) return [];
    if (String(activeStage.name || "").trim().toLowerCase() === "grand finals") return [];
    const standingsGroups = (activeStage.standings || []).flatMap((entry) =>
      entry.grp ? [entry.grp] : []
    );
    const participantGroups = resolvedParticipantEntries.flatMap((entry) => {
      const group = getParticipantStageGroup(entry, activeStage.name);
      return group ? [group] : [];
    });

    return [...new Set([...standingsGroups, ...participantGroups])].toSorted();
  }, [activeStage, resolvedParticipantEntries]);

  const currentSelectedGroup =
    selectedGroup !== "overall" && !groups.includes(selectedGroup) ? "overall" : selectedGroup;

  const filteredStandings = useMemo(() => {
    if (!activeStage) return [];
    if (currentSelectedGroup === "overall") return activeStage.standings || [];
    return (activeStage.standings || []).filter((entry) => entry.grp === currentSelectedGroup);
  }, [activeStage, currentSelectedGroup]);
  const groupParticipants = useMemo(() => {
    if (!activeStage || currentSelectedGroup === "overall") return [];
    return resolvedParticipantEntries.filter(
      (entry) => getParticipantStageGroup(entry, activeStage.name) === currentSelectedGroup
    );
  }, [activeStage, currentSelectedGroup, resolvedParticipantEntries]);
  const stageParticipants = useMemo(() => {
    if (!activeStage || groups.length > 0 || currentSelectedGroup !== "overall") return [];
    const stageKey = String(activeStage.name || "").trim().toLowerCase();
    return resolvedParticipantEntries
      .filter((entry) =>
        getParticipantEntryPhases(entry).some(
          (phase) => String(phase || "").trim().toLowerCase() === stageKey
        )
      )
      .toSorted((left, right) =>
        String(left.team || "").localeCompare(String(right.team || ""))
      );
  }, [activeStage, currentSelectedGroup, groups.length, resolvedParticipantEntries]);
  const groupedParticipants = useMemo(() => {
    if (!activeStage || groups.length === 0) return [];
    return groups.map((group) => ({
      group,
      entries: resolvedParticipantEntries.filter(
        (entry) => getParticipantStageGroup(entry, activeStage.name) === group
      ),
    }));
  }, [activeStage, groups, resolvedParticipantEntries]);
  const maxGroupRows = useMemo(
    () => Math.max(0, ...groupedParticipants.map((section) => section.entries.length)),
    [groupedParticipants]
  );
  const usesPromotionGroups =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
    (isBmps2026PromotionStage(activeStage?.name) ||
      activeStage?.name === "Round 4") &&
    groups.length > 0;
  const usesBmpsKnockoutMovement =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
    ["survival stage", "semi finals", "last chance stage"].includes(
      String(activeStage?.name || "").trim().toLowerCase(),
    ) &&
    !isStatisticsStage;
  const showMovementColumn = usesPromotionGroups || usesBmpsKnockoutMovement;
  const isGroupDrawStage = groupedParticipants.length > 0 && !activeStage?.standings?.length;
  const completeGroupStandings = useMemo(() => {
    if (!usesPromotionGroups || currentSelectedGroup === "overall") return filteredStandings;
    const selectedGroupMatchIds = new Set();
    for (const match of matches) {
      if (
        match.tournament_id === tournamentId &&
        match.stage === activeStage?.name &&
        String(match.group_name || "").trim().toLowerCase() ===
          `group ${currentSelectedGroup}`.toLowerCase()
      ) {
        selectedGroupMatchIds.add(match.id);
      }
    }
    const teamMap = new Map(teams.map((team) => [team.id, team]));
    const liveGroupStandings = new Map();

    for (const result of matchResults) {
      if (!selectedGroupMatchIds.has(result.match_id)) continue;
      const team = teamMap.get(result.team_id);
      const displayName = team?.name || result.team_name || "Unknown Team";
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

    const completeRows = groupParticipants.map((entry) => {
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
    });

    return completeRows
      .map((row) => ({
        ...row,
        placementPoints: row.pos || 0,
        elims: row.elimins || 0,
        averageEliminationPosition: row.matches > 0 ? row.placementSum / row.matches : null,
      }))
      .sort(compareStageBoardStandings);
  }, [usesPromotionGroups, currentSelectedGroup, filteredStandings, groupParticipants, matches, matchResults, teams, tournamentId, activeStage]);

  const showGroupColumn =
    !isGrandFinalsStage &&
    !usesPromotionGroups &&
    currentSelectedGroup === "overall" &&
    groups.length > 1;
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
        const movement = getGroupMovementRule(activeStage?.name, currentSelectedGroup, index + 1, rows);
        const dotClass = getGroupMovementAccent(activeStage?.name, currentSelectedGroup, index + 1, rows)?.dot;
        if (movement && dotClass && !seen.has(movement.label)) {
          seen.set(movement.label, dotClass);
        }
      }
      return [...seen.entries()];
    }
    const seen = new Map();
    for (const entry of activeStage?.standings || []) {
      const tone = getOutcomeTone(entry.outcome);
      if (activeStage?.name === "Grand Finals" && tone.label === "Stage result") {
        continue;
      }
      if (!seen.has(tone.label)) seen.set(tone.label, tone.dot);
    }
    return [...seen.entries()];
  }, [activeStage, currentSelectedGroup, filteredStandings.length, groupParticipants.length, isStatisticsStage, usesBmpsKnockoutMovement, usesPromotionGroups]);
  const bmps2026PlayerTeams = useMemo(() => {
    if (!isStatisticsStage) return new Map();

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
  }, [isStatisticsStage, players, resolvedParticipantEntries, teams]);
  const statisticsTableRows = useMemo(() => {
    if (currentStatisticsCategory !== "eliminator") return [];
    if (currentStatisticsSubStage !== "qualifier stage") return [];
    return BMPS_2026_QUALIFIER_PLAYER_STATS;
  }, [currentStatisticsCategory, currentStatisticsSubStage]);
  const statisticsPanelTitle = useMemo(() => {
    if (currentStatisticsCategory === "eliminator") return "ELIMINATOR";
    if (currentStatisticsCategory === "igl") return "IGL";
    if (currentStatisticsCategory === "mvp") return "MVP";
    if (currentStatisticsCategory === "fmvp") return "FMVP";
    return "STATISTICS";
  }, [currentStatisticsCategory]);

  if (!activeStage) return null;

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="rounded-[1.35rem] border border-border bg-background/95 p-4 shadow-sm">
          <div className={groups.length > 0 ? "grid grid-cols-2 gap-3" : "space-y-2"}>
            <div className="space-y-2">
              <label htmlFor="mobile-stage-select" className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/85">
                Stage
              </label>
              <div className="relative">
                <button
                  type="button"
                  id="mobile-stage-select"
                  aria-haspopup="listbox"
                  aria-expanded={openMobileMenu === "stage"}
                  onClick={() => {
                    dispatchStageBoardUi({ type: "toggleMobileMenu", payload: "stage" });
                  }}
                  className="flex w-full items-center justify-between rounded-full border border-primary/70 bg-[#111111] px-5 py-3 text-base font-semibold text-white outline-none transition focus:border-primary"
                >
                  <span>{activeStage.name === "Wildcard" ? "Wildcards" : activeStage.name}</span>
                  <ChevronDown className={"size-4 text-primary transition-transform " + (openMobileMenu === "stage" ? "rotate-180" : "")} />
                </button>
                {openMobileMenu === "stage" ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-[1.2rem] border border-primary/40 bg-[#111111] shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
                    {stageOptions.map((stage) => {
                      const isActive = stage.name === activeStage.name;
                      return (
                        <button
                          key={stage.name}
                          type="button"
                          onClick={() => {
                            dispatchStageBoardUi({
                              type: "selectStage",
                              payload: stage.name,
                            });
                          }}
                          className={"flex w-full items-center justify-between px-4 py-3 text-left text-base font-semibold transition " + (isActive ? "bg-primary/14 text-white" : "text-white hover:bg-white/5")}
                        >
                          <span>{stage.name === "Wildcard" ? "Wildcards" : stage.name}</span>
                          {isActive ? <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Now</span> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            {groups.length > 0 ? (
              <div className="space-y-2">
              <label htmlFor="mobile-group-select" className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/85">
                Group
              </label>
                <div className="relative">
                  <button
                    type="button"
                    id="mobile-group-select"
                    aria-haspopup="listbox"
                    aria-expanded={openMobileMenu === "group"}
                    onClick={() => {
                      dispatchStageBoardUi({ type: "toggleMobileMenu", payload: "group" });
                    }}
                    className="flex w-full items-center justify-between rounded-full border border-primary/70 bg-[#111111] px-5 py-3 text-base font-semibold text-white outline-none transition focus:border-primary"
                  >
                    <span>
                      {currentSelectedGroup === "overall"
                        ? ((isGroupDrawStage || usesPromotionGroups) ? "Groups" : "Overall")
                        : "Group " + currentSelectedGroup}
                    </span>
                    <ChevronDown className={"size-4 text-primary transition-transform " + (openMobileMenu === "group" ? "rotate-180" : "")} />
                  </button>
                  {openMobileMenu === "group" ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-[1.2rem] border border-primary/40 bg-[#111111] shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
                      <button
                        type="button"
                        onClick={() => {
                          dispatchStageBoardUi({
                            type: "selectGroup",
                            payload: "overall",
                          });
                        }}
                        className={"flex w-full items-center justify-between px-4 py-3 text-left text-base font-semibold transition " + (currentSelectedGroup === "overall" ? "bg-primary/14 text-white" : "text-white hover:bg-white/5")}
                      >
                        <span>{(isGroupDrawStage || usesPromotionGroups) ? "Groups" : "Overall"}</span>
                      </button>
                      {groups.map((group) => {
                        const isActive = currentSelectedGroup === group;
                        return (
                          <button
                            key={group}
                            type="button"
                            onClick={() => {
                              dispatchStageBoardUi({
                                type: "selectGroup",
                                payload: group,
                              });
                            }}
                            className={"flex w-full items-center justify-between px-4 py-3 text-left text-base font-semibold transition " + (isActive ? "bg-primary/14 text-white" : "text-white hover:bg-white/5")}
                          >
                            <span>{"Group " + group}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        {isStatisticsStage ? (
          <div className="rounded-[1.35rem] border border-border bg-background/90 p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Statistics</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This view is still data-dense on mobile, so it stays in the scrollable stats format for now.
            </p>
          </div>
        ) : null}

        {!isStatisticsStage && currentSelectedGroup === "overall" && (isGroupDrawStage || usesPromotionGroups) ? (
          <div className="space-y-3">
            {groupedParticipants.map((section) => (
              <div key={activeStage.name + "-" + section.group} className="overflow-hidden rounded-[1.35rem] border border-border bg-background/95 shadow-sm">
                <div className="border-b border-border/60 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{"Group " + section.group}</p>
                </div>
                <div>
                  {section.entries.map((entry, index) => (
                    <div
                      key={section.group + "-" + entry.team + "-" + index}
                      className={"px-4 py-3 " + (index < section.entries.length - 1 ? "border-b border-border/55" : "")}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 shrink-0 text-sm font-semibold text-foreground/80">{index + 1}.</span>
                        <Link to={buildTeamLink(entry.team)} className="min-w-0 flex-1">
                          <TeamIdentity
                            name={getDisplayTeamName(entry.team)}
                            className="text-base font-semibold text-foreground"
                            contained
                            compact
                            logoBlockClassName="!border-slate-200/90 !bg-white !shadow-[0_4px_12px_rgba(15,23,42,0.06)] dark:!border-white/10 dark:!bg-white/[0.07]"
                            surfaceToneOverride="light"
                          />
                        </Link>
                      </div>
                      {usesPromotionGroups ? (
                        <div className="mt-2 pl-7">
                          {(() => {
                            const movement = getGroupMovementRule(activeStage?.name, section.group, index + 1, section.entries.length);
                            return movement ? (
                              <span className={"inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] " + movement.tone}>
                                {movement.label}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : !isStatisticsStage && activeStage.standings?.length ? (
          <div className="space-y-3">
            {(usesPromotionGroups ? completeGroupStandings : filteredStandings).map((entry, index) => {
              const tone = getOutcomeTone(entry.outcome);
              const mobileRows = usesPromotionGroups ? completeGroupStandings : filteredStandings;
              const movement = showMovementColumn ? getGroupMovementRule(activeStage?.name, currentSelectedGroup, index + 1, mobileRows.length) : null;
              const movementAccent = showMovementColumn ? getGroupMovementAccent(activeStage?.name, currentSelectedGroup, index + 1, mobileRows.length) : null;
              return (
                <div key={activeStage.name + "-" + currentSelectedGroup + "-" + entry.placement + "-" + entry.team} className={"overflow-hidden rounded-[1.35rem] border bg-background/95 shadow-sm " + (movementAccent?.cell || tone.border)}>
                  <div className="flex items-center gap-2 px-4 py-3">
                    <span className="w-5 shrink-0 text-sm font-semibold text-foreground/80">{(showMovementColumn ? index + 1 : entry.placement) + "."}</span>
                    <div className="min-w-0 flex-1">
                      <Link to={buildTeamLink(entry.fullTeam || entry.team)} className="inline-flex max-w-full">
                        <TeamIdentity
                          name={entry.fullTeam || entry.team}
                          className="text-base font-semibold text-foreground"
                          contained
                          compact
                          logoBlockClassName="!border-slate-200/90 !bg-white !shadow-[0_4px_12px_rgba(15,23,42,0.06)] dark:!border-white/10 dark:!bg-white/[0.07]"
                          surfaceToneOverride="light"
                        />
                      </Link>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-foreground">{entry.points}</p>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">pts</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 border-t border-border/55 text-center">
                    <div className="px-2 py-2.5"><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">M</p><p className="mt-1 text-sm font-semibold text-foreground">{entry.matches ?? "-"}</p></div>
                    <div className="border-l border-border/40 px-2 py-2.5"><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">WWCD</p><p className="mt-1 text-sm font-semibold text-foreground">{entry.wwcd ?? "-"}</p></div>
                    <div className="border-l border-border/40 px-2 py-2.5"><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Place</p><p className="mt-1 text-sm font-semibold text-foreground">{entry.pos ?? "-"}</p></div>
                    <div className="border-l border-border/40 px-2 py-2.5"><p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Elims</p><p className="mt-1 text-sm font-semibold text-foreground">{entry.elimins ?? "-"}</p></div>
                  </div>
                  {movement ? (<div className="border-t border-border/55 px-4 py-3"><span className={"inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] " + movement.tone}>{movement.label}</span></div>) : null}
                </div>
              );
            })}
          </div>
        ) : !isStatisticsStage ? (
          <div className="rounded-[1.35rem] border border-border bg-background/90 px-5 py-6 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Standings pending</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {bmpsWaitingStageName ? (activeStage.name + " groups will appear automatically after " + bmpsWaitingStageName + " results are added.") : (activeStage.summary || "This stage is part of the tournament flow, but standings data has not been attached yet.")}
            </p>
          </div>
        ) : null}
      </div>
    );
  }
  if (!activeStage) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background/90 p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {stageOptions.map((stage) => {
            const active = stage.name === activeStage.name;
            return (
              <button
                key={stage.name}
                type="button"
                onClick={() => {
                  dispatchStageBoardUi({
                    type: "selectStage",
                    payload: stage.name,
                  });
                }}
                className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {stage.name === "Wildcard" ? "Wildcards" : stage.name}
              </button>
            );
          })}
        </div>

        {groups.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            {(isGroupDrawStage || usesPromotionGroups) ? (
              <button
                type="button"
                onClick={() =>
                  dispatchStageBoardUi({
                    type: "selectGroup",
                    payload: "overall",
                  })
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                  currentSelectedGroup === "overall"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                Groups
              </button>
            ) : null}
            {!isGroupDrawStage && !usesPromotionGroups ? (
              <button
                type="button"
                onClick={() =>
                  dispatchStageBoardUi({
                    type: "selectGroup",
                    payload: "overall",
                  })
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                  currentSelectedGroup === "overall"
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                Overall
              </button>
            ) : null}
            {groups.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() =>
                  dispatchStageBoardUi({
                    type: "selectGroup",
                    payload: group,
                  })
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                  currentSelectedGroup === group
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                Group {group}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {activeStage.standings?.length && legendItems.length > 0 ? (
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {legendItems.map(([label, dotClass]) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`h-3.5 w-3.5 rounded ${dotClass}`} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      ) : null}

      {isStatisticsStage && !isRankingsStatisticsStage ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-border pb-3">
            {statisticsCategories.map((category) => (
              <button
                key={category.key}
                type="button"
                              onClick={() => {
                                dispatchStageBoardUi({
                                  type: "selectStatisticsCategory",
                                  payload: category.key,
                                });
                              }}
                className={`rounded-t-xl border-b-2 px-2 py-2 text-sm font-semibold transition-colors md:px-3 ${
                  currentStatisticsCategory === category.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {currentStatisticsCategory === "eliminator" ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="bg-[#165ca8] px-5 py-4 text-center">
                  <p className="text-lg font-semibold uppercase tracking-[0.08em] text-white">
                    ELIMINATOR
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3">
                  {eliminatorSubStages.map((subStage) => (
                    <button
                      key={subStage.key}
                      type="button"
                                  onClick={() =>
                                    dispatchStageBoardUi({
                                      type: "selectStatisticsSubStage",
                                      payload: subStage.key,
                                    })
                                  }
                      className={`rounded-t-xl border-b-2 px-2 py-2 text-sm font-semibold transition-colors md:px-3 ${
                        currentStatisticsSubStage === subStage.key
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {subStage.label}
                    </button>
                  ))}
                </div>
              </div>

              {currentStatisticsSubStage === "qualifier stage" ? (
                <div className="overflow-x-auto rounded-xl border border-border bg-background/90 shadow-sm">
                  <table className="w-full min-w-[1280px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        <th className="border-r border-border/60 p-4 text-left">Rank</th>
                        <th className="border-r border-border/60 p-4 text-left">Player</th>
                        <th className="border-r border-border/60 p-4 text-center">Finishes</th>
                        <th className="border-r border-border/60 p-4 text-center">FPM</th>
                        <th className="border-r border-border/60 p-4 text-center">Contribution</th>
                        <th className="border-r border-border/60 p-4 text-center">Best</th>
                        <th className="border-r border-border/60 p-4 text-center">5+</th>
                        <th className="border-r border-border/60 p-4 text-center">Matches</th>
                        <th className="border-r border-border/60 p-4 text-center">Erangel</th>
                        <th className="border-r border-border/60 p-4 text-center">Miramar</th>
                        <th className="p-4 text-center">Rondo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {statisticsTableRows.map((entry, index) => {
                        const rawTeamName =
                          entry.teamName ||
                          BMPS_2026_PLAYER_ROW_TEAM_OVERRIDES[`${entry.rank}:${entry.player}`] ||
                          BMPS_2026_PLAYER_TEAM_OVERRIDES[normalizeOrganizationName(entry.player)] ||
                          bmps2026PlayerTeams.get(normalizeOrganizationName(entry.player)) ||
                          null;
                        const teamName = rawTeamName ? getOrganizationMeta(rawTeamName).name : null;

                        return (
                          <tr
                            key={`bmps-2026-stat-${entry.rank}-${entry.player}`}
                            className={`${index % 2 === 0 ? "bg-background/70" : "bg-secondary/10"} transition-colors hover:bg-secondary/20`}
                          >
                            <td className="border-r border-border/50 p-4 font-semibold text-foreground">#{entry.rank}</td>
                            <td className="border-r border-border/50 p-4">
                              {teamName ? (
                                <Link to={buildTeamLink(teamName)} className="inline-flex items-center gap-3 font-semibold text-foreground">
                                  <TeamIdentity
                                    name={teamName}
                                    contained
                                    compact
                                    hideText
                                    logoClassName="size-5 object-contain"
                                    logoBlockClassName="!border-slate-200/90 !bg-white !shadow-[0_4px_12px_rgba(15,23,42,0.06)] dark:!border-white/10 dark:!bg-white/[0.07]"
                                  />
                                  <span className="leading-none">{entry.player}</span>
                                </Link>
                              ) : (
                                <span className="font-semibold text-foreground">{entry.player}</span>
                              )}
                            </td>
                            <td className="border-r border-border/50 p-4 text-center font-semibold text-primary">{entry.finishes}</td>
                            <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.fpm}</td>
                            <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.contribution}</td>
                            <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.best ?? "-"}</td>
                            <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.fivePlusFinishes ?? "-"}</td>
                            <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.matches}</td>
                            <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.erangel ?? "-"}</td>
                            <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.miramar ?? "-"}</td>
                            <td className="p-4 text-center font-medium text-muted-foreground">{entry.rondo ?? "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : currentStatisticsCategory === "igl" ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="bg-[#165ca8] px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="size-4 text-white" />
                    <p className="text-lg font-black uppercase tracking-[0.08em] text-white">
                      {statisticsPanelTitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-background/90 shadow-sm">
                <table className="w-full min-w-[980px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="border-r border-border/60 p-4 text-left">Rank</th>
                      <th className="border-r border-border/60 p-4 text-left">Player</th>
                      <th className="border-r border-border/60 p-4 text-center">IGL Rating</th>
                      <th className="border-r border-border/60 p-4 text-center">Team Avg. Pts.</th>
                      <th className="border-r border-border/60 p-4 text-center">WWCD</th>
                      <th className="border-r border-border/60 p-4 text-center">Top 5s</th>
                      <th className="border-r border-border/60 p-4 text-center">Team Avg. Sur.</th>
                      <th className="p-4 text-center">Matches</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {BMPS_2026_IGL_STATS.map((entry, index) => (
                      <tr
                        key={`bmps-2026-igl-${entry.rank}-${entry.player}`}
                        className={`${index % 2 === 0 ? "bg-background/70" : "bg-secondary/10"} transition-colors hover:bg-secondary/20`}
                      >
                        <td className="border-r border-border/50 p-4 font-semibold text-foreground">#{entry.rank}</td>
                        <td className="border-r border-border/50 p-4">
                          <Link to={buildTeamLink(entry.teamName)} className="inline-flex items-center gap-3 font-semibold text-foreground">
                            <TeamIdentity
                              name={entry.teamName}
                              contained
                              compact
                              hideText
                              logoClassName="size-5 object-contain"
                              logoBlockClassName="!border-slate-200/90 !bg-white !shadow-[0_4px_12px_rgba(15,23,42,0.06)] dark:!border-white/10 dark:!bg-white/[0.07]"
                            />
                            <span className="leading-none">{entry.player}</span>
                          </Link>
                        </td>
                        <td className="border-r border-border/50 p-4 text-center font-semibold text-primary">{entry.iglRating}</td>
                        <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.teamAvgPts}</td>
                        <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.wwcd}</td>
                        <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.top5s}</td>
                        <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.teamAvgSurvival}</td>
                        <td className="p-4 text-center font-medium text-muted-foreground">{entry.matches}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : currentStatisticsCategory === "mvp" ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="bg-[#165ca8] px-5 py-4 text-center">
                  <p className="text-lg font-semibold uppercase tracking-[0.08em] text-white">
                    {statisticsPanelTitle}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border bg-background/90 shadow-sm">
                <table className="w-full min-w-[1320px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="border-r border-border/60 p-4 text-left">Rank</th>
                      <th className="border-r border-border/60 p-4 text-left">Player</th>
                      <th className="border-r border-border/60 p-4 text-center">M</th>
                      <th className="border-r border-border/60 p-4 text-center">MVP Rating</th>
                      <th className="border-r border-border/60 p-4 text-center">Finishes</th>
                      <th className="border-r border-border/60 p-4 text-center">FPM</th>
                      <th className="border-r border-border/60 p-4 text-center">Damage</th>
                      <th className="border-r border-border/60 p-4 text-center">Avg. Survival</th>
                      <th className="p-4 text-center">Knocks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {BMPS_2026_MVP_STATS.map((entry, index) => (
                      <tr
                        key={`bmps-2026-mvp-${entry.rank}-${entry.player}`}
                        className={`${index % 2 === 0 ? "bg-background/70" : "bg-secondary/10"} transition-colors hover:bg-secondary/20`}
                      >
                        <td className="border-r border-border/50 p-4 font-semibold text-foreground">#{entry.rank}</td>
                        <td className="border-r border-border/50 p-4">
                          <Link to={buildTeamLink(entry.teamName)} className="inline-flex items-center gap-3 font-semibold text-foreground">
                            <TeamIdentity
                              name={entry.teamName}
                              contained
                              compact
                              hideText
                              logoClassName="size-5 object-contain"
                              logoBlockClassName="!border-slate-200/90 !bg-white !shadow-[0_4px_12px_rgba(15,23,42,0.06)] dark:!border-white/10 dark:!bg-white/[0.07]"
                            />
                            <span className="leading-none">{entry.player}</span>
                          </Link>
                        </td>
                        <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.matches}</td>
                        <td className="border-r border-border/50 p-4 text-center font-semibold text-primary">{entry.mvpRating}</td>
                        <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.finishes}</td>
                        <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.fpm}</td>
                        <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.damage}</td>
                        <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.avgSurvival}</td>
                        <td className="p-4 text-center font-medium text-muted-foreground">{entry.knocks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {isRankingsStatisticsStage ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-background/90 p-5 shadow-sm">
            <p className="text-lg font-semibold uppercase tracking-[0.08em] text-foreground">
              {activeStage?.name?.toUpperCase() || "STATISTICS"}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Tournament player and team leaderboards collected from the official stage rankings for this event.
            </p>
          </div>

          <div className="space-y-3">
            {rankings.map((ranking) => (
              <div key={ranking.title} className="rounded-xl border border-border bg-background/80 p-4 shadow-sm">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-primary">{ranking.title}</p>
                <RankingTable ranking={ranking} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!isStatisticsStage && currentSelectedGroup === "overall" && (isGroupDrawStage || usesPromotionGroups) ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="bg-[#165ca8] px-5 py-4 text-center">
            <p className="text-lg font-black uppercase tracking-[0.08em] text-white">
              {activeStage.name.toUpperCase()} GROUPS
            </p>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-[#d7e5f7] text-sm font-black uppercase tracking-[0.06em] text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                {groupedParticipants.map((section) => (
                  <th
                    key={`${activeStage.name}-${section.group}`}
                    className="border-r border-border/60 px-6 py-4 text-center last:border-r-0"
                  >
                    Group {section.group}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxGroupRows }).map((_, rowIndex) => (
                <tr
                  key={`${activeStage.name}-group-row-${rowIndex}`}
                  className="border-b border-border bg-background last:border-b-0 dark:bg-slate-950"
                >
                  {groupedParticipants.map((section) => {
                    const entry = section.entries[rowIndex];
                    return (
                      <td
                        key={`${activeStage.name}-${section.group}-${rowIndex}`}
                        className="border-r border-border/60 px-5 py-4 align-middle last:border-r-0"
                      >
                        {entry ? (
                          <Link to={buildTeamLink(entry.team)} className="inline-flex items-center gap-3">
                            <TeamIdentity
                              name={getDisplayTeamName(entry.team)}
                              className="font-semibold text-foreground"
                              contained
                              surfaceToneOverride="light"
                            />
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : !isStatisticsStage && activeStage.standings?.length ? (
      <div className="overflow-x-auto rounded-xl border border-border bg-background/90 shadow-sm">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <th className="border-r border-border/60 p-4 text-left">#</th>
              <th className="border-r border-border/60 p-4 text-left">Team</th>
              {showGroupColumn ? <th className="border-r border-border/60 p-4 text-center">Grp</th> : null}
              <th className="border-r border-border/60 p-4 text-center">M</th>
              <th className="border-r border-border/60 p-4 text-center">WWCD</th>
              <th className="border-r border-border/60 p-4 text-center">Place</th>
              <th className="border-r border-border/60 p-4 text-center">Elims</th>
              <th className="border-r border-border/60 p-4 text-center font-black text-foreground">Pts</th>
              {showMovementColumn ? <th className="p-4 text-left">Movement</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(usesPromotionGroups ? completeGroupStandings : filteredStandings).map((entry, index) => {
              const tone = getOutcomeTone(entry.outcome);
              const podiumTone = getGrandFinalsPlacementTone(activeStage.name, entry.placement);
              const movementRows = usesPromotionGroups ? completeGroupStandings : filteredStandings;
              const movement = showMovementColumn
                ? getGroupMovementRule(activeStage?.name, currentSelectedGroup, index + 1, movementRows.length)
                : null;
              const movementAccent = showMovementColumn
                ? getGroupMovementAccent(activeStage?.name, currentSelectedGroup, index + 1, movementRows.length)
                : null;
              return (
                <tr
                  key={`${activeStage.name}-${currentSelectedGroup}-${entry.placement}-${entry.team}`}
                  className={`${
                    podiumTone?.row || (index % 2 === 0 ? "bg-background/70" : "bg-secondary/10")
                  } transition-colors`}
                >
                  <td className={`border-r border-border/50 border-l-4 p-4 font-semibold ${showMovementColumn ? movementAccent?.cell : podiumTone?.border || tone.border}`}>
                    <span className={`inline-flex size-10 items-center justify-center rounded-full font-black ${showMovementColumn ? movementAccent?.rank : podiumTone?.rank || "text-foreground"}`}>
                      {showMovementColumn ? `${index + 1}` : `${entry.placement}`}
                    </span>
                  </td>
                  <td className="border-r border-border/50 p-4">
                    <Link
                      to={buildTeamLink(entry.fullTeam || entry.team)}
                      className="inline-flex items-center"
                    >
                      <TeamIdentity
                        name={entry.fullTeam || entry.team}
                        className="font-medium text-foreground"
                        contained={useContainedGroupLogos}
                        framed={!useContainedGroupLogos}
                        containerClassName="items-center gap-3"
                        logoBlockClassName="!border-slate-200/90 !bg-white !shadow-[0_4px_12px_rgba(15,23,42,0.06)] dark:!border-white/10 dark:!bg-white/[0.07]"
                        surfaceToneOverride="light"
                      />
                    </Link>
                  </td>
                  {showGroupColumn ? <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.grp ?? "-"}</td> : null}
                  <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.matches ?? "-"}</td>
                  <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.wwcd ?? "-"}</td>
                  <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.pos ?? "-"}</td>
                  <td className="border-r border-border/50 p-4 text-center font-medium text-muted-foreground">{entry.elimins ?? "-"}</td>
                  <td className={`border-r border-border/50 p-4 text-center text-lg font-black ${podiumTone?.points || "text-foreground"}`}>{entry.points}</td>
                  {showMovementColumn ? (
                    <td className="p-4">
                      {movement ? (
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${movement.tone}`}>
                          {movement.label}
                        </span>
                      ) : usesPromotionGroups ? (
                        <span className="text-sm text-muted-foreground">Hold current group</span>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      ) : !isStatisticsStage && currentSelectedGroup !== "overall" && groupParticipants.length > 0 ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-background/90 p-5 shadow-sm">
            <p className="text-lg font-semibold uppercase tracking-[0.08em] text-foreground">
              {activeStage.name.toUpperCase()} GROUPS
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {activeStage?.name === "Round 4"
                ? "Round 4 locks the group outcomes. Each group now advances independently into Grand Finals, Semi Finals, Survival Stage, or elimination."
                : "Based on weekly group standings, promotions and relegations decide movement for the next week."}
            </p>
            {activeStage?.name === "Round 4" ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group A</p>
                  <p className="mt-2 text-sm text-muted-foreground">Top 8 teams advance to Grand Finals.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Bottom 8 teams advance to Semi Finals.</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group B</p>
                  <p className="mt-2 text-sm text-muted-foreground">Top 8 teams advance to Semi Finals.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Bottom 8 teams move to Survival Stage.</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group C</p>
                  <p className="mt-2 text-sm text-muted-foreground">All 16 teams move to Survival Stage.</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group D</p>
                  <p className="mt-2 text-sm text-muted-foreground">Top 8 teams move to Survival Stage.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Bottom 8 teams are eliminated.</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group A ? B</p>
                  <p className="mt-2 text-sm text-muted-foreground">Bottom 4 from Group A move to Group B.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Top 4 from Group B move to Group A.</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group B ? C</p>
                  <p className="mt-2 text-sm text-muted-foreground">Bottom 4 from Group B move to Group C.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Top 4 from Group C move to Group B.</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group C ? D</p>
                  <p className="mt-2 text-sm text-muted-foreground">Bottom 4 from Group C move to Group D.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Top 4 from Group D move to Group C.</p>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-background/90 shadow-sm">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="border-r border-border/60 p-4 text-left">#</th>
                  <th className="border-r border-border/60 p-4 text-left">Team</th>
                  <th className="p-4 text-left">Movement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {groupParticipants.map((entry, index) => {
                  const position = index + 1;
                  const movement = getGroupMovementRule(activeStage?.name, currentSelectedGroup, position, groupParticipants.length);
                  return (
                    <tr
                      key={`${activeStage.name}-${currentSelectedGroup}-${entry.team}`}
                      className={`${index % 2 === 0 ? "bg-background/70" : "bg-secondary/10"} transition-colors hover:bg-secondary/20`}
                    >
                      <td className="border-r border-border/50 p-4 font-semibold text-foreground">{position}.</td>
                      <td className="border-r border-border/50 p-4">
                        <Link to={buildTeamLink(entry.team)} className="inline-flex">
                          <TeamIdentity
                            name={getDisplayTeamName(entry.team)}
                            className="font-semibold text-foreground"
                            contained
                            surfaceToneOverride="light"
                          />
                        </Link>
                      </td>
                      <td className="p-4">
                        {movement ? (
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${movement.tone}`}>
                            {movement.label}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Hold current group</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : !isStatisticsStage && stageParticipants.length > 0 ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-background/90 p-5 shadow-sm">
            <p className="text-lg font-semibold uppercase tracking-[0.08em] text-foreground">
              {activeStage.name.toUpperCase()} TEAMS
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Teams currently projected into this stage from completed upstream results.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stageParticipants.map((entry, index) => (
              <Link
                key={`${activeStage.name}-${entry.team}`}
                to={buildTeamLink(entry.team)}
                className="flex items-center gap-3 rounded-xl border border-border bg-background/90 p-4 shadow-sm transition hover:border-primary/40 hover:bg-secondary/20"
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground">
                  {index + 1}
                </span>
                <TeamIdentity
                  name={getDisplayTeamName(entry.team)}
                  className="font-semibold text-foreground"
                  contained
                  surfaceToneOverride="light"
                />
              </Link>
            ))}
          </div>
        </div>
      ) : !isStatisticsStage ? (
        <div className="rounded-xl border border-border bg-background/90 px-5 py-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Standings pending</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {bmpsWaitingStageName
              ? `${activeStage.name} groups will appear automatically after ${bmpsWaitingStageName} results are added.`
              : activeStage.summary || "This stage is part of the tournament flow, but standings data has not been attached yet."}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function RankingTable({ ranking }) {
  const customColumns = ranking.columns ?? null;
  const isIglTable = ranking.entries?.some((entry) => entry.avgPoints !== undefined || entry.teamSurvival);
  const isSimpleFinishesTable = ranking.entries?.every(
    (entry) =>
      entry.finishes !== undefined &&
      entry.rating === undefined &&
      entry.damage === undefined &&
      entry.avgSurvival === undefined &&
      entry.knocks === undefined &&
      entry.avgPoints === undefined &&
      entry.teamSurvival === undefined
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background/90 shadow-sm">
      <table className={`w-full border-collapse text-sm ${isSimpleFinishesTable ? "min-w-[420px]" : "min-w-[720px]"}`}>
        <thead>
          <tr className="border-b border-border bg-secondary/40 text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="border-r border-border/60 p-3 text-left">#</th>
            <th className="border-r border-border/60 p-3 text-left">Player</th>
            {customColumns ? (
              customColumns.map((column, index) => (
                <th
                  key={column.key}
                  className={`${index < customColumns.length - 1 ? "border-r border-border/60" : ""} p-3 text-center`}
                >
                  {column.label}
                </th>
              ))
            ) : isSimpleFinishesTable ? (
              <th className="p-3 text-center">Finishes</th>
            ) : (
              <th className="border-r border-border/60 p-3 text-center">Ratings</th>
            )}
            {!customColumns && !isSimpleFinishesTable && (isIglTable ? (
              <>
                <th className="border-r border-border/60 p-3 text-center">Avg. Points</th>
                <th className="border-r border-border/60 p-3 text-center">WWCD</th>
                <th className="border-r border-border/60 p-3 text-center">Top 5s</th>
                <th className="p-3 text-center">Team Surv.</th>
              </>
            ) : (
              <>
                <th className="border-r border-border/60 p-3 text-center">Finishes</th>
                <th className="border-r border-border/60 p-3 text-center">Damage</th>
                <th className="border-r border-border/60 p-3 text-center">Avg. Surv.</th>
                <th className="p-3 text-center">Knocks</th>
              </>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {ranking.entries.map((entry, index) => (
            <tr
              key={`${ranking.title}-${entry.placement}-${entry.player}`}
              className={`${index % 2 === 0 ? "bg-background/70" : "bg-secondary/10"} transition-colors hover:bg-secondary/20`}
            >
              <td className="border-r border-border/50 p-3 font-semibold text-foreground">{entry.placement}.</td>
              <td className="border-r border-border/50 p-3">
                <Link to={buildTeamLink(entry.team)} className="inline-flex items-center gap-3 font-medium text-foreground">
                  <TeamIdentity
                    name={entry.team}
                    framed
                    hideText
                    surfaceToneOverride="light"
                    logoBlockClassName="!border-slate-200/90 !bg-white !shadow-[0_4px_12px_rgba(15,23,42,0.06)] dark:!border-white/10 dark:!bg-white/[0.07]"
                  />
                  <span>{entry.player}</span>
                </Link>
              </td>
              {customColumns ? (
                customColumns.map((column, index) => (
                  <td
                    key={column.key}
                    className={`${index < customColumns.length - 1 ? "border-r border-border/50" : ""} p-3 text-center font-medium text-muted-foreground`}
                  >
                    {entry[column.key] ?? "-"}
                  </td>
                ))
              ) : isSimpleFinishesTable ? (
                <td className="p-3 text-center font-semibold text-primary">{entry.finishes}</td>
              ) : (
                <td className="border-r border-border/50 p-3 text-center font-semibold text-primary">{entry.rating}</td>
              )}
              {!customColumns && !isSimpleFinishesTable && (isIglTable ? (
                <>
                  <td className="border-r border-border/50 p-3 text-center font-medium text-muted-foreground">{entry.avgPoints ?? "-"}</td>
                  <td className="border-r border-border/50 p-3 text-center font-medium text-muted-foreground">{entry.wwcd ?? "-"}</td>
                  <td className="border-r border-border/50 p-3 text-center font-medium text-muted-foreground">{entry.top5s ?? "-"}</td>
                  <td className="p-3 text-center font-medium text-muted-foreground">{entry.teamSurvival ?? "-"}</td>
                </>
              ) : (
                <>
                  <td className="border-r border-border/50 p-3 text-center font-medium text-muted-foreground">{entry.finishes ?? "-"}</td>
                  <td className="border-r border-border/50 p-3 text-center font-medium text-muted-foreground">{entry.damage ?? "-"}</td>
                  <td className="border-r border-border/50 p-3 text-center font-medium text-muted-foreground">{entry.avgSurvival ?? "-"}</td>
                  <td className="p-3 text-center font-medium text-muted-foreground">{entry.knocks ?? "-"}</td>
                </>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function normalizeTeamName(teamName) {
  const compact = (teamName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return compact
    .replace(/gladiators/g, "gladiator")
    .replace(/dpluskia/g, "dplus")
    .replace(/iqoorevenantxspark/g, "teamxspark")
    .replace(/iqoosoul/g, "teamsoul")
    .replace(/iqoo8bit/g, "8bit")
    .replace(/teamforever/g, "numenesports")
    .replace(/heroxtremegodlike/g, "godlikeesports")
    .replace(/iqooorangutan/g, "orangutan")
    .replace(/loshermanos/g, "loshermanosesports")
    .replace(/iqoo8bit/g, "8bit")
    .replace(/infinixtruerippers/g, "truerippers")
    .replace(/oneplusgodsreign/g, "godsreign")
    .replace(/mysterious4esports/g, "mysterious4")
    .replace(/madkings/g, "madkingsesports")
    .replace(/fsesports/g, "fsesports")
    .replace(/heroxtremegodlike/g, "godlikeesports")
    .replace(/onepluscincinnatikids/g, "cincinnatikids")
    .replace(/oneplusgodsreign/g, "godsreign")
    .replace(/oneplusk9esports/g, "k9esports")
    .replace(/teaminsaneesports/g, "teaminsane")
    .replace(/truerippersxinfinix/g, "truerippers")
    .replace(/onepluscincinnatikids/g, "cincinnatikids")
    .replace(/16scorexbotarmy/g, "botarmy")
    .replace(/4everesports/g, "4everxredxross")
    .replace(/rivalryxnri/g, "rivalrynri")
    .replace(/teamh4k/g, "hadesh4k")
    .replace(/phoenixesports/g, "phoenixesports")
    .replace(/pheonixesports/g, "phoenixesports")
    .replace(/iqooteamtamilas/g, "teamtamilas")
    .replace(/iqooreckoningesports/g, "reckoningesports")
    .replace(/risinginfernoesports/g, "infernosquad")
    .replace(/teaminsane/g, "teaminsane")
    .replace(/blindesports/g, "blindesports");
}

function getChampionDisplayName(teamName) {
  const normalized = normalizeTeamName(teamName);

  if (normalized === "teamxspark") return "Team XSpark";
  if (normalized === "teamsoul") return "Team SouL";
  if (normalized === "8bit") return "8Bit";
  if (normalized === "teamtamilas") return "Team Tamilas";
  if (normalized === "reckoningesports") return "Reckoning Esports";
  if (normalized === "infernosquad") return "Inferno Squad";

  return teamName;
}

function getChampionLogoOverride(teamName) {
  const normalized = normalizeTeamName(teamName);

  if (normalized === "orangutan") return "/images/champion-iqoo-orangutan.png";
  if (normalized === "teamsoul") return "/images/champion-iqoo-soul.png";

  return null;
}

function getMatchdayBucket(match) {
  const numericDay = Number(match?.day);
  if (Number.isFinite(numericDay) && numericDay > 0) {
    return {
      key: `day-${numericDay}`,
      label: `Day ${numericDay}`,
      sortValue: numericDay,
    };
  }

  if (match?.scheduled_time) {
    const scheduled = new Date(match.scheduled_time);
    if (!Number.isNaN(scheduled.getTime())) {
      return {
        key: `date-${scheduled.toISOString().slice(0, 10)}`,
        label: format(scheduled, "MMM d, yyyy"),
        sortValue: scheduled.getTime(),
      };
    }
  }

  return {
    key: "day-unscheduled",
    label: "Unscheduled",
    sortValue: Number.MAX_SAFE_INTEGER,
  };
}

function MatchdayHub({ tournament, matches, matchResults }) {
  const dayBuckets = useMemo(() => {
    const scopedMatches = matches
      .filter((match) => match.tournament_id === tournament.id)
      .toSorted((a, b) => {
        const aDay = Number(a.day) || 9999;
        const bDay = Number(b.day) || 9999;
        if (aDay !== bDay) return aDay - bDay;

        const aMatch = Number(a.match_number) || 9999;
        const bMatch = Number(b.match_number) || 9999;
        if (aMatch !== bMatch) return aMatch - bMatch;

        return new Date(a.scheduled_time || 0).getTime() - new Date(b.scheduled_time || 0).getTime();
      });

    const resultsByMatch = new Map();
    for (const result of matchResults) {
      if (!result?.match_id) continue;
      const current = resultsByMatch.get(result.match_id) || [];
      current.push(result);
      resultsByMatch.set(result.match_id, current);
    }

    const buckets = new Map();
    for (const match of scopedMatches) {
      const bucket = getMatchdayBucket(match);
      const existing = buckets.get(bucket.key) || {
        ...bucket,
        matches: [],
      };
      existing.matches.push(match);
      buckets.set(bucket.key, existing);
    }

    return Array.from(buckets.values())
      .toSorted((a, b) => a.sortValue - b.sortValue)
      .map((bucket) => {
        const stages = new Set();
        const groups = new Set();
        const maps = new Set();
        let completedMatches = 0;
        let liveMatches = 0;
        let totalResultRows = 0;

        for (const match of bucket.matches) {
          if (match.stage) stages.add(match.stage);
          if (match.group_name) groups.add(match.group_name);
          if (match.map) maps.add(match.map);
          const rows = resultsByMatch.get(match.id) || [];
          totalResultRows += rows.length;
          if (rows.length > 0 || String(match.status || "").toLowerCase() === "completed") {
            completedMatches += 1;
          }
          if (String(match.status || "").toLowerCase() === "live") {
            liveMatches += 1;
          }
        }

        return {
          ...bucket,
          stages: [...stages],
          groups: [...groups],
          maps: [...maps],
          completedMatches,
          liveMatches,
          totalResultRows,
          matches: bucket.matches.map((match) => ({
            ...match,
            resultRows: resultsByMatch.get(match.id) || [],
          })),
        };
      });
  }, [matches, matchResults, tournament.id]);

  if (!dayBuckets.length) {
    return (
      <div className="rounded-lg border border-border bg-background/80 p-5">
        <p className="text-[10px] uppercase tracking-wider text-primary">Matchday Hub</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Matchday blocks will appear here once schedule entries are created for this tournament.
        </p>
      </div>
    );
  }

  const totalMatches = dayBuckets.reduce((sum, bucket) => sum + bucket.matches.length, 0);
  const completedMatches = dayBuckets.reduce((sum, bucket) => sum + bucket.completedMatches, 0);
  const liveMatches = dayBuckets.reduce((sum, bucket) => sum + bucket.liveMatches, 0);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-background/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-primary">Matchday Hub</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Daily schedule coverage for {tournament.name}, including live stage splits, maps, and result-entry progress.
          </p>
        </div>
        <div className="grid min-w-[220px] grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-secondary/20 p-3">
            <p className="text-[10px] uppercase tracking-wider text-primary">Days</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{dayBuckets.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/20 p-3">
            <p className="text-[10px] uppercase tracking-wider text-primary">Matches</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{completedMatches}/{totalMatches}</p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/20 p-3">
            <p className="text-[10px] uppercase tracking-wider text-primary">Live</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{liveMatches}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {dayBuckets.map((bucket) => (
          <div key={bucket.key} className="rounded-xl border border-border bg-secondary/20">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{bucket.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {bucket.matches.length} matches
                  {bucket.stages.length ? ` � ${bucket.stages.join(" / ")}` : ""}
                  {bucket.groups.length ? ` � ${bucket.groups.join(", ")}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-primary">Maps in Rotation</p>
                <p className="mt-1 text-sm text-foreground">{bucket.maps.join(" / ") || "TBA"}</p>
              </div>
            </div>

            <div className="grid gap-3 p-4">
              {bucket.matches.map((match) => {
                const enteredTeams = match.resultRows.length;
                return (
                  <div key={match.id} className="rounded-xl border border-border bg-background/80 px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Match #{match.match_number || "-"} � {match.stage || "Stage TBA"}
                          {match.group_name ? ` (${match.group_name})` : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {match.map || "Map TBA"}
                          {match.scheduled_time ? ` � ${format(new Date(match.scheduled_time), "MMM d, h:mm a")}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-primary">Result Coverage</p>
                        <p className="mt-1 text-sm text-foreground">
                          {enteredTeams > 0 ? `${enteredTeams} team rows entered` : "Awaiting results"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// eslint-disable-next-line
export default function TournamentDetail({ tournament, onBack, requestedStage = "" }) {
  const { data: teams = [] } = useQuery({
    queryKey: ["tournament-detail-teams"],
    queryFn: () => base44.entities.Team.list("-total_points", 300),
  });
  const { data: matches = [] } = useQuery({
    queryKey: ["tournament-detail-matches", tournament.id],
    queryFn: () =>
      base44.entities.Match.filter(
        { tournament_id: tournament.id },
        "-scheduled_time",
        300,
      ),
    enabled: Boolean(tournament?.id),
  });
  const { data: rawMatchResults = [] } = useQuery({
    queryKey: ["tournament-detail-match-results", tournament.id],
    queryFn: () =>
      base44.entities.MatchResult.filter(
        { tournament_id: tournament.id },
        "-created_date",
        5000,
      ),
    enabled: Boolean(tournament?.id),
  });
  const matchResults = useMemo(() => filterPublishedMatchResults(rawMatchResults), [rawMatchResults]);

  const { data: players = [] } = useQuery({
    queryKey: ["tournament-detail-players"],
    queryFn: () => base44.entities.Player.list("-total_kills", 500),
  });

  const { data: dbTransfers = [] } = useQuery({
    queryKey: ["transfer-windows"],
    queryFn: () => base44.entities.TransferWindow.list("-date", 500),
  });
  const { data: normalizedTournamentData = null } = useQuery({
    queryKey: ["tournament-normalized", tournament.id],
    queryFn: () => base44.tournaments.normalized(tournament.id),
    enabled: Boolean(tournament?.id),
  });

  const normalizedParticipants =
    normalizedTournamentData?.participants ?? EMPTY_STAGE_PARTICIPANT_ENTRIES;
  const normalizedStages =
    normalizedTournamentData?.stages ?? EMPTY_NORMALIZED_STAGES;
  const rawParticipantEntries =
    tournament.participants ?? EMPTY_STAGE_PARTICIPANT_ENTRIES;
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
      const normalizedEntries = buildNormalizedParticipantEntries(normalizedParticipants);
      if (normalizedEntries.length >= rawParticipantEntries.length) {
        return cleanEntries(normalizedEntries);
      }

      return cleanEntries(rawParticipantEntries);
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
          const normalizedStandings = Array.isArray(stage.standings) ? stage.standings : [];
          const derivedStandings = derived?.standings?.map((entry) => ({
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
            rawStandings.length > normalizedStandings.length
              ? rawStandings
              : normalizedStandings;
          const finalStandings =
            derivedStandings.length > preferredStandings.length ? derivedStandings : preferredStandings;

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

          stagesAcc.push({
            ...stage,
            name: stageName,
            standings: Array.isArray(stage.standings) ? stage.standings : [],
          });
          return stagesAcc;
        }, []);

        return mergeDisplayStages([...mergedStages, ...rawOnlyStages]);
      }

      return mergeDisplayStages(rawTournamentStages.map((stage) => {
        const stageName = getCleanStageLabel(stage.name);
        const derived = derivedStageBoards.get(stage.name) || derivedStageBoards.get(stageName);
        const derivedStandings = derived?.standings?.map((entry) => ({
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

        return {
          ...stage,
          name: stageName,
          standings: derivedStandings.length > 0 ? derivedStandings : stage.standings || [],
        };
      }));
    },
    [derivedStageBoards, normalizedParticipants, normalizedStages, rawTournamentStages]
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
      ? "/images/bgis2026-champion.jpg"
      : tournament.name === "Battlegrounds Mobile India Series 2023"
        ? "/images/bgis2023-champion.png"
      : tournament.name === "Battlegrounds Mobile India Series 2024"
        ? "/images/bgis2024-champion.jpg"
      : tournament.name === "Battlegrounds Mobile India Series 2025"
        ? "/images/bgis2025-champion.jpg"
      : tournament.name === "India - Korea Invitational"
        ? "/images/in-kr-champion.png"
      : tournament.name === "Battlegrounds Mobile India Showdown 2025"
        ? "/images/bmsd2025-champion.jpg"
      : tournament.name === "Battlegrounds Mobile India International Cup 2025"
        ? "/images/bmic2025-champion.png"
      : tournament.name === "Battlegrounds Mobile India Pro Series 2023"
        ? "/images/bmps2023-champion.jpg"
      : tournament.name === "Battlegrounds Mobile India Pro Series 2024"
        ? "/images/bmps2024-champion.jpg"
      : tournament.name === "Battlegrounds Mobile India Pro Series 2025"
        ? "/images/bmps2025-champion.jpg"
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
  const participantCount = Math.max(
    participantEntries.length || 0,
    tournament.max_teams || 0,
    16
  );
  const participantSections = useMemo(() => {
    if (tournament.name === "Battlegrounds Mobile India Pro Series 2026") {
      return [
        {
          phase: "Teams",
          entries: participantEntries,
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
      .map(([phase, entries]) => ({ phase, entries }));
  }, [participantEntries, tournament.name]);
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
  const featuredFacts = [
    {
      label: "Format",
      value: tournament.game || "BGMI",
      icon: Award,
    },
    {
      label: "Prize Pool",
      value: tournament.prize_pool || "TBA",
      icon: Award,
    },
    {
      label: "Teams",
      value: String(participantCount),
      icon: Users,
    },
    {
      label: "Stage Focus",
      value: spotlightStage?.name || tournament.status,
      icon: Calendar,
    },
  ];
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

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 size-4" /> Back to Tournaments
      </Button>

      <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
        <div className="border-b border-border bg-[linear-gradient(180deg,rgba(251,146,60,0.08),rgba(255,255,255,0))] p-6 dark:bg-[linear-gradient(180deg,rgba(251,146,60,0.12),rgba(15,23,42,0))]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {tournamentLogo && (
                <LogoBlock
                  src={tournamentLogo}
                  alt={`${tournament.name} logo`}
                  sizeClass="h-20 w-20"
                  roundedClass="rounded-md"
                  paddingClass="p-3"
                  className="!border-slate-200/90 !bg-white shadow-sm dark:!border-white/10 dark:!bg-white/[0.07]"
                />
              )}
              <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">Event profile</p>
              <h1 className="mt-2 text-3xl font-heading font-semibold tracking-wide">{tournament.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-base text-muted-foreground">
                {tournament.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-4" />
                    {format(new Date(tournament.start_date), "MMM d, yyyy")}
                  </span>
                )}
                <span className="flex items-center gap-1"><Users className="size-4" /> {participantCount} teams</span>
              </div>
              </div>
            </div>
            <StatusBadge status={tournament.status} />
          </div>
          {tournament.description && <p className="text-sm text-muted-foreground mt-4">{tournament.description}</p>}
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          {featuredFacts.map((fact) => (
            <div key={fact.label} className="rounded-[22px] border border-border bg-secondary/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{fact.label}</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.01em] text-foreground">{fact.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl">
          <div className="p-5 border-b border-border">
            <h2 className="font-heading text-sm font-semibold tracking-wider uppercase">Event Brief</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {tournament.format_overview && (
                <p className="text-sm leading-relaxed text-muted-foreground">{tournament.format_overview}</p>
              )}
              {tournament.status !== "completed" && spotlightStage?.summary && (
                <div className="rounded-xl border border-border bg-background/80 px-5 py-4">
                  <p className="text-[10px] uppercase tracking-wider text-primary">Current Stage</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {spotlightStage.summary}
                  </p>
                </div>
              )}
              {allocations.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-amber-300">International Slots</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {allocations.map((allocation) => (
                      <div
                        key={`${allocation.title}-${allocation.event}`}
                        className="rounded-xl border border-amber-500/20 bg-background/70 px-4 py-3"
                      >
                        <p className="text-[10px] uppercase tracking-wider text-amber-300">{allocation.title}</p>
                        <p className="mt-1 font-semibold text-foreground">{allocation.event}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{allocation.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="pt-4">
              <Accordion type="single" collapsible className="w-full">
              {(tournament.format_overview || tournament.calendar?.length) && (
                <AccordionItem value="format-calendar" className="mb-2 rounded-xl border border-border bg-secondary/20 px-5">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <h3 className="font-semibold text-foreground">Format and Calendar</h3>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 rounded-lg border border-border bg-background/80 p-5">
                      {tournament.rules && (
                        <div className="rounded-xl border border-border bg-secondary/20 px-5 py-4">
                          <p className="text-[10px] uppercase tracking-wider text-primary">Rules</p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tournament.rules}</p>
                        </div>
                      )}
                      {tournament.calendar?.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-3">
                          {tournament.calendar.map((item) => (
                            <div key={`${item.week}-${item.label}`} className="rounded-xl border border-border bg-secondary/20 px-5 py-4">
                              <p className="text-xs uppercase tracking-wider text-primary">{item.week}</p>
                              <p className="mt-1 font-semibold text-foreground">{getCleanStageLabel(item.label)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {stageDetails.length > 0 && (
                        <div className="space-y-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-primary">Stage Breakdown</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              Complete stage notes for this tournament, including team counts and standings coverage.
                            </p>
                          </div>
                          <div className="grid gap-3">
                            {stageDetails.map((stage) => (
                              <div key={stage.name} className="rounded-xl border border-border bg-secondary/20 px-5 py-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-foreground">{stage.name}</p>
                                    <p className="mt-1 text-xs uppercase tracking-wider text-primary">
                                      {stage.calendarWeek || "Schedule not listed"}
                                    </p>
                                  </div>
                                  <span className="inline-flex rounded-full bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    {stage.teamCount ?? stage.standings?.length ?? 0} teams
                                  </span>
                                </div>
                                {stage.summary ? (
                                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{stage.summary}</p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {tournament.prize_breakdown?.length > 0 && (
                <AccordionItem value="prize-pool" className="mb-2 rounded-xl border border-border bg-secondary/20 px-5">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <h3 className="font-semibold text-foreground">Prize Pool</h3>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="overflow-x-auto rounded-lg border border-border bg-background/80">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-wider text-muted-foreground">
                            <th className="px-4 py-3 text-left">Place</th>
                            <th className="px-4 py-3 text-left">Team</th>
                            <th className="px-4 py-3 text-right">INR</th>
                            <th className="px-4 py-3 text-right">USD</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {tournament.prize_breakdown.map((entry) => (
                            <tr key={`${entry.placement}-${entry.team}`} className="hover:bg-secondary/20">
                              <td className="px-4 py-3 font-semibold">{entry.placement}</td>
                              <td className="px-4 py-3">
                                <Link to={buildTeamLink(entry.team)} className="inline-flex items-center">
                                  <TeamIdentity name={entry.team} className="text-sm text-foreground" hideText />
                                  <span className="ml-2 text-sm text-foreground">{getDisplayTeamName(entry.team)}</span>
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-right text-primary font-semibold">INR {entry.inr}</td>
                              <td className="px-4 py-3 text-right text-muted-foreground">${entry.usd}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {participantEntries.length > 0 && (
                <AccordionItem value="participants" className="rounded-xl border border-border bg-secondary/20 px-5">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <h3 className="font-semibold text-foreground">Participants</h3>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6">
                      {participantSections.map((section) => (
                        <div key={section.phase} className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.18em] text-primary">{section.phase}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{section.entries.length} teams</p>
                            </div>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {section.entries.map((entry) => (
                              <ParticipantRosterCard
                                key={`${entry.placement}-${entry.team}`}
                                entry={entry}
                                liveParticipantRosters={liveParticipantRosters}
                                tournamentStatus={tournament.status}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {tournament.awards?.length > 0 && (
                <AccordionItem value="awards" className="mt-2 rounded-xl border border-border bg-secondary/20 px-5">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <h3 className="font-semibold text-foreground">Awards</h3>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      {tournament.awards.map((award) => (
                        <div key={`${award.title}-${award.team}`} className="rounded-xl border border-border bg-background/80 px-4 py-3">
                          <p className="text-[10px] uppercase tracking-wider text-primary">{award.title}</p>
                          <p className="mt-1 font-semibold text-foreground">{award.player}</p>
                          <Link to={buildTeamLink(award.team)} className="inline-flex">
                            <TeamIdentity name={getDisplayTeamName(award.team)} className="text-sm text-muted-foreground" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {rankings.length > 0 && !useIntegratedRankingsStage && (
                <AccordionItem value="rankings" className="mt-2 rounded-xl border border-border bg-secondary/20 px-5">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <h3 className="font-semibold text-foreground">Rankings</h3>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {rankings.map((ranking) => (
                        <div key={ranking.title} className="rounded-xl border border-border bg-background/80 p-4">
                          <p className="mb-3 text-[10px] uppercase tracking-wider text-primary">{ranking.title}</p>
                          <RankingTable ranking={ranking} />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              </Accordion>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl">
          <div className="p-5 border-b border-border">
            <h2 className="font-heading text-sm font-semibold tracking-wider uppercase">Champion</h2>
          </div>
          <div className="p-5 space-y-4">
            {championEntry && (
              <div className="overflow-hidden rounded-xl shadow-sm outline-none [&_*]:outline-none">
                {championImageSrc && (
                  <div className="p-2">
                    <img
                      src={championImageSrc}
                      alt={`${championEntry.fullTeam || championEntry.team} champion celebration`}
                      className="aspect-[4/5] w-full rounded-md object-cover object-top"
                    />
                  </div>
                )}
                <div className="space-y-4 px-5 pb-5 text-center">
                  <div className="space-y-3">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#f4c400]">Winning Team</p>
                    <div className="flex justify-center pt-1">
                      {championLogoOverride ? (
                        <div className="flex items-center justify-center rounded-[1.25rem] bg-[#111317] px-5 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_18px_40px_rgba(244,196,0,0.14)]">
                          <img
                            src={championLogoOverride}
                            alt={`${championTeamName} champion logo`}
                            className="h-24 w-auto object-contain"
                          />
                        </div>
                      ) : (
                        <TeamIdentity
                          name={championTeamName}
                          className="text-4xl font-heading font-bold tracking-wide text-[#f4c400]"
                          compact
                          glowed
                          hideText
                          logoClassName="h-24 w-auto object-contain"
                        />
                      )}
                    </div>
                    <p className="text-4xl font-heading font-bold tracking-wide text-[#f4c400]">{championDisplayName}</p>
                  </div>
                  {championRoster?.length ? (
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {championRoster.join(" / ")}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasStageProgression && (
        <div className="rounded-[1.75rem] bg-transparent md:rounded-xl md:border md:border-border md:bg-card">
          <div className="space-y-4 p-0 md:p-5">
                <StageStandingsBoard
                  stages={stageBoardStages}
                  participantEntries={participantEntries}
                  tournamentName={tournament.name}
                  tournamentId={tournament.id}
                  teams={teams}
                  players={players}
                  matches={calendarMatches}
                  matchResults={matchResults}
                  requestedStage={requestedStage}
                  rankings={useIntegratedRankingsStage ? rankings : []}
                />
          </div>
        </div>
      )}

    </div>
  );
}





