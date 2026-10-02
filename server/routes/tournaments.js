import { sendRequestError } from "../services/requestErrors.js";
import { Router } from "express";
import { getNormalizedTournament } from "../services/tournaments.js";

export const tournamentsRouter = Router();

tournamentsRouter.get("/tournaments/:id/normalized", (req, res) => {
  try {
    const normalized = getNormalizedTournament(req.params.id);
    if (!normalized) {
      return res.status(404).json({ error: "Tournament not found" });
    }
    return res.json(normalized);
  } catch (error) {
    return sendRequestError(req, res, error, 500);
  }
});
