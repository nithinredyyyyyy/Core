import { Router } from "express";
import { getPublishedNewsArticles } from "../services/listQuery.js";
import { getRecord } from "../services/entities.js";

export const newsRouter = Router();

newsRouter.get("/news/public", (req, res) => {
  try {
    const records = getPublishedNewsArticles(req.query);
    return res.json(records);
  } catch (error) {
    return res
      .status(400)
      .json({ error: error.message || "Invalid news query" });
  }
});

newsRouter.get("/news/public/:id", (req, res) => {
  const record = getRecord("NewsArticle", req.params.id);
  if (!record || record.publication_status !== "published") {
    return res.status(404).json({ error: "Not found" });
  }
  return res.json(record);
});
