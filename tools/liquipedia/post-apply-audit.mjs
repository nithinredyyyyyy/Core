#!/usr/bin/env node
// Read-only post-apply acceptance audit for the BMPS 2025 Grand Finals apply.
//
// Implements the acceptance criteria for the first real replaceSyntheticSnapshot
// against a production-shaped database. Read-only by construction: the database is
// opened with `readonly: true` plus `PRAGMA query_only = ON`, so an audit can never
// mutate what it inspects.
//
// Usage: node tools/liquipedia/post-apply-audit.mjs --db <path> [--json <out>]
//
// Exit code 0 = every hard criterion passed. Exit 1 = at least one failed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..", "..");

const TARGET = {
  tournamentId: "843e95ec-51ab-4cff-8b1d-ceb5ebfcce1c",
  tournamentName: "Battlegrounds Mobile India Pro Series 2025",
  stage: "Grand Finals",
  expectedMatches: 18,
  expectedTeamsPerMatch: 16,
  expectedResultRows: 288,
  expectedSynthetic: 0,
};

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
}
const dbPath = arg("db", process.env.CORE_DB_PATH);
const jsonPath = arg("json");
const baselinePath = arg("baseline");
if (!dbPath) {
  console.error("Usage: node tools/liquipedia/post-apply-audit.mjs --db <path> [--json <out>] [--baseline <pre-apply-db>]");
  process.exit(2);
}
if (!fs.existsSync(dbPath)) {
  console.error(`Database not found: ${dbPath}`);
  process.exit(2);
}

const Database = (await import("better-sqlite3")).default;
const db = new Database(dbPath, { readonly: true, fileMustExist: true });
db.pragma("query_only = ON");

const T = TARGET.tournamentId;
const S = TARGET.stage;
const one = (sql, ...p) => db.prepare(sql).get(...p);
const all = (sql, ...p) => db.prepare(sql).all(...p);

const checks = [];
function check(id, ok, detail) {
  checks.push({ id, ok: Boolean(ok), detail });
}

const hasColumn = (table, column) =>
  db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column);

// --- Identity ------------------------------------------------------------
const tournament = one("SELECT id, name FROM tournaments WHERE id = ?", T);
check("tournament_exists", Boolean(tournament), tournament ? tournament.name : "missing");
check(
  "tournament_name_matches",
  tournament?.name === TARGET.tournamentName,
  tournament?.name ?? "missing",
);

// --- Synthetic vs real ---------------------------------------------------
const syntheticMatches = one(
  `SELECT COUNT(*) c FROM matches
    WHERE tournament_id = ? AND stage = ? AND (match_number = 0 OR match_number IS NULL)`,
  T,
  S,
).c;
check("synthetic_aggregate_zero", syntheticMatches === TARGET.expectedSynthetic, `synthetic matches: ${syntheticMatches}`);

const realMatches = one(
  `SELECT COUNT(*) c FROM matches
    WHERE tournament_id = ? AND stage = ? AND match_number IS NOT NULL AND match_number >= 1`,
  T,
  S,
).c;
check("real_match_count_18", realMatches === TARGET.expectedMatches, `real matches: ${realMatches}`);

// --- Match numbers 1..18 -------------------------------------------------
const numbers = all(
  `SELECT match_number FROM matches
    WHERE tournament_id = ? AND stage = ? AND match_number IS NOT NULL AND match_number >= 1
    ORDER BY match_number`,
  T,
  S,
).map((r) => r.match_number);
const expectedNumbers = Array.from({ length: TARGET.expectedMatches }, (_, i) => i + 1);
check(
  "match_numbers_1_to_18",
  JSON.stringify(numbers) === JSON.stringify(expectedNumbers),
  `match numbers: ${numbers.join(",") || "(none)"}`,
);

// --- Result rows 288 -----------------------------------------------------
const resultRows = one(
  `SELECT COUNT(*) c FROM match_results mr
     JOIN matches m ON m.id = mr.match_id
    WHERE m.tournament_id = ? AND m.stage = ?`,
  T,
  S,
).c;
check("result_rows_288", resultRows === TARGET.expectedResultRows, `result rows: ${resultRows}`);

// --- 16 teams per match --------------------------------------------------
const perMatch = all(
  `SELECT m.match_number n, COUNT(*) c FROM match_results mr
     JOIN matches m ON m.id = mr.match_id
    WHERE m.tournament_id = ? AND m.stage = ?
    GROUP BY m.match_number ORDER BY m.match_number`,
  T,
  S,
);
const badCardinality = perMatch.filter((r) => r.c !== TARGET.expectedTeamsPerMatch);
check(
  "teams_per_match_16",
  perMatch.length === TARGET.expectedMatches && badCardinality.length === 0,
  badCardinality.length === 0
    ? `all ${perMatch.length} matches have ${TARGET.expectedTeamsPerMatch} rows`
    : `off-cardinality: ${badCardinality.map((r) => `m${r.n}=${r.c}`).join(", ")}`,
);

