import { normalizeOrganizationName } from "./organizationIdentity.js";

const BMPS_2026_NAME = "Battlegrounds Mobile India Pro Series 2026";

export function isBmps2026Tournament(tournament) {
  return tournament?.name === BMPS_2026_NAME;
}

export function isStageDrawParticipant(entry) {
  return /^(semi finals|survival stage)\s*-\s*group\b/i.test(
    String(entry?.phase || "").trim(),
  );
}

export function isPlaceholderParticipant(entry) {
  return /^survival\s*#/i.test(String(entry?.team || entry?.name || "").trim());
}

export function getOfficialParticipantEntries(tournament) {
  const entries = Array.isArray(tournament?.participants)
    ? tournament.participants
    : [];

  if (!isBmps2026Tournament(tournament)) {
    return entries;
  }

  const seenTeams = new Set();
  return entries.filter((entry) => {
    if (isPlaceholderParticipant(entry) || isStageDrawParticipant(entry)) {
      return false;
    }

    const teamKey = normalizeOrganizationName(entry?.team || entry?.name);
    if (!teamKey || seenTeams.has(teamKey)) return false;
    seenTeams.add(teamKey);
    return true;
  });
}

export function getOfficialParticipantCount(tournament) {
  const officialCount = getOfficialParticipantEntries(tournament).length;
  return Math.max(officialCount || 0, Number(tournament?.max_teams || 0));
}
