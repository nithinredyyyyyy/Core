import { Router } from "express";
import {
  BMPS_2026_PLAYER_STATS_SETTINGS_KEY,
  getSiteSetting,
} from "../services/settings.js";

export const siteRouter = Router();

siteRouter.get("/site/bmps-2026-player-stats", (_req, res) => {
  return res.json(getSiteSetting(BMPS_2026_PLAYER_STATS_SETTINGS_KEY, {}));
});
