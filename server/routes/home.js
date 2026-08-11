import { Router } from "express";
import { buildHomeViewModel } from "../homeView.js";
import { sendCachedPagePayload } from "../services/pageCache.js";
import { getHomeSummaryPayload } from "../services/pagePayloads.js";

export const homeRouter = Router();

homeRouter.get("/home/summary", (_req, res) => {
  try {
    return res.json(getHomeSummaryPayload());
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Failed to build home summary" });
  }
});

homeRouter.get("/home/view", (_req, res) => {
  try {
    const mode = _req.query.mode === "mobile" ? "mobile" : "desktop";
    return sendCachedPagePayload(res, `home:${mode}`, () => {
      const summary = getHomeSummaryPayload();
      return buildHomeViewModel(summary, { mode });
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Failed to build home view" });
  }
});
