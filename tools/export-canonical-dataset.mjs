#!/usr/bin/env node
// Export-only: reads the production SQLite database and writes a deterministic
// canonical JSON dataset. It never writes to the database, and it writes the
// export to server/seed/canonical.export.json (not seed.json), so the current
// committed dataset stays untouched until the export has been proven equivalent.
//
// Usage:
//   node tools/export-canonical-dataset.mjs
//   node tools/export-canonical-dataset.mjs --db /path/to.sqlite --out /path/out.json
import Database from "better-sqlite3";
import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const dbPath = resolve(arg("db", join(repoRoot, "server", "data", "stagecore.sqlite")));
const outPath = resolve(arg("out", join(repoRoot, "server", "seed", "canonical.export.json")));

// Reproduce the application's current state. Order is the insert/FK-safe order
// used by server/services/seed.js.
const SEED_TABLES = [
  "tournaments", "teams", "players", "matches", "match_results",
  "tournament_stages", "tournament_stage_groups", "tournament_participants",
  "tournament_participant_players", "tournament_participant_stage_entries",
  "stage_standings", "player_team_history", "transfer_windows",
  "team_aliases", "player_aliases", "news_articles",
  "team_season_ratings", "player_season_ratings",
];

// Deterministic ordering key per table (timestamps first when present so reviews
// read like a timeline, otherwise the primary key).
const ORDER_BY = {
  tournaments: "start_date, name, id",
  teams: "lower(name), id",
  players: "lower(ign), id",
  matches: "tournament_id, COALESCE(match_number, 0), COALESCE(scheduled_time, ''), id",
  match_results: "tournament_id, stage, COALESCE(placement, 0), team_id, id",
  tournament_stages: "tournament_id, stage_order, id",
  tournament_stage_groups: "stage_id, group_name, id",
  tournament_participants: "tournament_id, COALESCE(seed, 9999), team_id, id",
  tournament_participant_players: "participant_id, lower(player_name), id",
  tournament_participant_stage_entries: "participant_id, id",
  stage_standings: "tournament_id, stage_id, COALESCE(rank, 9999), team_id, id",
  player_team_history: "player_id, COALESCE(joined_date, ''), id",
  transfer_windows: "COALESCE(date, ''), id",
  team_aliases: "team_id, lower(alias), id",
  player_aliases: "player_id, lower(alias), id",
  news_articles: "created_date, title, id",
  team_season_ratings: "team_id, season, id",
  player_season_ratings: "player_id, season, id",
};

// Columns that must never leave the production database even if a future schema
// adds them. Guards against exporting auth/session/secret/runtime material.
const DENY_COLUMN = /(secret|token|password|passwd|api[_-]?key|apikey|credential|private[_-]?key|session|jwt|refresh|otp|salt|hash_secret)/i;
const DENY_TABLE = /^(schema_migrations|stream_sessions|stream_frame_jobs|stream_ocr_results|stream_match_stats|player_match_stats|stage_match_breakdown|site_settings)$/;

const db = new Database(dbPath, { readonly: true, fileMustExist: true });

const tableExists = (name) =>
  Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name = ?").get(name));

const exported = {};
const meta = { generatedFrom: dbPath, excluded: {}, tables: {} };

for (const table of SEED_TABLES) {
  if (!tableExists(table)) {
    meta.tables[table] = { rows: 0, note: "table absent" };
    continue;
  }
  if (DENY_TABLE.test(table)) {
    meta.excluded[table] = "denied table (runtime/session state)";
    continue;
  }
  const allCols = db.prepare(`PRAGMA table_info("${table}")`).all().map((c) => c.name);
  const cols = allCols.filter((c) => !DENY_COLUMN.test(c));
  const dropped = allCols.filter((c) => DENY_COLUMN.test(c));
  if (dropped.length) meta.excluded[`${table}.${dropped.join(",")}`] = "denied column";

  const order = ORDER_BY[table];
  const sql = `SELECT ${cols.map((c) => `"${c}"`).join(", ")} FROM "${table}"${order ? ` ORDER BY ${order}` : ""}`;
  const rows = db.prepare(sql).all();

  // Unwrap node:sqlite's null-prototype objects so JSON.stringify is stable.
  exported[table] = rows.map((row) => {
    const plain = {};
    for (const c of cols) {
      const v = row[c];
      if (typeof v === "bigint") plain[c] = Number(v);
      else plain[c] = v;
    }
    return plain;
  });
  meta.tables[table] = { rows: rows.length, columns: cols.length };
}

db.close();

// Canonical, deterministic serialization: inserted-row order is fixed by
// ORDER_BY, JSON keys follow schema column order, and no whitespace varies.
const json = JSON.stringify(exported, null, 0);
writeFileSync(outPath, json, "utf8");

const total = Object.values(meta.tables).reduce((n, t) => n + t.rows, 0);
console.log(`Exported ${total} rows across ${Object.keys(meta.tables).length} tables`);
console.log(`  -> ${outPath}`);
console.log(`  size: ${(Buffer.byteLength(json) / 1048576).toFixed(2)} MB`);
if (Object.keys(meta.excluded).length) {
  console.log("Excluded:");
  for (const [k, v] of Object.entries(meta.excluded)) console.log(`  - ${k}: ${v}`);
}
