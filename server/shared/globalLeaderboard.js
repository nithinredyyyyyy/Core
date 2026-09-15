import { getTeamLeaderboard, getPlayerLeaderboard } from "../services/globalLeaderboard.js";
import { GLOBAL_LEADERBOARD as HARDCODED_GLOBAL_LEADERBOARD, PLAYER_RANKINGS as HARDCODED_PLAYER_RANKINGS } from "./globalLeaderboardHardcoded.js";

export const GLOBAL_LEADERBOARD = (() => {
  try {
    return getTeamLeaderboard('2024');
  } catch {
    return HARDCODED_GLOBAL_LEADERBOARD;
  }
})();

export const PLAYER_RANKINGS = (() => {
  try {
    return getPlayerLeaderboard('2024');
  } catch {
    return HARDCODED_PLAYER_RANKINGS;
  }
})();

export { recomputeGlobalLeaderboard } from "../services/globalLeaderboard.js";
