import { sendRequestError } from "../services/requestErrors.js";
import { Router } from "express";
import { buildHomeViewModel } from "../homeView.js";
import { sendCachedPagePayload } from "../services/pageCache.js";
import { getHomeSummaryPayload } from "../services/pagePayloads.js";

export const homeRouter = Router();

homeRouter.get("/home/summary", (req, res) => {
  try {
    return res.json(getHomeSummaryPayload());
  } catch (error) {
    return sendRequestError(req, res, error, 500);
  }
});

homeRouter.get("/home/view", (req, res) => {
  try {
    const mode = req.query.mode === "mobile" ? "mobile" : "desktop";
    return sendCachedPagePayload(res, `home:${mode}`, () => {
      const summary = getHomeSummaryPayload();
      return buildHomeViewModel(summary, { mode });
    });
  } catch (error) {
    return sendRequestError(req, res, error, 500);
  }
});
