import { Router } from "express";
import { getGlobalSearchResults } from "../services/search.js";

export const searchRouter = Router();

searchRouter.get("/search", (req, res) => {
  try {
    return res.json(getGlobalSearchResults(req.query.q, req.query.limit));
  } catch (error) {
    return res.status(400).json({ error: error.message || "Search failed" });
  }
});
