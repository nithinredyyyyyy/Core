import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calendar, Users, Award } from "lucide-react";
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
import { getStageBoardData } from "@/lib/stageBoard";

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
  if (tournament.name === "Battlegrounds Mobile India Pro Series 2025") {
    return [
      {
        title: "Champion Slot",
        event: "PUBG Mobile World Cup 2025",
        detail: "Champion qualifies for PMWC 2025.",
      },
    ];
  }

  if (tournament.name === "Battlegrounds Mobile India Showdown 2025") {
    return [
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
    ];
  }

  if (tournament.name === "Battlegrounds Mobile India International Cup 2025") {
    return [
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
    ];
  }

  return tournament.allocations ?? [];
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

function getGroupMovementRule(group, position, totalTeams) {
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

function getGroupMovementAccent(group, position, totalTeams) {
  const movement = getGroupMovementRule(group, position, totalTeams);
  if (!movement) {
    return {
      cell: "border-l-slate-300 dark:border-l-slate-700",
      rank: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    };
  }

  if (movement.label.includes("Promotion")) {
    return {
      cell: "border-l-emerald-500",
      rank: "bg-emerald-500 text-white",
    };
  }

  return {
    cell: "border-l-red-500",
    rank: "bg-red-500 text-white",
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
    const orderedStageEntries = [...stageEntries].sort((a, b) => {
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
      players: (participant.players || []).map((player) => player.player_name).filter(Boolean),
      roster: (participant.players || []).map((player) => ({
        name: player.player_name,
        country: player.country || "India",
        role: player.role || null,
        captain: Boolean(player.is_captain),
        substitute: Boolean(player.is_substitute),
      })),
      seed: participant.seed ?? null,
      badges: [],
      invite_status: participant.invite_status || null,
    };
  });
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

function StageStandingsBoard({ stages, participantEntries = [], tournamentName, tournamentId, teams = [], matches = [], matchResults = [] }) {
  const stageOptions = useMemo(
    () =>
      stages
        .filter((stage) => stage.name && (stage.standings?.length || stage.summary || stage.teamCount))
        .map((stage) => ({
          ...stage,
          standings: [...(stage.standings || [])].sort((a, b) => (a.placement ?? 999) - (b.placement ?? 999)),
        })),
    [stages]
  );
  const stageOptionsKey = useMemo(
    () => stageOptions.map((stage) => `${stage.name}:${stage.standings?.length || 0}`).join("|"),
    [stageOptions]
  );
  const [selectedStage, setSelectedStage] = useState(stageOptions[0]?.name || "");
  const [selectedGroup, setSelectedGroup] = useState("overall");

  useEffect(() => {
    setSelectedStage(stageOptions[0]?.name || "");
    setSelectedGroup("overall");
  }, [stageOptionsKey]);

  const activeStage = stageOptions.find((stage) => stage.name === selectedStage) || stageOptions[0] || null;
  const isGrandFinalsStage = String(activeStage?.name || "").trim().toLowerCase() === "grand finals";
  const groups = useMemo(() => {
    if (!activeStage) return [];
    if (String(activeStage.name || "").trim().toLowerCase() === "grand finals") return [];
    const standingsGroups = (activeStage.standings || []).map((entry) => entry.grp).filter(Boolean);
    const participantGroups = participantEntries
      .map((entry) => {
        const match = String(entry.phase || "").match(/^(.+?)\s*-\s*Group\s+([A-Z])$/i);
        if (!match) return null;
        return match[1].trim().toLowerCase() === String(activeStage.name || "").trim().toLowerCase()
          ? match[2].toUpperCase()
          : null;
      })
      .filter(Boolean);

    return [...new Set([...standingsGroups, ...participantGroups])].sort();
  }, [activeStage, participantEntries]);

  useEffect(() => {
    if (selectedGroup !== "overall" && !groups.includes(selectedGroup)) {
      setSelectedGroup("overall");
    }
  }, [groups, selectedGroup]);

  const filteredStandings = useMemo(() => {
    if (!activeStage) return [];
    if (selectedGroup === "overall") return activeStage.standings || [];
    return (activeStage.standings || []).filter((entry) => entry.grp === selectedGroup);
  }, [activeStage, selectedGroup]);
  const groupParticipants = useMemo(() => {
    if (!activeStage || selectedGroup === "overall") return [];
    const expectedPhase = `${activeStage.name} - Group ${selectedGroup}`.toLowerCase();
    return participantEntries.filter((entry) => String(entry.phase || "").toLowerCase() === expectedPhase);
  }, [activeStage, participantEntries, selectedGroup]);
  const groupedParticipants = useMemo(() => {
    if (!activeStage || groups.length === 0) return [];
    return groups.map((group) => ({
      group,
      entries: participantEntries.filter(
        (entry) =>
          String(entry.phase || "").toLowerCase() === `${activeStage.name} - Group ${group}`.toLowerCase()
      ),
    }));
  }, [activeStage, groups, participantEntries]);
  const maxGroupRows = useMemo(
    () => Math.max(0, ...groupedParticipants.map((section) => section.entries.length)),
    [groupedParticipants]
  );
  const usesPromotionGroups =
    tournamentName === "Battlegrounds Mobile India Pro Series 2026" &&
    activeStage?.name === "Round 1" &&
    groups.length > 0;
  const isGroupDrawStage = groupedParticipants.length > 0 && !activeStage?.standings?.length;
  const completeGroupStandings = useMemo(() => {
    if (!usesPromotionGroups || selectedGroup === "overall") return filteredStandings;
    const selectedGroupMatchIds = new Set(
      matches
        .filter(
          (match) =>
            match.tournament_id === tournamentId &&
            match.stage === activeStage?.name &&
            String(match.group_name || "").trim().toLowerCase() === `group ${selectedGroup}`.toLowerCase()
        )
        .map((match) => match.id)
    );
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
        grp: selectedGroup,
        matches: 0,
        wwcd: 0,
        pos: 0,
        elimins: 0,
        points: 0,
      };

      const wins = result.wins_count && result.wins_count > 0 ? result.wins_count : result.placement === 1 ? 1 : 0;
      existing.matches += result.matches_count || 1;
      existing.wwcd += wins;
      existing.pos += result.placement_points || 0;
      existing.elimins += result.kill_points || 0;
      existing.points += result.total_points || 0;

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
          grp: selectedGroup,
        };
      }

      return {
        placement: null,
        team: entry.team,
        fullTeam: entry.team,
        grp: selectedGroup,
        matches: 0,
        wwcd: 0,
        pos: 0,
        elimins: 0,
        points: 0,
      };
    });

    return completeRows.sort((a, b) => {
      if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
      if ((b.wwcd || 0) !== (a.wwcd || 0)) return (b.wwcd || 0) - (a.wwcd || 0);
      if ((b.elimins || 0) !== (a.elimins || 0)) return (b.elimins || 0) - (a.elimins || 0);
      if ((b.pos || 0) !== (a.pos || 0)) return (b.pos || 0) - (a.pos || 0);
      return String(a.fullTeam || a.team).localeCompare(String(b.fullTeam || b.team));
    });
  }, [usesPromotionGroups, selectedGroup, filteredStandings, groupParticipants, matches, matchResults, teams, tournamentId, activeStage]);

  useEffect(() => {
    if (isGroupDrawStage && selectedGroup === "overall" && groups.length > 0) {
      return;
    }
    if (usesPromotionGroups && selectedGroup === "overall" && groups.length > 0) {
      return;
    }
    if ((isGroupDrawStage || usesPromotionGroups) && !selectedGroup && groups.length > 0) {
      setSelectedGroup(groups[0]);
    }
  }, [isGroupDrawStage, usesPromotionGroups, selectedGroup, groups]);

  const showGroupColumn = !isGrandFinalsStage && !usesPromotionGroups && selectedGroup === "overall" && groups.length > 1;
  const legendItems = useMemo(() => {
    if (usesPromotionGroups) return [];
    const seen = new Map();
    for (const entry of activeStage?.standings || []) {
      const tone = getOutcomeTone(entry.outcome);
      if (activeStage?.name === "Grand Finals" && tone.label === "Stage result") {
        continue;
      }
      if (!seen.has(tone.label)) seen.set(tone.label, tone.dot);
    }
    return [...seen.entries()];
  }, [activeStage]);

  if (!activeStage) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {stageOptions.map((stage) => {
          const active = stage.name === activeStage.name;
          return (
            <button
              key={stage.name}
              type="button"
              onClick={() => {
                setSelectedStage(stage.name);
                setSelectedGroup("overall");
              }}
              className={`rounded-t-xl border-b-2 px-2 py-2 text-sm font-semibold transition-colors md:px-3 ${
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {stage.name === "Wildcard" ? "Wildcards" : stage.name === "Survival Stage" ? "Survivals Stage" : stage.name}
            </button>
          );
        })}
      </div>

      {groups.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {(isGroupDrawStage || usesPromotionGroups) ? (
            <button
              type="button"
              onClick={() => setSelectedGroup("overall")}
              className={`rounded-t-xl border-b-2 px-2 py-2 text-sm font-semibold transition-colors md:px-3 ${
                selectedGroup === "overall" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Groups
            </button>
          ) : null}
          {!isGroupDrawStage && !usesPromotionGroups ? (
            <button
              type="button"
              onClick={() => setSelectedGroup("overall")}
              className={`rounded-t-xl border-b-2 px-2 py-2 text-sm font-semibold transition-colors md:px-3 ${
                selectedGroup === "overall" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Overall
            </button>
          ) : null}
          {groups.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setSelectedGroup(group)}
              className={`rounded-t-xl border-b-2 px-2 py-2 text-sm font-semibold transition-colors md:px-3 ${
                selectedGroup === group ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Group {group}
            </button>
          ))}
        </div>
      ) : null}

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

      {selectedGroup === "overall" && (isGroupDrawStage || usesPromotionGroups) ? (
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
      ) : activeStage.standings?.length ? (
      <div className="overflow-x-auto rounded-xl border border-border bg-background/90 shadow-sm">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <th className="border-r border-border/60 px-4 py-4 text-left">#</th>
              <th className="border-r border-border/60 px-4 py-4 text-left">Team</th>
              {showGroupColumn ? <th className="border-r border-border/60 px-4 py-4 text-center">Grp</th> : null}
              <th className="border-r border-border/60 px-4 py-4 text-center">M</th>
              <th className="border-r border-border/60 px-4 py-4 text-center">WWCD</th>
              <th className="border-r border-border/60 px-4 py-4 text-center">Place</th>
              <th className="border-r border-border/60 px-4 py-4 text-center">Elims</th>
              <th className="border-r border-border/60 px-4 py-4 text-center font-black text-foreground">Pts</th>
              {usesPromotionGroups ? <th className="px-4 py-4 text-left">Movement</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(usesPromotionGroups ? completeGroupStandings : filteredStandings).map((entry, index) => {
              const tone = getOutcomeTone(entry.outcome);
              const podiumTone = getGrandFinalsPlacementTone(activeStage.name, entry.placement);
              const movement = usesPromotionGroups
                ? getGroupMovementRule(selectedGroup, index + 1, completeGroupStandings.length)
                : null;
              const movementAccent = usesPromotionGroups
                ? getGroupMovementAccent(selectedGroup, index + 1, completeGroupStandings.length)
                : null;
              return (
                <tr
                  key={`${activeStage.name}-${selectedGroup}-${entry.placement}-${entry.team}`}
                  className={`${
                    podiumTone?.row || (index % 2 === 0 ? "bg-background/70" : "bg-secondary/10")
                  } transition-colors`}
                >
                  <td className={`border-r border-border/50 border-l-4 px-4 py-4 font-semibold ${usesPromotionGroups ? movementAccent?.cell : podiumTone?.border || tone.border}`}>
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full font-black ${usesPromotionGroups ? movementAccent?.rank : podiumTone?.rank || "text-foreground"}`}>
                      {usesPromotionGroups ? `${index + 1}` : `${entry.placement}`}
                    </span>
                  </td>
                  <td className="border-r border-border/50 px-4 py-4">
                    <Link
                      to={buildTeamLink(entry.fullTeam || entry.team)}
                      className="inline-flex items-center"
                    >
                      <TeamIdentity
                        name={entry.fullTeam || entry.team}
                        className="font-medium text-foreground"
                        framed
                        containerClassName="items-center gap-3"
                      />
                    </Link>
                  </td>
                  {showGroupColumn ? <td className="border-r border-border/50 px-4 py-4 text-center font-medium text-muted-foreground">{entry.grp ?? "-"}</td> : null}
                  <td className="border-r border-border/50 px-4 py-4 text-center font-medium text-muted-foreground">{entry.matches ?? "-"}</td>
                  <td className="border-r border-border/50 px-4 py-4 text-center font-medium text-muted-foreground">{entry.wwcd ?? "-"}</td>
                  <td className="border-r border-border/50 px-4 py-4 text-center font-medium text-muted-foreground">{entry.pos ?? "-"}</td>
                  <td className="border-r border-border/50 px-4 py-4 text-center font-medium text-muted-foreground">{entry.elimins ?? "-"}</td>
                  <td className={`border-r border-border/50 px-4 py-4 text-center text-lg font-black ${podiumTone?.points || "text-foreground"}`}>{entry.points}</td>
                  {usesPromotionGroups ? (
                    <td className="px-4 py-4">
                      {movement ? (
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${movement.tone}`}>
                          {movement.label}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Hold current group</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      ) : selectedGroup !== "overall" && groupParticipants.length > 0 ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-background/90 px-5 py-5 shadow-sm">
            <p className="text-lg font-black uppercase tracking-[0.08em] text-foreground">
              {activeStage.name.toUpperCase()} GROUPS
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Based on weekly group standings, promotions and relegations decide movement for the next week.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-secondary/20 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group A ↔ B</p>
                <p className="mt-2 text-sm text-muted-foreground">Bottom 4 from Group A move to Group B.</p>
                <p className="mt-1 text-sm text-muted-foreground">Top 4 from Group B move to Group A.</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/20 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group B ↔ C</p>
                <p className="mt-2 text-sm text-muted-foreground">Bottom 4 from Group B move to Group C.</p>
                <p className="mt-1 text-sm text-muted-foreground">Top 4 from Group C move to Group B.</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/20 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">Group C ↔ D</p>
                <p className="mt-2 text-sm text-muted-foreground">Bottom 4 from Group C move to Group D.</p>
                <p className="mt-1 text-sm text-muted-foreground">Top 4 from Group D move to Group C.</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-background/90 shadow-sm">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="border-r border-border/60 px-4 py-4 text-left">#</th>
                  <th className="border-r border-border/60 px-4 py-4 text-left">Team</th>
                  <th className="px-4 py-4 text-left">Movement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {groupParticipants.map((entry, index) => {
                  const position = index + 1;
                  const movement = getGroupMovementRule(selectedGroup, position, groupParticipants.length);
                  return (
                    <tr
                      key={`${activeStage.name}-${selectedGroup}-${entry.team}`}
                      className={`${index % 2 === 0 ? "bg-background/70" : "bg-secondary/10"} transition-colors hover:bg-secondary/20`}
                    >
                      <td className="border-r border-border/50 px-4 py-4 font-semibold text-foreground">{position}.</td>
                      <td className="border-r border-border/50 px-4 py-4">
                        <Link to={buildTeamLink(entry.team)} className="inline-flex">
                          <TeamIdentity
                            name={getDisplayTeamName(entry.team)}
                            className="font-semibold text-foreground"
                          />
                        </Link>
                      </td>
                      <td className="px-4 py-4">
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
      ) : (
        <div className="rounded-xl border border-border bg-background/90 px-5 py-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Standings pending</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {activeStage.summary || "This stage is part of the tournament flow, but standings data has not been attached yet."}
          </p>
        </div>
      )}
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
            <th className="border-r border-border/60 px-3 py-3 text-left">#</th>
            <th className="border-r border-border/60 px-3 py-3 text-left">Player</th>
            {customColumns ? (
              customColumns.map((column, index) => (
                <th
                  key={column.key}
                  className={`${index < customColumns.length - 1 ? "border-r border-border/60" : ""} px-3 py-3 text-center`}
                >
                  {column.label}
                </th>
              ))
            ) : isSimpleFinishesTable ? (
              <th className="px-3 py-3 text-center">Finishes</th>
            ) : (
              <th className="border-r border-border/60 px-3 py-3 text-center">Ratings</th>
            )}
            {!customColumns && !isSimpleFinishesTable && (isIglTable ? (
              <>
                <th className="border-r border-border/60 px-3 py-3 text-center">Avg. Points</th>
                <th className="border-r border-border/60 px-3 py-3 text-center">WWCD</th>
                <th className="border-r border-border/60 px-3 py-3 text-center">Top 5s</th>
                <th className="px-3 py-3 text-center">Team Surv.</th>
              </>
            ) : (
              <>
                <th className="border-r border-border/60 px-3 py-3 text-center">Finishes</th>
                <th className="border-r border-border/60 px-3 py-3 text-center">Damage</th>
                <th className="border-r border-border/60 px-3 py-3 text-center">Avg. Surv.</th>
                <th className="px-3 py-3 text-center">Knocks</th>
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
              <td className="border-r border-border/50 px-3 py-3 font-semibold text-foreground">{entry.placement}.</td>
              <td className="border-r border-border/50 px-3 py-3">
                <p className="font-medium text-foreground">{entry.player}</p>
                <Link to={buildTeamLink(entry.team)} className="inline-flex items-center">
                  <TeamIdentity name={entry.team} className="text-xs text-muted-foreground" framed hideText />
                  <span className="ml-2 text-xs text-muted-foreground">{getDisplayTeamName(entry.team)}</span>
                </Link>
              </td>
              {customColumns ? (
                customColumns.map((column, index) => (
                  <td
                    key={column.key}
                    className={`${index < customColumns.length - 1 ? "border-r border-border/50" : ""} px-3 py-3 text-center font-medium text-muted-foreground`}
                  >
                    {entry[column.key] ?? "-"}
                  </td>
                ))
              ) : isSimpleFinishesTable ? (
                <td className="px-3 py-3 text-center font-semibold text-primary">{entry.finishes}</td>
              ) : (
                <td className="border-r border-border/50 px-3 py-3 text-center font-semibold text-primary">{entry.rating}</td>
              )}
              {!customColumns && !isSimpleFinishesTable && (isIglTable ? (
                <>
                  <td className="border-r border-border/50 px-3 py-3 text-center font-medium text-muted-foreground">{entry.avgPoints ?? "-"}</td>
                  <td className="border-r border-border/50 px-3 py-3 text-center font-medium text-muted-foreground">{entry.wwcd ?? "-"}</td>
                  <td className="border-r border-border/50 px-3 py-3 text-center font-medium text-muted-foreground">{entry.top5s ?? "-"}</td>
                  <td className="px-3 py-3 text-center font-medium text-muted-foreground">{entry.teamSurvival ?? "-"}</td>
                </>
              ) : (
                <>
                  <td className="border-r border-border/50 px-3 py-3 text-center font-medium text-muted-foreground">{entry.finishes ?? "-"}</td>
                  <td className="border-r border-border/50 px-3 py-3 text-center font-medium text-muted-foreground">{entry.damage ?? "-"}</td>
                  <td className="border-r border-border/50 px-3 py-3 text-center font-medium text-muted-foreground">{entry.avgSurvival ?? "-"}</td>
                  <td className="px-3 py-3 text-center font-medium text-muted-foreground">{entry.knocks ?? "-"}</td>
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
      .sort((a, b) => {
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

    return [...buckets.values()]
      .sort((a, b) => a.sortValue - b.sortValue)
      .map((bucket) => {
        const stages = new Set();
        const groups = new Set();
        const maps = [];
        let completedMatches = 0;
        let liveMatches = 0;
        let totalResultRows = 0;

        for (const match of bucket.matches) {
          if (match.stage) stages.add(match.stage);
          if (match.group_name) groups.add(match.group_name);
          if (match.map && !maps.includes(match.map)) maps.push(match.map);
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
          maps,
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
                  {bucket.stages.length ? ` · ${bucket.stages.join(" / ")}` : ""}
                  {bucket.groups.length ? ` · ${bucket.groups.join(", ")}` : ""}
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
                          Match #{match.match_number || "-"} · {match.stage || "Stage TBA"}
                          {match.group_name ? ` (${match.group_name})` : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {match.map || "Map TBA"}
                          {match.scheduled_time ? ` · ${format(new Date(match.scheduled_time), "MMM d, h:mm a")}` : ""}
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

export default function TournamentDetail({ tournament, onBack }) {
  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list("-total_points", 300),
  });
  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("scheduled_time", 500),
  });
  const { data: matchResults = [] } = useQuery({
    queryKey: ["match-results"],
    queryFn: () => base44.entities.MatchResult.list("-created_date", 5000),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
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

  const normalizedParticipants = normalizedTournamentData?.participants || [];
  const normalizedStages = normalizedTournamentData?.stages || [];
  const rawParticipantEntries = tournament.participants || [];

  const participantEntries = useMemo(() => {
    if (normalizedParticipants.length > 0) {
      const normalizedEntries = buildNormalizedParticipantEntries(normalizedParticipants);
      if (normalizedEntries.length >= rawParticipantEntries.length) {
        return normalizedEntries;
      }

      return rawParticipantEntries;
    }

    return rawParticipantEntries;
  }, [normalizedParticipants, rawParticipantEntries]);

  const rankings = tournament.rankings ?? [];
  const tournamentLogo = getTournamentLogo(tournament);
  const allocations = getTournamentAllocations(tournament);
  const derivedStageBoards = useMemo(() => {
    const map = new Map();
    const sourceStages = normalizedStages.length > 0 ? normalizedStages : (tournament.stages || []);
    for (const stage of sourceStages) {
      if (!stage?.name) continue;
      map.set(
        stage.name,
        getStageBoardData({
          featuredTournament: tournament,
          teams,
          matches,
          matchResults,
          requestedStage: stage.name,
        })
      );
    }
    return map;
  }, [normalizedStages, tournament, teams, matches, matchResults]);
  const stageBoardStages = useMemo(
    () => {
      if (normalizedStages.length > 0) {
        const normalizedBoardStages = buildNormalizedStageBoardStages(normalizedStages, normalizedParticipants);
        const rawStageMap = new Map((tournament.stages || []).map((stage) => [stage.name, stage]));
        const mergedStages = normalizedBoardStages.map((stage) => {
          const rawStage = rawStageMap.get(stage.name);
          const rawStandings = Array.isArray(rawStage?.standings) ? rawStage.standings : [];
          const normalizedStandings = Array.isArray(stage.standings) ? stage.standings : [];
          const preferredStandings = rawStandings.length > normalizedStandings.length ? rawStandings : normalizedStandings;

          return {
            ...stage,
            summary: stage.summary || rawStage?.summary || "",
            teamCount: Math.max(stage.teamCount || 0, rawStage?.teamCount || 0, preferredStandings.length || 0),
            standings: preferredStandings,
          };
        });

        const normalizedNames = new Set(mergedStages.map((stage) => stage.name));
        const rawOnlyStages = (tournament.stages || [])
          .filter((stage) => stage?.name && !normalizedNames.has(stage.name))
          .map((stage) => ({
            ...stage,
            standings: Array.isArray(stage.standings) ? stage.standings : [],
          }));

        return [...mergedStages, ...rawOnlyStages];
      }

      return (tournament.stages || []).map((stage) => {
        const derived = derivedStageBoards.get(stage.name);
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
          standings: derivedStandings.length > 0 ? derivedStandings : stage.standings || [],
        };
      });
    },
    [normalizedStages, normalizedParticipants, tournament.stages, derivedStageBoards]
  );
  const hasStageProgression = stageBoardStages.some((stage) => stage.summary || stage.standings?.length);
  const spotlightStage =
    stageBoardStages.find((stage) => stage.summary || stage.standings?.length) || null;
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
  const participantCount = participantEntries.length || tournament.max_teams || 16;
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
      const phase = entry.phase || "Participants";
      if (!sections.has(phase)) {
        sections.set(phase, []);
      }
      sections.get(phase).push(entry);
    }

    return [...sections.entries()]
      .sort((a, b) => {
        const orderDiff = getOrder(a[0]) - getOrder(b[0]);
        if (orderDiff !== 0) return orderDiff;
        return a[0].localeCompare(b[0]);
      })
      .map(([phase, entries]) => ({ phase, entries }));
  }, [participantEntries, tournament.name]);
  const liveParticipantRosters = useMemo(() => {
    const rosterMap = {};

    for (const participant of participantEntries) {
      const normalizedKey = normalizeOrganizationName(participant.team);
      const participantTeamIds = teams
        .filter((team) => normalizeOrganizationName(team.name) === normalizedKey)
        .map((team) => team.id);

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
      (tournament.calendar || []).map((item) => [item.label, item.week])
    );

    return stageBoardStages
      .filter((stage) => stage.summary || stage.standings?.length || stage.teamCount)
      .map((stage) => ({
        ...stage,
        calendarWeek: calendarByLabel.get(stage.name) || null,
      }));
  }, [tournament.calendar, stageBoardStages]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tournaments
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
                  roundedClass="rounded-xl"
                  paddingClass="p-3"
                  className="bg-[#0d0d0f] shadow-sm"
                />
              )}
              <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">Event profile</p>
              <h1 className="mt-2 text-3xl font-heading font-bold tracking-wide">{tournament.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-base text-muted-foreground">
                {tournament.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(tournament.start_date), "MMM d, yyyy")}
                  </span>
                )}
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {participantCount} teams</span>
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
            <h2 className="font-heading text-sm font-bold tracking-wider uppercase">Event Brief</h2>
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
                              <p className="mt-1 font-semibold text-foreground">{item.label}</p>
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

              <AccordionItem value="matchday-hub" className="mb-2 rounded-xl border border-border bg-secondary/20 px-5">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <h3 className="font-semibold text-foreground">Matchday Hub</h3>
                </AccordionTrigger>
                <AccordionContent>
                  <MatchdayHub tournament={tournament} matches={matches} matchResults={matchResults} />
                </AccordionContent>
              </AccordionItem>

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
                              <div key={`${entry.placement}-${entry.team}`} className="rounded-xl border border-border bg-background/80 p-4">
                                {(() => {
                                  const liveRoster = liveParticipantRosters[normalizeOrganizationName(entry.team)] || [];
                                  const displayRoster =
                                    tournament.status === "completed"
                                      ? entry.players || []
                                      : liveRoster.length > 0
                                        ? liveRoster
                                        : entry.players || [];

                                  return (
                                    <>
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
                                    </>
                                  );
                                })()}
                              </div>
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

              {rankings.length > 0 && (
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
            <h2 className="font-heading text-sm font-bold tracking-wider uppercase">Champion</h2>
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
        <div className="bg-card border border-border rounded-xl">
          <div className="p-5 border-b border-border">
            <h2 className="font-heading text-sm font-bold tracking-wider uppercase">Tournament Stages & Results</h2>
          </div>
          <div className="space-y-4 p-3 md:p-5">
            <StageStandingsBoard
              stages={stageBoardStages}
              participantEntries={participantEntries}
              tournamentName={tournament.name}
              tournamentId={tournament.id}
              teams={teams}
              matches={matches}
              matchResults={matchResults}
            />
          </div>
        </div>
      )}

    </div>
  );
}


