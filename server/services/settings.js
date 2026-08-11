import { db } from "../db.js";
import { clearPagePayloadCache } from "./pageCache.js";

export const BMPS_2026_PLAYER_STATS_SETTINGS_KEY = "bmps-2026-player-stats";

export function getSiteSetting(key, fallback = null) {
  const row = db.prepare("SELECT value FROM site_settings WHERE key = ?").get(key);
  if (!row?.value) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
}

export function setSiteSetting(key, value, createdBy = null) {
  const now = new Date().toISOString();
  const serialized = JSON.stringify(value ?? {});
  const existing = db.prepare("SELECT key FROM site_settings WHERE key = ?").get(key);
  if (existing) {
    db.prepare(
      "UPDATE site_settings SET value = ?, updated_date = ?, created_by = ? WHERE key = ?",
    ).run(serialized, now, createdBy, key);
  } else {
    db.prepare(
      "INSERT INTO site_settings (key, value, created_date, updated_date, created_by) VALUES (?, ?, ?, ?, ?)",
    ).run(key, serialized, now, now, createdBy);
  }
  clearPagePayloadCache();
  return getSiteSetting(key, {});
}

export function normalizeBmps2026PlayerStatsPayload(payload = {}) {
  return {
    qualifierRaw: String(payload.qualifierRaw || "").trim(),
    survivalRaw: String(payload.survivalRaw || "").trim(),
    semiFinalsRaw: String(payload.semiFinalsRaw || "").trim(),
    lcqRaw: String(payload.lcqRaw || "").trim(),
    grandFinalsRaw: String(payload.grandFinalsRaw || "").trim(),
    updatedAt: new Date().toISOString(),
  };
}
