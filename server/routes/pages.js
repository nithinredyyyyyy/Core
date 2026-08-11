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
  const tournamentId = String(req.params.id || "").trim();
  if (!tournamentId) {
    return res.status(400).json({ error: "Tournament id is required" });
  }
  return sendCachedPagePayload(res, `tournament-core:${tournamentId}`, () =>
    getTournamentCorePayload(tournamentId),
  );
});

pagesRouter.get("/tournament/:id/full", (req, res) => {
  const tournamentId = String(req.params.id || "").trim();
  if (!tournamentId) {
    return res.status(400).json({ error: "Tournament id is required" });
  }
  return sendCachedPagePayload(res, `tournament-full:${tournamentId}`, () =>
    getTournamentFullPayload(tournamentId),
  );
});

pagesRouter.get("/tournament/:id", (req, res) => {
  const tournamentId = String(req.params.id || "").trim();
  if (!tournamentId) {
    return res.status(400).json({ error: "Tournament id is required" });
  }
  return sendCachedPagePayload(res, `tournament:${tournamentId}`, () =>
    getTournamentPagePayload(tournamentId),
  );
});

pagesRouter.get("/teams", (_req, res) => {
  return sendCachedPagePayload(res, "teams", getTeamsPagePayload);
});

pagesRouter.get("/leaderboard", (req, res) => {
  const tournamentId = String(req.query.tournament || "").trim();
  return sendCachedPagePayload(res, `leaderboard:${tournamentId}`, () =>
    getLeaderboardPagePayload(tournamentId),
  );
});

pagesRouter.get("/team-detail", (_req, res) => {
  return res.json(getTeamDetailPagePayload());
});

pagesRouter.use(createRankingsRouter({ sendCachedPagePayload }));
