import { sendRequestError } from "../services/requestErrors.js";
import { Router } from "express";
import { db, entityConfigs } from "../db.js";
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
import { clearSearchCache } from "../services/search.js";
import { validateEntityPayload } from "../services/schemas.js";

export const entitiesRouter = Router();

const PUBLIC_ENTITY_GET = new Set([
  "Tournament",
  "Team",
  "Player",
  "Match",
  "MatchResult",
  "TransferWindow",
]);

function isAdminRequest(req) {
  const auth = resolveRequestAuth(req);
  return Boolean(auth.isAuthenticated && auth.user?.role === "admin");
}

entitiesRouter.get("/entities/:entity", (req, res) => {
  const entityName = req.params.entity;
  const config = entityConfigs[entityName];
  if (!config) {
    return res.status(404).json({ error: "Unknown entity" });
  }
  if (!PUBLIC_ENTITY_GET.has(entityName) && !isAdminRequest(req)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  let query = {};
  if (req.query.q) {
    try {
      query = JSON.parse(req.query.q);
    } catch (error) {
      return sendRequestError(req, res, error, 400);
    }
  }

  try {
    const records = applyListQuery(entityName, config, query, {
      ...req.query,
      includeUnpublished: isAdminRequest(req),
    });
    return res.json(records);
  } catch (error) {
    return sendRequestError(req, res, error, 400);
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
    clearSearchCache();
    return res.status(201).json(created);
  } catch (error) {
    return sendRequestError(req, res, error, 500);
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
    clearSearchCache();
    return res.status(201).json(created);
  } catch (error) {
    return sendRequestError(req, res, error, 500);
  }
});

entitiesRouter.get("/entities/:entity/:id", (req, res) => {
  const entityName = req.params.entity;
  if (!entityConfigs[entityName]) {
    return res.status(404).json({ error: "Unknown entity" });
  }
  const admin = isAdminRequest(req);
  if (!PUBLIC_ENTITY_GET.has(entityName) && !admin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  const record = getRecord(entityName, req.params.id);
  if (!record) {
    return res.status(404).json({ error: "Not found" });
  }
  // A single draft match result must stay hidden from anonymous clients, and
  // it must not reveal that a sibling result for the same match is a draft.
  if (entityName === "MatchResult" && !admin) {
    const siblingDrafts = db
      .prepare(
        `SELECT COUNT(*) AS count FROM match_results
         WHERE match_id = ?
           AND COALESCE(NULLIF(publication_status, ''), 'published') <> 'published'`,
      )
      .get(record.match_id);
    const isDraft =
      String(record.publication_status || "published").trim().toLowerCase() !==
      "published";
    if (isDraft || siblingDrafts.count > 0) {
      return res.status(404).json({ error: "Not found" });
    }
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
    clearSearchCache();
    return res.json(updated);
  } catch (error) {
    return sendRequestError(req, res, error, 500);
  }
});

entitiesRouter.delete("/entities/:entity/:id", (req, res) => {
  if (!entityConfigs[req.params.entity]) {
    return res.status(404).json({ error: "Unknown entity" });
  }
  if (!ensureEntityWriteAccess(req, res, req.params.entity)) {
    return;
  }
  try {
    const ok = deleteRecord(req.params.entity, req.params.id);
    clearPagePayloadCache();
    clearSearchCache();
    return res.json({ ok });
  } catch (error) {
    return sendRequestError(req, res, error, 500);
  }
});
