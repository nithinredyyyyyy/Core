import { base44 } from "@/api/base44Client";

export const PLAYERS_QUERY_KEY = "players";
export const PLAYER_ALIASES_QUERY_KEY = "player-aliases";
export const PLAYER_HISTORY_QUERY_KEY = "player-team-history";

export function listPlayers(limit = 800) {
  return base44.entities.Player.list("-created_date", limit);
}

export function listPlayerAliases(limit = 3000) {
  return base44.entities.PlayerAlias.list("-created_date", limit);
}

export function listPlayerTeamHistory(limit = 4000) {
  return base44.entities.PlayerTeamHistory.list("-updated_date", limit);
}

export function getPlayerDetailPage() {
  return base44.pages.playerDetail();
}
