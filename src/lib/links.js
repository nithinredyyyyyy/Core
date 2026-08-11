import { normalizeOrganizationName } from "@/lib/organizationIdentity";

export function buildTeamLink(teamName) {
  if (!teamName) return "/teams";
  return `/teams?team=${encodeURIComponent(normalizeOrganizationName(teamName))}`;
}

export function buildPlayerLink(playerIgn) {
  if (!playerIgn) return "/teams";
  return `/players/${encodeURIComponent(playerIgn)}`;
}

export function buildTournamentLink(tournamentId, stage = "") {
  const params = new URLSearchParams();
  if (tournamentId) params.set("id", tournamentId);
  if (stage) params.set("stage", stage);
  const query = params.toString();
  return query ? `/tournaments?${query}` : "/tournaments";
}
