import { base44 } from "@/api/base44Client";

export const TEAMS_QUERY_KEY = "teams";
export const TEAMS_PAGE_QUERY_KEY = "teams-page";
export const TEAM_ALIASES_QUERY_KEY = "team-aliases";

export function listTeams(limit = 400) {
  return base44.entities.Team.list("-total_points", limit);
}

export function listTeamAliases(limit = 2000) {
  return base44.entities.TeamAlias.list("-created_date", limit);
}

export function getTeamsPage() {
  return base44.pages.teams();
}

export function getTeamDetailPage() {
  return base44.pages.teamDetail();
}
