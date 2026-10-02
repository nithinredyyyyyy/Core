import { sendRequestError } from "../services/requestErrors.js";
import { Router } from "express";
import { createRankingsRouter } from "./rankings.js";
import { sendCachedPagePayload } from "../services/pageCache.js";
import {
  getLeaderboardPagePayload,
  getPlayerDetailPagePayload,
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
    return sendRequestError(req, res, error, 500);
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
    return sendRequestError(req, res, error, 500);
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
    return sendRequestError(req, res, error, 500);
  }
});

pagesRouter.get("/teams", (req, res) => {
  try {
    return sendCachedPagePayload(res, "teams", getTeamsPagePayload);
  } catch (error) {
    return sendRequestError(req, res, error, 500);
  }
});

pagesRouter.get("/leaderboard", (req, res) => {
  try {
    const tournamentId = String(req.query.tournament || "").trim();
    return sendCachedPagePayload(res, `leaderboard:${tournamentId}`, () =>
      getLeaderboardPagePayload(tournamentId),
    );
  } catch (error) {
    return sendRequestError(req, res, error, 500);
  }
});

pagesRouter.get("/team-detail", (req, res) => {
  try {
    return res.json(getTeamDetailPagePayload());
  } catch (error) {
    return sendRequestError(req, res, error, 500);
  }
});

pagesRouter.get("/player-detail", (req, res) => {
  try {
    return sendCachedPagePayload(res, "player-detail", getPlayerDetailPagePayload);
  } catch (error) {
    return sendRequestError(req, res, error, 500);
  }
});

pagesRouter.use(createRankingsRouter({ sendCachedPagePayload }));
