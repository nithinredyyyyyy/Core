#!/usr/bin/env node
// Manual entry point for historical stage enrichment.
//
// Dry run by default: it validates the payload and reports what would change
// without writing anything. Pass --apply to commit, and --replace-synthetic to
// remove a synthetic aggregate snapshot for the stage as part of the same
// transaction. Nothing here runs at server startup — enrichment is always an
// explicit operator action.
//
// Payload shape (see server/seed/goldenFixture.js for a complete example):
//   {
//     "tournamentId": "...",
//     "stage": "Grand Finals",
//     "matches": [ { "stage", "match_number", "map", "source_slug", "source_url", "source_name", ... } ],
//     "resultsByMatch": { "<source_slug>": [ { "team_id", "placement", "kill_points", ... } ] },
//     "playerStats": [ { "match_key"|"match_id", "player_name", "team_id", "kills", ... } ],
//     "source": { "source_name", "source_url" }
//   }
//
// Usage:
//   node tools/enrich-stage.mjs --file stage.json
//   node tools/enrich-stage.mjs --file stage.json --apply
//   node tools/enrich-stage.mjs --file stage.json --apply --replace-synthetic

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : null;
}

const has = (name) => process.argv.includes(`--${name}`);

const file = arg("file");
if (!file) {
  console.error("Usage: node tools/enrich-stage.mjs --file <payload.json> [--apply] [--replace-synthetic]");
  process.exit(2);
}

const apply = has("apply");
const replaceSynthetic = has("replace-synthetic");
if (replaceSynthetic && !apply) {
  console.error("--replace-synthetic requires --apply (dry runs never modify the database).");
  process.exit(2);
}

const payload = JSON.parse(readFileSync(resolve(file), "utf8"));
if (!payload.tournamentId || !payload.stage) {
  console.error("Payload requires tournamentId and stage.");
  process.exit(2);
}

const enrichment = await import("../server/services/enrichment.js");
const { db } = await import("../server/db.js");

const stagesBefore = db
  .prepare("SELECT COUNT(*) c FROM tournament_stages WHERE tournament_id = ?")
  .get(payload.tournamentId).c;

console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}`);
console.log(`Tournament: ${payload.tournamentId}`);
console.log(`Stage: ${payload.stage}`);
console.log(
  `Payload: ${payload.matches?.length || 0} matches, ${
    Object.values(payload.resultsByMatch || {}).reduce((n, rows) => n + rows.length, 0)
  } results, ${payload.playerStats?.length || 0} player rows`,
);

if (apply) {
  const fn = replaceSynthetic ? enrichment.replaceSyntheticSnapshot : enrichment.enrichStage;
  const summary = fn({
    tournamentId: payload.tournamentId,
    stage: payload.stage,
    matches: payload.matches || [],
    resultsByMatch: payload.resultsByMatch || {},
    playerStats: payload.playerStats || [],
    source: payload.source || {},
  });
  console.log("Applied:", summary);
} else {
  // Validate without writing: every check below runs before any statement that
  // mutates data, then the transaction is rolled back.
  const { runInTransaction } = await import("../server/db.js");
  try {
    runInTransaction(() => {
      enrichment.enrichStage({
        tournamentId: payload.tournamentId,
        stage: payload.stage,
        matches: payload.matches || [],
        resultsByMatch: payload.resultsByMatch || {},
        playerStats: payload.playerStats || [],
        source: payload.source || {},
      });
      throw new Error("__dry_run_rollback__");
    });
  } catch (error) {
    if (error.message !== "__dry_run_rollback__") throw error;
  }
  console.log("Dry run validated the payload; rolled back with no writes.");
}

const stagesAfter = db
  .prepare("SELECT COUNT(*) c FROM tournament_stages WHERE tournament_id = ?")
  .get(payload.tournamentId).c;
console.log(`Stages for tournament: ${stagesBefore} -> ${stagesAfter}`);
db.close();
