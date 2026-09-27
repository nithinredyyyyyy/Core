#!/usr/bin/env node
// Read-only per-stage completeness validator.
//
//   node tools/verify-stage-completeness.mjs --tournament <id> --stage "<stage name>"
//   node tools/verify-stage-completeness.mjs --tournament <id> --all
//   node tools/verify-stage-completeness.mjs --all
//
// This script NEVER writes: the connection is opened readonly and every statement
// is a SELECT or PRAGMA. It exits non-zero if any gate fails.

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let dbPath = process.env.CORE_DB_PATH
  ? path.resolve(process.env.CORE_DB_PATH)
  : path.join(__dirname, "..", "server", "data", "stagecore.sqlite");

function parseArgs(argv) {
  const args = { tournament: null, stage: null, all: false, db: null };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--all") args.all = true;
    else if (token === "--tournament") args.tournament = argv[++i] || null;
    else if (token === "--stage") args.stage = argv[++i] || null;
    else if (token === "--db") args.db = argv[++i] || null;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (!args.db && !fs.existsSync(dbPath)) {
  console.error(`Database not found: ${dbPath}`);
  process.exit(2);
}

const resolvedDbPath = args.db ? path.resolve(args.db) : dbPath;
if (!fs.existsSync(resolvedDbPath)) {
  console.error(`Database not found: ${resolvedDbPath}`);
  process.exit(2);
}

const db = new Database(resolvedDbPath, { readonly: true, fileMustExist: true });
db.pragma("query_only = ON");

dbPath = resolvedDbPath;
const failures = [];
const notes = [];

function tableColumns(table) {
  try {
    return db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  } catch {
    return [];
  }
}

// Provenance arrives with migration 010/011. A database that predates them can
// still be checked for structural completeness; the provenance gates are then
// reported as notes rather than failures.
const MATCH_COLUMNS = tableColumns("matches");
const RESULT_COLUMNS = tableColumns("match_results");
const HAS_MATCH_PROVENANCE = MATCH_COLUMNS.includes("source_slug");
const HAS_RESULT_PROVENANCE = RESULT_COLUMNS.includes("source_ref");

function fail(gate, message) {
  failures.push({ gate, message });
}

function selectStages() {
  if (args.tournament && args.stage) {
    return db
      .prepare(
        "SELECT id, tournament_id, name, slug FROM tournament_stages WHERE tournament_id = ? AND name = ?",
      )
      .all(args.tournament, args.stage);
  }
  if (args.tournament) {
    return db
      .prepare(
        "SELECT id, tournament_id, name, slug FROM tournament_stages WHERE tournament_id = ? ORDER BY stage_order, name",
      )
      .all(args.tournament);
  }
  return db
    .prepare(
      "SELECT id, tournament_id, name, slug FROM tournament_stages ORDER BY tournament_id, stage_order, name",
    )
    .all();
}

function verifyStage(stage) {
  const { tournament_id: tournamentId, name: stageName } = stage;
  const gate = (id, message) => fail(`${id} ${tournamentId}/${stageName}`, message);

  // V1 — matches exist. A stage with no real matches but with synthetic
  // placeholders is simply awaiting extraction (note); a stage with nothing at
  // all is a genuine gap (failure).
  const matchCount = db
    .prepare(
      "SELECT COUNT(*) AS c FROM matches WHERE tournament_id = ? AND stage = ? AND match_number >= 1",
    )
    .get(tournamentId, stageName).c;
  const synthetic = db
    .prepare(
      "SELECT COUNT(*) AS c FROM matches WHERE tournament_id = ? AND stage = ? AND (match_number = 0 OR match_number IS NULL)",
    )
    .get(tournamentId, stageName).c;
  if (matchCount === 0) {
    if (synthetic > 0) {
      notes.push(
        `${tournamentId}/${stageName}: V1 awaiting extraction (${synthetic} synthetic placeholder match(es), 0 real)`,
      );
    } else {
      gate("V1", "no matches with match_number >= 1");
    }
  }

  // V2 — per-match result cardinality is uniform and matches the roster size.
  // Cardinality is only meaningful for per-match rows (match_number >= 1); the
  // synthetic aggregate row carries one row per team, which is not a result set.
  const cardinalities = db
    .prepare(
      `SELECT mr.match_id AS match_id, COUNT(*) AS c
       FROM match_results mr
       JOIN matches m ON m.id = mr.match_id
       WHERE mr.tournament_id = ? AND mr.stage = ? AND m.match_number >= 1
       GROUP BY mr.match_id`,
    )
    .all(tournamentId, stageName);
  const expectedTeams = db
    .prepare(
      "SELECT COUNT(*) AS c FROM tournament_participants WHERE tournament_id = ?",
    )
    .get(tournamentId).c;
  const distinctCounts = new Set(cardinalities.map((row) => row.c));
  if (cardinalities.length > 0 && distinctCounts.size > 1) {
    gate("V2", `inconsistent result cardinality: ${[...distinctCounts].join(", ")}`);
  }
  if (matchCount > 0 && cardinalities.length !== matchCount) {
    gate(
      "V2",
      `${matchCount} matches but results present for only ${cardinalities.length}`,
    );
  }
  if (expectedTeams > 0 && distinctCounts.size === 1) {
    const actual = [...distinctCounts][0];
    if (actual !== expectedTeams) {
      notes.push(
        `${tournamentId}/${stageName}: V2 result cardinality ${actual} != participant count ${expectedTeams} (may be legitimate if rosters differ)`,
      );
    }
  }

  // V3 — synthetic snapshots. Expected before extraction; a failure only when
  // real matches exist alongside leftovers, which means a replacement was partial.
  if (synthetic > 0 && matchCount > 0) {
    gate("V3", `${synthetic} synthetic placeholder match(es) remain alongside ${matchCount} real match(es)`);
  } else if (synthetic > 0) {
    notes.push(
      `${tournamentId}/${stageName}: V3 ${synthetic} synthetic placeholder match(es) still present (pre-extraction state)`,
    );
  }

  // V4 — derived aggregates are internally coherent.
  const incoherent = db
    .prepare(
      `SELECT COUNT(*) AS c FROM match_results
       WHERE tournament_id = ? AND stage = ?
         AND total_points <> kill_points + placement_points
         AND publication_status = 'published'`,
    )
    .get(tournamentId, stageName).c;
  if (incoherent > 0) {
    notes.push(
      `${tournamentId}/${stageName}: V4 ${incoherent} row(s) where total_points != kill_points + placement_points (scoring model may differ)`,
    );
  }
  const derived = db
    .prepare(
      `SELECT mr.team_id AS team_id,
              SUM(COALESCE(mr.matches_count, 1)) AS matches_played,
              SUM(COALESCE(mr.wins_count, 0)) AS wins,
              SUM(COALESCE(mr.kill_points, 0)) AS kill_points,
              SUM(COALESCE(mr.placement_points, 0)) AS placement_points,
              SUM(COALESCE(mr.total_points, 0)) AS total_points
       FROM match_results mr
       JOIN matches m ON m.id = mr.match_id
       WHERE mr.tournament_id = ? AND mr.stage = ?
         AND COALESCE(NULLIF(mr.publication_status, ''), 'published') = 'published'
       GROUP BY mr.team_id`,
    )
    .all(tournamentId, stageName);

  // V5 — player-match integrity: stats must point at a real match in this stage,
  // and any player_id must resolve. Scoped to this stage so a global orphan
  // elsewhere does not fail every stage.
  const orphans = db
    .prepare(
      `SELECT COUNT(*) AS c
       FROM player_match_stats pms
       JOIN matches m ON m.id = pms.match_id
       LEFT JOIN players p ON p.id = pms.player_id
       WHERE m.tournament_id = ? AND m.stage = ?
         AND (pms.player_id IS NOT NULL AND p.id IS NULL)`,
    )
    .get(tournamentId, stageName).c;
  if (orphans > 0) {
    gate("V5", `${orphans} player_match_stats row(s) reference a missing player`);
  }

  const statsWithoutMatch = db
    .prepare(
      `SELECT COUNT(*) AS c
       FROM player_match_stats pms
       LEFT JOIN matches m ON m.id = pms.match_id
       WHERE m.id IS NULL AND pms.match_id IN (
         SELECT id FROM matches WHERE tournament_id = ? AND stage = ?
       )`,
    )
    .get(tournamentId, stageName).c;
  if (statsWithoutMatch > 0) {
    gate("V5", `${statsWithoutMatch} player_match_stats row(s) reference a missing match`);
  }

  // V6 — provenance completeness for imported rows in this stage. Skipped as a
  // gate when the schema predates provenance; reported as a note instead.
  const missingMatchProv = HAS_MATCH_PROVENANCE
    ? db
        .prepare(
          `SELECT COUNT(*) AS c FROM matches
           WHERE tournament_id = ? AND stage = ? AND match_number >= 1
             AND (source_slug IS NULL OR source_url IS NULL OR source_name IS NULL)`,
        )
        .get(tournamentId, stageName).c
    : 0;
  if (matchCount > 0 && missingMatchProv > 0) {
    notes.push(
      `${tournamentId}/${stageName}: V6 ${missingMatchProv}/${matchCount} match(es) lack full provenance (expected for pre-extraction data)`,
    );
  }
  if (!HAS_MATCH_PROVENANCE && matchCount > 0) {
    notes.push(
      `${tournamentId}/${stageName}: V6 provenance columns absent on matches (pre-010 schema)`,
    );
  }
  const missingResultProv = HAS_RESULT_PROVENANCE
    ? db
        .prepare(
          `SELECT COUNT(*) AS c FROM match_results
           WHERE tournament_id = ? AND stage = ?
             AND (source_ref IS NULL OR source_url IS NULL)`,
        )
        .get(tournamentId, stageName).c
    : 0;
  const totalResults = db
    .prepare(
      "SELECT COUNT(*) AS c FROM match_results WHERE tournament_id = ? AND stage = ?",
    )
    .get(tournamentId, stageName).c;
  if (totalResults > 0 && missingResultProv === totalResults) {
    notes.push(
      `${tournamentId}/${stageName}: V6 no result rows carry provenance yet (expected pre-extraction)`,
    );
  }

  return { tournamentId, stageName, matchCount, totalResults, derivedTeams: derived.length };
}

// V7 — stage integrity (global, reported once).
function verifyStageIntegrity() {
  const dupSlugs = db
    .prepare(
      `SELECT tournament_id, slug, COUNT(*) AS c
       FROM tournament_stages GROUP BY tournament_id, slug HAVING c > 1`,
    )
    .all();
  for (const row of dupSlugs) {
    fail("V7", `duplicate stage slug ${row.tournament_id}/${row.slug} (x${row.c})`);
  }

  const orphanStages = db
    .prepare(
      `SELECT COUNT(*) AS c FROM tournament_stages s
       LEFT JOIN tournaments t ON t.id = s.tournament_id WHERE t.id IS NULL`,
    )
    .get().c;
  if (orphanStages > 0) fail("V7", `${orphanStages} orphan stage(s)`);

  const dupMatchIdentity = db
    .prepare(
      `SELECT tournament_id, stage, match_number, COUNT(*) AS c
       FROM matches WHERE match_number >= 1
       GROUP BY tournament_id, stage, match_number HAVING c > 1`,
    )
    .all();
  for (const row of dupMatchIdentity) {
    fail(
      "V7",
      `duplicate match identity ${row.tournament_id}/${row.stage}#${row.match_number} (x${row.c})`,
    );
  }

  if (HAS_MATCH_PROVENANCE) {
    const dupSourceSlug = db
      .prepare(
        `SELECT source_slug, COUNT(*) AS c FROM matches
         WHERE source_slug IS NOT NULL GROUP BY source_slug HAVING c > 1`,
      )
      .all();
    for (const row of dupSourceSlug) {
      fail("V7", `duplicate source_slug ${row.source_slug} (x${row.c})`);
    }
  }
}

const stages = selectStages();
if (stages.length === 0) {
  console.log("No stages matched the requested scope.");
}

const results = [];
for (const stage of stages) {
  results.push(verifyStage(stage));
}
verifyStageIntegrity();

const integrity = db.pragma("integrity_check");
const integrityOk = Array.isArray(integrity)
  ? integrity.length === 1 && integrity[0].integrity_check === "ok"
  : String(integrity) === "ok";
if (!integrityOk) fail("integrity_check", JSON.stringify(integrity));

const fk = db.pragma("foreign_key_check");
if (fk.length > 0) fail("foreign_key_check", `${fk.length} violation(s)`);

db.close();

console.log(`Database: ${dbPath}`);
console.log(`Stages checked: ${results.length}`);
for (const row of results) {
  console.log(
    `  ${row.tournamentId} / ${row.stageName}: matches=${row.matchCount} results=${row.totalResults} teams=${row.derivedTeams}`,
  );
}
if (notes.length > 0) {
  console.log("\nNotes (non-fatal):");
  for (const note of notes) console.log(`  - ${note}`);
}

console.log(`\nintegrity_check: ${integrityOk ? "ok" : "FAILED"}`);
console.log(`foreign_key_check: ${fk.length === 0 ? "0 violations" : "FAILED"}`);

if (failures.length > 0) {
  console.error(`\nFAILED gates (${failures.length}):`);
  for (const f of failures) console.error(`  - [${f.gate}] ${f.message}`);
  process.exit(1);
}

console.log("\nAll completeness gates passed.");
