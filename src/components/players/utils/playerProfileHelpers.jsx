import { format } from "date-fns";
import { getOrganizationMetaFromAliases } from "@/lib/normalizedIdentity";
import { getOfficialParticipantEntries } from "@/lib/tournamentParticipants";

export function decodeIgn(value) {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
}

export function normalizeIgn(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function normalizeStatPlayerKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function isMajorTier(tier) {
  return ["S-Tier", "A-Tier", "B-Tier"].includes(String(tier || "").trim());
}

export function getHistoryYear(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Undated";
  return String(date.getFullYear());
}

export function formatProfileDate(value, pattern, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return format(date, pattern);
}

export function findParticipantTeamForPlayer(tournaments, ign) {
  const target = normalizeIgn(ign);
  for (const tournament of tournaments) {
    const participants = getOfficialParticipantEntries(tournament);
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

export function resolveTournamentParticipantForPlayer({
  tournament,
  ign,
  preferredTeamMeta,
  historyOrgKeys = new Set(),
  teamAliasIndex,
}) {
  const target = normalizeIgn(ign);
  const participants = getOfficialParticipantEntries(tournament);

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
