import { Router } from "express";
import { z } from "zod";
import { entityConfigs } from "../db.js";
import {
  ensureEntityWriteAccess,
  resolveRequestAuth,
} from "../services/auth.js";
import {
  deleteRecord,
  getRecord,
  insertRecord,
  insertRecords,
  updateRecord,
} from "../services/entities.js";
import { applyListQuery } from "../services/listQuery.js";
import { clearPagePayloadCache } from "../services/pageCache.js";
import { validateEntityPayload } from "../services/schemas.js";

export const entitiesRouter = Router();

const PUBLIC_ENTITY_GET = new Set([
  "Tournament",
  "Team",
  "Player",
  "Match",
  "MatchResult",
  "NewsArticle",
  "TransferWindow",
]);

entitiesRouter.get("/entities/:entity", (req, res) => {
  const entityName = req.params.entity;
  const config = entityConfigs[entityName];
  if (!config) {
    return res.status(404).json({ error: "Unknown entity" });
  }
  if (!PUBLIC_ENTITY_GET.has(entityName)) {
    const auth = resolveRequestAuth(req);
    if (!auth.isAuthenticated || auth.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
  }
  let query = {};
  if (req.query.q) {
    try {
      query = JSON.parse(req.query.q);
    } catch {
      return res.status(400).json({ error: "Invalid q filter" });
    }
  }

  try {
    const records = applyListQuery(entityName, config, query, req.query);
    return res.json(records);
  } catch (error) {
    return res
      .status(400)
      .json({ error: error.message || "Invalid list query" });
  }
});

entitiesRouter.post("/entities/:entity", (req, res) => {
  const entityName = req.params.entity;
  if (!entityConfigs[entityName]) {
    return res.status(404).json({ error: "Unknown entity" });
  }
  if (!ensureEntityWriteAccess(req, res, entityName)) {
    return;
  }
  try {
    const payload = validateEntityPayload(entityName, req.body, "create");
    const created = insertRecord(entityName, payload);
    clearPagePayloadCache();
    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid payload", issues: error.issues });
    }
    throw error;
  }
});

entitiesRouter.post("/entities/:entity/bulk", (req, res) => {
  const entityName = req.params.entity;
  if (!entityConfigs[entityName]) {
    return res.status(404).json({ error: "Unknown entity" });
  }
  if (!ensureEntityWriteAccess(req, res, entityName)) {
    return;
  }
  const payload = Array.isArray(req.body) ? req.body : [];
  try {
    const validatedPayload = payload.map((item) =>
      validateEntityPayload(entityName, item, "create"),
    );
    const created = insertRecords(entityName, validatedPayload);
    clearPagePayloadCache();
    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid bulk payload", issues: error.issues });
    }
    throw error;
  }
});

entitiesRouter.get("/entities/:entity/:id", (req, res) => {
  const entityName = req.params.entity;
  if (!entityConfigs[entityName]) {
    return res.status(404).json({ error: "Unknown entity" });
  }
  if (!PUBLIC_ENTITY_GET.has(entityName)) {
    const auth = resolveRequestAuth(req);
    if (!auth.isAuthenticated || auth.user?.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
  }
  const record = getRecord(req.params.entity, req.params.id);
  if (!record) {
    return res.status(404).json({ error: "Not found" });
  }
  return res.json(record);
});

entitiesRouter.put("/entities/:entity/:id", (req, res) => {
  const entityName = req.params.entity;
  if (!entityConfigs[entityName]) {
    return res.status(404).json({ error: "Unknown entity" });
  }
  if (!ensureEntityWriteAccess(req, res, entityName)) {
    return;
  }
  try {
    const payload = validateEntityPayload(entityName, req.body, "update");
    const updated = updateRecord(entityName, req.params.id, payload);
    clearPagePayloadCache();
    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid payload", issues: error.issues });
    }
    throw error;
  }
});

entitiesRouter.delete("/entities/:entity/:id", (req, res) => {
  if (!entityConfigs[req.params.entity]) {
    return res.status(404).json({ error: "Unknown entity" });
  }
  if (!ensureEntityWriteAccess(req, res, req.params.entity)) {
    return;
  }
  const ok = deleteRecord(req.params.entity, req.params.id);
  clearPagePayloadCache();
  return res.json({ ok });
});
