import { format } from "date-fns";
import { normalizeOrganizationName } from "@/lib/organizationIdentity";

export function buildBoardLink(tournamentId, stage) {
  const params = new URLSearchParams();
  if (tournamentId) params.set("tournament", tournamentId);
  if (stage) params.set("stage", stage);
  const query = params.toString();
  return query ? `/leaderboard?${query}` : "/leaderboard";
}

export function buildTeamLink(teamName) {
  return `/teams?team=${encodeURIComponent(normalizeOrganizationName(teamName))}`;
}

export function formatLeaderboardDate(value, pattern, prefix = "") {
  if (!value) return "";
  const label = format(new Date(value), pattern);
  return prefix ? `${prefix}${label}` : label;
}

export function compareOverallValues(left, right, direction) {
  const leftNumber = Number(String(left ?? "").replace("%", ""));
  const rightNumber = Number(String(right ?? "").replace("%", ""));
  const bothNumeric = Number.isFinite(leftNumber) && Number.isFinite(rightNumber);
  const result = bothNumeric
    ? leftNumber - rightNumber
    : String(left ?? "").localeCompare(String(right ?? ""), undefined, {
        numeric: true,
        sensitivity: "base",
      });
  return direction === "asc" ? result : -result;
}
