import { Router } from "express";
import { buildRankingsPagePayload } from "../rankingsView.js";

export function createRankingsRouter({ sendCachedPagePayload }) {
  const router = Router();

  router.get("/rankings", (_req, res) => {
    return sendCachedPagePayload(res, "rankings", buildRankingsPagePayload);
  });

  return router;
}
