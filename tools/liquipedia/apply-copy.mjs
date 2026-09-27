#!/usr/bin/env node
// Materialise a canonical payload into a throwaway database copy.
//
// Runs as its own process because server/db.js holds a single connection closed
// over by the persistence layer; importing it twice in one process would reuse a
// closed handle. The parent dry-run tool spawns this per copy. It refuses to run
// against the production file.
//
// Usage (internal):
//   node apply-copy.mjs --payload <payload.json> --mode <enrich|replace> [--twice]
//
// Prints a JSON summary on stdout.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..", "..");
const PROD_DB = path.join(REPO_ROOT, "server", "data", "stagecore.sqlite");

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : null;
}
const has = (name) => process.argv.includes(`--${name}`);

const payloadPath = arg("payload");
const mode = arg("mode");
const twice = has("twice");
const dbPath = process.env.CORE_DB_PATH;

if (!dbPath) {
  console.error("CORE_DB_PATH must be set");
  process.exit(2);
}
if (path.resolve(dbPath) === PROD_DB) {
  console.error("Refusing to run against the production database.");
  process.exit(3);
}
if (!payloadPath || !mode) {
  console.error("Usage: node apply-copy.mjs --payload <p.json> --mode <enrich|replace> [--twice]");
  process.exit(2);
}

const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
const { enrichStage, replaceSyntheticSnapshot } = await import(`${REPO_ROOT}/server/services/enrichment.js`);
const { db } = await import(`${REPO_ROOT}/server/db.js`);

const args = {
  tournamentId: payload.tournament.id,
  stage: payload.stage,
  matches: payload.matches,
  resultsByMatch: payload.resultsByMatch,
  playerStats: payload.playerStats,
  source: payload.source,
};
const run = mode === "replace" ? replaceSyntheticSnapshot : enrichStage;

const counts = () => ({
  matches_total: db.prepare("SELECT COUNT(*) c FROM matches WHERE tournament_id=? AND stage=?").get(args.tournamentId, args.stage).c,
  real_matches: db.prepare("SELECT COUNT(*) c FROM matches WHERE tournament_id=? AND stage=? AND match_number>=1").get(args.tournamentId, args.stage).c,
  synthetic_matches: db.prepare("SELECT COUNT(*) c FROM matches WHERE tournament_id=? AND stage=? AND (match_number=0 OR match_number IS NULL)").get(args.tournamentId, args.stage).c,
  results_total: db.prepare("SELECT COUNT(*) c FROM match_results WHERE tournament_id=? AND stage=?").get(args.tournamentId, args.stage).c,
  player_match_stats: db.prepare("SELECT COUNT(*) c FROM player_match_stats pms JOIN matches m ON m.id=pms.match_id WHERE m.tournament_id=? AND m.stage=?").get(args.tournamentId, args.stage).c,
  match_sources: db.prepare("SELECT COUNT(*) c FROM match_sources WHERE tournament_id=?").get(args.tournamentId).c,
});

const before = counts();
const summary = run(args);
const afterFirst = counts();
let second = null;
let afterSecond = null;
if (twice) {
  second = run(args);
  afterSecond = counts();
}
db.close();

process.stdout.write("__APPLY_JSON__" + JSON.stringify({
  mode,
  applied: summary,
  before,
  afterFirst,
  second,
  afterSecond,
  converged: afterSecond ? JSON.stringify(afterFirst) === JSON.stringify(afterSecond) : null,
}) + "\n");
