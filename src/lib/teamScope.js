import { getGroupMovementRule } from "@/features/tournaments/utils/participantHelpers";

const DEFAULT_NORMALIZE = (value) =>
  String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Extracts the group token from a label. Matches the LAST "group X" token so
 * phases like "Group Stage - Group A" resolve to "a" instead of "stage".
 * Falls back to a standalone group letter (a-d) or the raw text.
 */
export function extractGroupToken(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const matches = Array.from(text.matchAll(/group\s+([a-z0-9]+)/gi));
  if (matches.length > 0) {
    return matches[matches.length - 1][1].toLowerCase();
  }
  const simple = text.match(/\b([a-d])\b/i);
  if (simple) return simple[1].toLowerCase();
  return text.toLowerCase();
}

/**
 * Expands a token into its set of letters. "abcd" -> ["a","b","c","d"] so a
 * combined phase like "Group A - Group B" overlaps either single group.
 */
export function extractGroupTokens(value) {
  const token = extractGroupToken(value);
  if (!token) return [];
  if (/^[a-d]{1,4}$/i.test(token)) {
    return [...new Set(token.toLowerCase().split(""))];
  }
  return [token];
}

export function groupTokensOverlap(left, right) {
  const leftTokens = extractGroupTokens(left);
  const rightTokens = extractGroupTokens(right);
  if (leftTokens.length === 0 || rightTokens.length === 0) return false;
  return leftTokens.some((token) => rightTokens.includes(token));
}

function getStageBaseName(stageName) {
  return String(stageName || "").split(/\s*-\s*Group\s+/i)[0]?.trim() || "";
}

function deriveAdvancedParticipantsSync({
  participants,
  teams,
  targetStageName,
  allMatchResults,
  allMatches,
  tournamentName,
}) {
  if (!targetStageName || !tournamentName) return [];

  const baseName = getStageBaseName(targetStageName).toLowerCase();
  if (baseName === "group stage" || baseName === "qualifier") return [];

  const matchGroupLookup = new Map();
  for (const m of allMatches || []) {
    if (m.group_name && m.stage) {
      const rStage = getStageBaseName(m.stage).toLowerCase();
      if (rStage === "group stage" || rStage === "qualifier") {
        matchGroupLookup.set(String(m.id), m.group_name);
      }
    }
  }

  const stageResults = (allMatchResults || []).filter((r) => {
    const rStage = getStageBaseName(r.stage).toLowerCase();
    return rStage === "group stage" || rStage === "qualifier";
  });

  const teamPlacements = new Map();
  for (const result of stageResults) {
    const teamName = result.team_name || result.team;
    if (!teamName) continue;
    const key = DEFAULT_NORMALIZE(teamName);
    const existing = teamPlacements.get(key);
    if (!existing || (result.total_points || 0) > (existing.total_points || 0)) {
      teamPlacements.set(key, result);
    }
  }

  const groupStandings = new Map();
  for (const [teamKey, result] of teamPlacements) {
    const group = result.group_name || matchGroupLookup.get(String(result.match_id)) || result.group || "A";
    const gKey = DEFAULT_NORMALIZE(group);
    if (!groupStandings.has(gKey)) groupStandings.set(gKey, []);
    groupStandings.get(gKey).push({ teamKey, result });
  }

  for (const [, entries] of groupStandings) {
    entries.sort((a, b) => (b.result.total_points || 0) - (a.result.total_points || 0));
    entries.forEach((entry, idx) => {
      entry.position = idx + 1;
    });
  }

  const advanced = [];
  for (const participant of participants) {
    const teamKey = DEFAULT_NORMALIZE(participant.team);
    const groupToken = extractGroupToken(participant.phase || participant.group_name || participant.group || "");
    const groupLetter = (groupToken && /^[a-z0-9]{1,4}$/i.test(groupToken) ? groupToken : "A").toUpperCase();
    const groupKey = DEFAULT_NORMALIZE(groupLetter);

    const entries = groupStandings.get(groupKey) || [];
    const found = entries.find((e) => e.teamKey === teamKey);
    if (!found) continue;

    const movement = getGroupMovementRule(
      tournamentName,
      "Group Stage",
      groupLetter,
      found.position,
      entries.length,
    );

    if (!movement) continue;

    const label = movement.label.toLowerCase();
    const matchesTarget =
      (label.includes("grand finals") && baseName.includes("grand finals")) ||
      (label.includes("survival stage") && baseName.includes("survival stage")) ||
      (label.includes("semi finals") && baseName.includes("semi finals")) ||
      (label.includes("last chance") && baseName.includes("last chance"));

    if (matchesTarget) {
      advanced.push({
        ...participant,
        group_name: groupLetter,
        phase: `${targetStageName} - Group ${groupLetter}`,
        derived: true,
      });
    }
  }

  return advanced;
}

/**
 * Scopes tournament participants to a match's stage/group and resolves them to
 * real team records by name. Returns the scoped set, the effective set (with
 * fallback for matches that carry no stage/group), and the resolved teams.
 */
export function scopeMatchParticipants({
  participants = [],
  teams = [],
  stage,
  groupName,
  allMatchResults,
  allMatches,
  tournamentName,
  normalize = DEFAULT_NORMALIZE,
}) {
  const normalizedStage = normalize(stage || "");
  const normalizedStageLabel = String(stage || "").trim().toLowerCase();

  let scopedParticipants = participants.filter((participant) => {
    const phase = String(participant.phase || "").trim();
    if (!phase) return false;
    const participantGroupSource =
      participant.group_name || participant.group || participant.phase || "";
    if (
      groupName &&
      normalize(phase).startsWith(normalizedStage) &&
      groupTokensOverlap(groupName, participantGroupSource)
    ) {
      return true;
    }
    return (
      normalize(phase) === normalizedStage ||
      phase.toLowerCase() === normalizedStageLabel
    );
  });

  let derivationAttempted = false;

  if (scopedParticipants.length === 0 && tournamentName && allMatchResults) {
    const baseName = getStageBaseName(stage);
    const nonGroupStages = [
      "grand finals", "survival stage", "semi finals",
      "last chance", "quarter finals",
    ];
    if (nonGroupStages.some((s) => baseName.toLowerCase().includes(s))) {
      derivationAttempted = true;
      const derived = deriveAdvancedParticipantsSync({
        participants,
        teams,
        targetStageName: stage,
        allMatchResults,
        allMatches,
        tournamentName,
      });
      if (derived.length > 0) {
        if (groupName) {
          scopedParticipants = derived.filter((p) =>
            groupTokensOverlap(groupName, p.group_name || p.group || p.phase)
          );
        } else {
          scopedParticipants = derived;
        }
      }
    }
  }

  const effectiveParticipants =
    scopedParticipants.length > 0
      ? scopedParticipants
      : derivationAttempted
        ? participants
        : normalizedStage || normalizedStageLabel
          ? []
          : participants;

  const teamsByKey = new Map(teams.map((team) => [normalize(team.name), team]));
  const resolvedTeams = Array.from(
    new Map(
      effectiveParticipants.map((participant) => [
        normalize(participant.team),
        participant,
      ]),
    ).values(),
  )
    .map((participant) => {
      const dbTeam = teamsByKey.get(normalize(participant.team));
      if (dbTeam) return dbTeam;
      return {
        id: `virtual:${normalize(participant.team)}`,
        name: participant.team,
        logo_url: "",
      };
    });

  return { scopedParticipants, effectiveParticipants, resolvedTeams };
}
