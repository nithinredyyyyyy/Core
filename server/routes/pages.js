import { Router } from "express";
import { createRankingsRouter } from "./rankings.js";
import { sendCachedPagePayload } from "../services/pageCache.js";
import {
  getLeaderboardPagePayload,
  getTeamDetailPagePayload,
  getTeamsPagePayload,
  getTournamentCorePayload,
  getTournamentFullPayload,
  getTournamentPagePayload,
} from "../services/pagePayloads.js";

export const pagesRouter = Router();

pagesRouter.get("/tournament/:id/core", (req, res) => {
  try {
    const tournamentId = String(req.params.id || "").trim();
    if (!tournamentId) {
      return res.status(400).json({ error: "Tournament id is required" });
    }
    return sendCachedPagePayload(res, `tournament-core:${tournamentId}`, () =>
      getTournamentCorePayload(tournamentId),
    );
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to load core payload" });
  }
});

pagesRouter.get("/tournament/:id/full", (req, res) => {
  try {
    const tournamentId = String(req.params.id || "").trim();
    if (!tournamentId) {
      return res.status(400).json({ error: "Tournament id is required" });
    }
    return sendCachedPagePayload(res, `tournament-full:${tournamentId}`, () =>
      getTournamentFullPayload(tournamentId),
    );
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to load full payload" });
  }
});

pagesRouter.get("/tournament/:id", (req, res) => {
  try {
    const tournamentId = String(req.params.id || "").trim();
    if (!tournamentId) {
      return res.status(400).json({ error: "Tournament id is required" });
    }
    return sendCachedPagePayload(res, `tournament:${tournamentId}`, () =>
      getTournamentPagePayload(tournamentId),
    );
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to load tournament payload" });
  }
});

pagesRouter.get("/teams", (_req, res) => {
  try {
    return sendCachedPagePayload(res, "teams", getTeamsPagePayload);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to load teams payload" });
  }
});

pagesRouter.get("/leaderboard", (req, res) => {
  try {
    const tournamentId = String(req.query.tournament || "").trim();
    return sendCachedPagePayload(res, `leaderboard:${tournamentId}`, () =>
      getLeaderboardPagePayload(tournamentId),
    );
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to load leaderboard payload" });
  }
});

pagesRouter.get("/team-detail", (_req, res) => {
  try {
    return res.json(getTeamDetailPagePayload());
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to load team detail payload" });
  }
});

pagesRouter.use(createRankingsRouter({ sendCachedPagePayload }));
