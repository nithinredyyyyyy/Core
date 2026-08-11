import { normalizeOrganizationName } from "@/lib/organizationIdentity";
import { HIDDEN_PARTICIPANT_PHASE_LABELS } from "@/features/tournaments/constants";

export function getCleanStageLabel(label) {
  const value = String(label || "").trim();
  if (!value) return value;
  return value
    .replace(/\bSemi Finals Week 1\b/gi, "Semi Finals 1")
    .replace(/\bSemi Finals Week 2\b/gi, "Semi Finals 2");
}

export function getParticipantSectionLabel(label) {
  const cleaned = getCleanStageLabel(label || "Participants");
  return HIDDEN_PARTICIPANT_PHASE_LABELS.has(normalizeOrganizationName(cleaned))
    ? "Participants"
    : cleaned;
}

export function buildPhaseLabelFromEntry(entry) {
  if (!entry) return null;
  if (entry.phase_label) return entry.phase_label;
  if (entry.stage_name && entry.group_name) return `${entry.stage_name} - ${entry.group_name}`;
  return entry.stage_name || null;
}

export function mergeDisplayStages(stages) {
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
export const EMPTY_STAGE_PARTICIPANT_ENTRIES = [];
export const EMPTY_STAGE_TEAMS = [];
export const EMPTY_STAGE_PLAYERS = [];
export const EMPTY_STAGE_MATCHES = [];
export const EMPTY_STAGE_MATCH_RESULTS = [];
export const EMPTY_STAGE_RANKINGS = [];
export const EMPTY_NORMALIZED_STAGES = [];
export function buildNormalizedParticipantEntries(normalizedParticipants) {
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

export function getBmps2026PreviousStageName(stageName) {
  const normalized = String(stageName || "").trim().toLowerCase();
  if (normalized === "round 2") return "Round 1";
  if (normalized === "round 3") return "Round 2";
  if (normalized === "round 4") return "Round 3";
  return null;
}

export function buildNormalizedStageBoardStages(normalizedStages, normalizedParticipants) {
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