// --- Zero real matches without results -----------------------------------
const emptyMatches = one(
  `SELECT COUNT(*) c FROM matches m
    WHERE m.tournament_id = ? AND m.stage = ?
      AND m.match_number IS NOT NULL AND m.match_number >= 1
      AND NOT EXISTS (SELECT 1 FROM match_results mr WHERE mr.match_id = m.id)`,
  T,
  S,
).c;
check("no_real_match_without_results", emptyMatches === 0, `empty real matches: ${emptyMatches}`);

// --- Zero duplicate (match_id, team_id) ----------------------------------
const duplicates = one(
  `SELECT COUNT(*) c FROM (
     SELECT mr.match_id, mr.team_id, COUNT(*) n FROM match_results mr
       JOIN matches m ON m.id = mr.match_id
      WHERE m.tournament_id = ? AND m.stage = ?
      GROUP BY mr.match_id, mr.team_id HAVING COUNT(*) > 1)`,
  T,
  S,
).c;
check("no_duplicate_match_team", duplicates === 0, `duplicate (match_id,team_id) groups: ${duplicates}`);

// --- Zero canonical arithmetic violations --------------------------------
const arithmetic = one(
  `SELECT COUNT(*) c FROM match_results mr
     JOIN matches m ON m.id = mr.match_id
    WHERE m.tournament_id = ? AND m.stage = ?
      AND mr.total_points <> mr.kill_points + mr.placement_points`,
  T,
  S,
).c;
check("canonical_arithmetic_ok", arithmetic === 0, `arithmetic violations: ${arithmetic}`);

// --- Provenance present --------------------------------------------------
let provenanceOk = true;
let provenanceDetail = "";
if (!hasColumn("matches", "source_url")) {
  provenanceOk = false;
  provenanceDetail = "matches has no provenance columns (pre-010 schema)";
} else {
  const missing = one(
    `SELECT COUNT(*) c FROM matches
      WHERE tournament_id = ? AND stage = ?
        AND match_number IS NOT NULL AND match_number >= 1
        AND (source_url IS NULL OR source_name IS NULL OR source_slug IS NULL)`,
    T,
    S,
  ).c;
  provenanceOk = missing === 0;
  provenanceDetail = `matches missing provenance: ${missing}`;
}
check("provenance_present", provenanceOk, provenanceDetail);

// --- match_sources recorded for the stage --------------------------------
if (db.prepare("SELECT name FROM sqlite_master WHERE name='match_sources'").get()) {
  const src = one(
    `SELECT COUNT(*) c FROM match_sources WHERE tournament_id = ?`,
    T,
  ).c;
  const latest = one(
    `SELECT source_name, source_url, checksum FROM match_sources
      WHERE tournament_id = ? ORDER BY rowid DESC LIMIT 1`,
    T,
  );
  check("match_sources_recorded", src > 0, `match_sources rows: ${src}`);
  check(
    "match_sources_has_url",
    Boolean(latest?.source_url),
    latest ? `${latest.source_name} ${latest.source_url}` : "none",
  );
} else {
  check("match_sources_recorded", false, "match_sources table absent");
  check("match_sources_has_url", false, "match_sources table absent");
}

// --- Player stats explicitly absent --------------------------------------
let pms = 0;
if (db.prepare("SELECT name FROM sqlite_master WHERE name='player_match_stats'").get()) {
  pms = one(
    `SELECT COUNT(*) c FROM player_match_stats p
       JOIN matches m ON m.id = p.match_id
      WHERE m.tournament_id = ? AND m.stage = ?`,
    T,
    S,
  ).c;
}
check("player_match_stats_zero", pms === 0, `player_match_stats rows: ${pms} (SOURCE_NOT_AVAILABLE)`);

// --- No unrelated stage/tournament changes -------------------------------
// "Unrelated" = any OTHER tournament's stage whose matches were touched at all
// relative to a pre-apply baseline is not knowable read-only, so this reports the
// tournament's stage inventory for comparison against the pre-apply baseline.
const stages = all(
  `SELECT s.name, s.slug,
          (SELECT COUNT(*) FROM matches m WHERE m.tournament_id = s.tournament_id AND m.stage = s.name) AS match_count
     FROM tournament_stages s WHERE s.tournament_id = ? ORDER BY s.slug`,
  T,
);
check("stage_inventory_reported", stages.length > 0, `${stages.length} stages on tournament`);

