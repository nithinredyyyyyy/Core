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
import { getStageStandingsFromResults } from "../services/stageStandings.js";

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

// Canonical standings read path for stages backed by per-match results. Computed
// from match_results with the app's publication rules; does not read or write the
// legacy stage_standings table.
pagesRouter.get("/tournament/:id/stage/:stageId/standings", (req, res) => {
  try {
    const tournamentId = String(req.params.id || "").trim();
    const stageId = String(req.params.stageId || "").trim();
    if (!tournamentId || !stageId) {
      return res.status(400).json({ error: "Tournament id and stage id are required" });
    }
    const payload = getStageStandingsFromResults(tournamentId, stageId);
    if (!payload) {
      return res.status(404).json({ error: "Stage not found for tournament" });
    }
    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to load stage standings" });
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
