import { Router } from "express";
import { getGlobalSearchResults } from "../services/search.js";

export const searchRouter = Router();

searchRouter.get("/search", (req, res) => {
  return res.json(getGlobalSearchResults(req.query.q, req.query.limit));
});