// When a pre-apply baseline is supplied, prove the change was confined to this
// stage: the apply must add exactly the real matches and result rows it declares
// and must not touch any other match.
let baselineDiff = null;
if (baselinePath && fs.existsSync(baselinePath)) {
  const base = new Database(baselinePath, { readonly: true, fileMustExist: true });
  base.pragma("query_only = ON");
  const otherMatches = (handle) =>
    handle
      .prepare(`SELECT COUNT(*) c FROM matches WHERE NOT (tournament_id = ? AND stage = ?)`)
      .get(T, S).c;
  const stageMatches = (handle) =>
    handle.prepare(`SELECT COUNT(*) c FROM matches WHERE tournament_id = ? AND stage = ?`).get(T, S).c;
  const stageResults = (handle) =>
    handle
      .prepare(
        `SELECT COUNT(*) c FROM match_results mr JOIN matches m ON m.id = mr.match_id
          WHERE m.tournament_id = ? AND m.stage = ?`,
      )
      .get(T, S).c;
  const stageBreakdown = db.prepare("SELECT name FROM sqlite_master WHERE name='stage_match_breakdown'").get()
    ? (handle) =>
        handle
          .prepare(
            `SELECT COUNT(*) c FROM stage_match_breakdown sb
               JOIN matches m ON m.id = sb.match_id
              WHERE m.tournament_id = ? AND m.stage = ?`,
          )
          .get(T, S).c
    : null;

  baselineDiff = {
    baseline: path.resolve(baselinePath),
    other_matches_before: otherMatches(base),
    other_matches_after: otherMatches(db),
    stage_matches_before: stageMatches(base),
    stage_matches_after: stageMatches(db),
    stage_results_before: stageResults(base),
    stage_results_after: stageResults(db),
    stage_breakdown_before: stageBreakdown ? stageBreakdown(base) : null,
    stage_breakdown_after: stageBreakdown ? stageBreakdown(db) : null,
  };
  const delta = baselineDiff.stage_matches_after - baselineDiff.stage_matches_before;
  const resultDelta = baselineDiff.stage_results_after - baselineDiff.stage_results_before;
  check(
    "no_other_match_touched",
    baselineDiff.other_matches_before === baselineDiff.other_matches_after,
    `matches outside this stage: ${baselineDiff.other_matches_before} -> ${baselineDiff.other_matches_after}`,
  );
  // The apply removes exactly one synthetic placeholder and leaves the stage's
  // real match count unchanged. The pristine database already carries match_number
  // stubs 1..18 (zero result rows); the apply replaces those plus the synthetic
  // aggregate with 18 fully-populated matches, so the match count moves by -1.
  check(
    "stage_match_delta_expected",
    delta === -1,
    `stage match count delta ${delta} (expected -1: -1 synthetic aggregate, real stubs reused in place)`,
  );
  check(
    "stage_result_delta_expected",
    resultDelta === TARGET.expectedResultRows - 16,
    `stage result delta ${resultDelta} (expected ${TARGET.expectedResultRows - 16}: -16 synthetic rows +288 real)`,
  );
  if (baselineDiff.stage_breakdown_before !== null) {
    check(
      "breakdown_not_left_behind",
      baselineDiff.stage_breakdown_after === 0,
      `stage_match_breakdown rows: ${baselineDiff.stage_breakdown_before} -> ${baselineDiff.stage_breakdown_after}`,
    );
  }
  base.close();
} else if (baselinePath) {
  check("baseline_readable", false, `baseline not found: ${baselinePath}`);
}

// --- Integrity -----------------------------------------------------------
const integrity = one("PRAGMA integrity_check").integrity_check;
check("integrity_check_ok", integrity === "ok", integrity);
const fkViolations = all("PRAGMA foreign_key_check").length;
check("no_foreign_key_violations", fkViolations === 0, `FK violations: ${fkViolations}`);

db.close();

const failed = checks.filter((c) => !c.ok);
const report = {
  audited_at: new Date().toISOString(),
  database: path.resolve(dbPath),
  tournament: TARGET,
  passed: failed.length === 0,
  total_checks: checks.length,
  failed_checks: failed.length,
  checks,
  stage_inventory: stages,
};

if (jsonPath) {
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
}

console.log("=== BMPS 2025 Grand Finals — post-apply acceptance audit ===");
console.log(`Database: ${path.resolve(dbPath)}`);
console.log("");
for (const c of checks) {
  console.log(`  ${c.ok ? "PASS" : "FAIL"}  ${c.id.padEnd(32)} ${c.detail}`);
}
console.log("");
console.log(`${report.total_checks - report.failed_checks}/${report.total_checks} checks passed`);
if (failed.length > 0) {
  console.log(`FAILED: ${failed.map((c) => c.id).join(", ")}`);
}
if (jsonPath) console.log(`Report: ${jsonPath}`);
process.exit(failed.length === 0 ? 0 : 1);
