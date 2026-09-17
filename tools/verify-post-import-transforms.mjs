import { db, entityConfigs, normalizeRecord } from "../server/db.js";
import { applyTournamentImportTransforms } from "../server/scripts/postImportTransforms.js";

const TARGET_TOURNAMENTS = [
  "PUBG Mobile World Cup 2024",
  "PUBG Mobile World Cup 2025",
  "PUBG Mobile World Cup 2026",
  "PUBG Mobile Global Championship 2025",
];

const FIELDS = [
  "tier",
  "prize_pool",
  "banner_url",
  "max_teams",
  "participants",
  "awards",
  "rankings",
  "prize_breakdown",
  "stages",
];

function stableStringify(value) {
  if (value === undefined) return "undefined";
  return JSON.stringify(value);
}

let hasMismatch = false;

for (const name of TARGET_TOURNAMENTS) {
  const row = db.prepare("SELECT * FROM tournaments WHERE name = ?").get(name);
  if (!row) {
    console.log(`${name}: MISSING`);
    hasMismatch = true;
    continue;
  }

  const stored = normalizeRecord(entityConfigs.Tournament, row);
  const transformed = applyTournamentImportTransforms(stored);
  const mismatches = FIELDS.filter(
    (field) => stableStringify(stored[field]) !== stableStringify(transformed[field]),
  );

  if (mismatches.length) {
    hasMismatch = true;
    console.log(`${name}: DIFF ${mismatches.join(", ")}`);
  } else {
    console.log(`${name}: OK`);
  }
}

process.exit(hasMismatch ? 1 : 0);
