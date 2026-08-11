import { randomUUID } from "node:crypto";
import {
  db,
  entityConfigs,
  normalizeRecord,
  recomputeTeamStats,
  runInTransaction,
  serializePayload,
} from "../db.js";

export function insertRecord(entityName, payload, options = {}) {
  const config = entityConfigs[entityName];
  const now = new Date().toISOString();
  const record = {
    id: randomUUID(),
    created_date: now,
    updated_date: now,
    ...serializePayload(config, payload),
  };

  const columns = Object.keys(record);
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT INTO ${config.table} (${columns.join(", ")}) VALUES (${placeholders})`;
  db.prepare(sql).run(...columns.map((column) => record[column]));

  if (entityName === "MatchResult" && options.recompute !== false) {
    recomputeTeamStats();
  }

  return getRecord(entityName, record.id);
}

export function insertRecords(entityName, payloads) {
  if (!Array.isArray(payloads) || payloads.length === 0) return [];

  const created = runInTransaction(() =>
    payloads.map((item) => insertRecord(entityName, item, { recompute: false })),
  );

  if (entityName === "MatchResult") {
    recomputeTeamStats();
  }

  return created;
}

export function getRecord(entityName, id) {
  const config = entityConfigs[entityName];
  const row = db.prepare(`SELECT * FROM ${config.table} WHERE id = ?`).get(id);
  return normalizeRecord(config, row);
}

export function updateRecord(entityName, id, payload) {
  const config = entityConfigs[entityName];
  const updates = serializePayload(config, payload);
  updates.updated_date = new Date().toISOString();
  const fields = Object.keys(updates);
  if (fields.length === 0) {
    return getRecord(entityName, id);
  }
  const sql = `UPDATE ${config.table} SET ${fields.map((field) => `${field} = ?`).join(", ")} WHERE id = ?`;
  db.prepare(sql).run(...fields.map((field) => updates[field]), id);

  if (entityName === "MatchResult") {
    recomputeTeamStats();
  }

  return getRecord(entityName, id);
}

export function deleteRecord(entityName, id) {
  const config = entityConfigs[entityName];

  let result;
  runInTransaction(() => {
    if (entityName === "Team") {
      db.prepare("DELETE FROM players WHERE team_id = ?").run(id);
      db.prepare("DELETE FROM match_results WHERE team_id = ?").run(id);
    }
    if (entityName === "Tournament") {
      const matchIds = db
        .prepare("SELECT id FROM matches WHERE tournament_id = ?")
        .all(id)
        .map((row) => row.id);
      if (matchIds.length > 0) {
        const placeholders = matchIds.map(() => "?").join(", ");
        db.prepare(
          `DELETE FROM match_results WHERE match_id IN (${placeholders})`,
        ).run(...matchIds);
      }
      db.prepare("DELETE FROM matches WHERE tournament_id = ?").run(id);
      db.prepare("DELETE FROM match_results WHERE tournament_id = ?").run(id);
    }
    if (entityName === "Match") {
      db.prepare("DELETE FROM match_results WHERE match_id = ?").run(id);
    }

    result = db.prepare(`DELETE FROM ${config.table} WHERE id = ?`).run(id);
  });

  if (
    entityName === "MatchResult" ||
    entityName === "Team" ||
    entityName === "Tournament" ||
    entityName === "Match"
  ) {
    recomputeTeamStats();
  }
  return result.changes > 0;
}
