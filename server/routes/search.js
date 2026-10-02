import { sendRequestError } from "../services/requestErrors.js";
import { Router } from "express";
import { getGlobalSearchResults } from "../services/search.js";

export const searchRouter = Router();

searchRouter.get("/search", (req, res) => {
  try {
    return res.json(getGlobalSearchResults(req.query.q, req.query.limit));
  } catch (error) {
    return sendRequestError(req, res, error, 400);
  }
});
