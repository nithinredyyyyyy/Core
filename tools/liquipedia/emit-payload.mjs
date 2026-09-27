#!/usr/bin/env node
// Emit the enrichment payload for BMPS 2025 Grand Finals in the exact shape
// `tools/enrich-stage.mjs --file` consumes.
//
// This replaces the custom apply path used by the dry-run pilot. Enrichment must
// run through `enrich-stage.mjs` (AGENTS.md: it is the only supported way to run
// enrichment), so the artifact this produces is what the operator passes to
// `--apply --replace-synthetic`.
//
// The payload carries `tournamentId`, `stage`, and the flattened `matches` /
// `resultsByMatch` arrays. Team ids are read read-only from the target database so
// identity is authoritative there, never guessed here.
//
// Usage:
//   node tools/liquipedia/emit-payload.mjs --db <path> [--out <file>] [--apply]
//
// --apply is NOT honored here: this tool only writes a JSON artifact and reports.
// Passing it prints a reminder that the supported apply is enrich-stage.mjs.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..", "..");
const FIXTURE = path.join(REPO_ROOT, "tests", "fixtures", "bmps2025-grand-finals.wikitext");

const TARGET = {
  tournamentId: "843e95ec-51ab-4cff-8b1d-ceb5ebfcce1c",
  tournamentName: "Battlegrounds Mobile India Pro Series 2025",
  stage: "Grand Finals",
  expectedMatches: 18,
  expectedTeamsPerMatch: 16,
  expectedResultRows: 288,
};

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
}
const has = (name) => process.argv.includes(`--${name}`);

const dbPath = arg("db");
if (!dbPath) {
  console.error("Usage: node tools/liquipedia/emit-payload.mjs --db <path> [--out <file>]");
  console.error("Point --db at the database whose team identity should be used.");
  process.exit(2);
}
// Never target a throwaway database by accident. A rehearsal against a copy needs
// the explicit --rehearsal flag; production needs no flag and must resolve to the
// mounted persistent disk.
const guard = await import("./production-target-guard.mjs");
const rehearsal = has("rehearsal");
let target;
try {
  target = guard.assertProductionTarget(dbPath, {
    allowRehearsal: rehearsal,
    rehearsalReason: rehearsal ? "operator passed --rehearsal" : undefined,
  });
} catch (error) {
  console.error(error.message);
  process.exit(3);
}
if (!fs.existsSync(dbPath)) {
  console.error(`Database not found: ${dbPath}`);
  process.exit(2);
}
const outPath = arg("out", path.join(REPO_ROOT, "tools", "reports", "phase2-bmps2025-gf-payload.json"));
console.log(`Target: ${guard.describeTarget(target)}`);

const parser = await import("./parser.mjs");
const Database = (await import("better-sqlite3")).default;

const source = {
  source_name: "Liquipedia",
  page_name: "Battlegrounds_Mobile_India_Pro_Series/2025",
  page_url: "https://liquipedia.net/pubgmobile/Battlegrounds_Mobile_India_Pro_Series/2025",
  slug_prefix: "liquipedia:bmps2025",
  retrieved_at: "2026-09-26",
  checksum: "sha256:" + crypto.createHash("sha256").update(fs.readFileSync(FIXTURE)).digest("hex"),
  license: "CC BY-SA 3.0",
};

// Read-only: resolves existing team identity. The database is never modified here.
const db = new Database(dbPath, { readonly: true, fileMustExist: true });
const existingTeams = db
  .prepare(
    `SELECT tm.id AS team_id, tm.name AS name,
            mr.kill_points, mr.placement_points, mr.total_points, mr.wins_count
       FROM matches m
       JOIN match_results mr ON mr.match_id = m.id
       JOIN teams tm ON tm.id = mr.team_id
      WHERE m.tournament_id = ? AND m.stage = ?
        AND (m.match_number = 0 OR m.match_number IS NULL)`,
  )
  .all(TARGET.tournamentId, TARGET.stage);

// Existing per-match placeholders, so a map change on an existing row is
// classified against the approved decision record rather than applied silently.
const existingMatches = db
  .prepare(
    `SELECT match_number, map FROM matches
      WHERE tournament_id = ? AND stage = ? AND match_number IS NOT NULL AND match_number >= 1
      ORDER BY match_number`,
  )
  .all(TARGET.tournamentId, TARGET.stage);
db.close();

const teamIdByKey = {};
const coreByKey = {};
for (const row of existingTeams) {
  const key = parser.teamMatchKey(row.name);
  teamIdByKey[key] = row.team_id;
  coreByKey[key] = row;
}

const parsed = parser.parseGrandFinalsWikitext(fs.readFileSync(FIXTURE, "utf8"), {
  expectedMatches: TARGET.expectedMatches,
  expectedTeams: TARGET.expectedTeamsPerMatch,
});

const unresolved = parsed.teams.filter((t) => !teamIdByKey[t.match_key]).map((t) => t.name);
if (unresolved.length > 0) {
  console.error(`Unresolved team identity (no CORE row found): ${unresolved.join(", ")}`);
  process.exit(1);
}

// Reconcile the source-derived aggregate against the existing CORE snapshot, so
// the payload carries the dispute classification and the retained CORE values
// instead of dropping them. This mirrors the dry-run pilot's reconciliation.
const sourceAgg = {};
for (const row of parser.buildResultRows({ parsed, teamIdByKey })) {
  const agg = (sourceAgg[row.team_match_key] ||= {
    team: row.team_name,
    match_key: row.team_match_key,
    kills: 0,
    placement_points: 0,
    total_points: 0,
  });
  agg.kills += row.kills;
  agg.placement_points += row.placement_points;
  agg.total_points += row.total_points;
}

const reconciliation = [];
for (const [key, src] of Object.entries(sourceAgg)) {
  const core = coreByKey[key] ?? null;
  const classification = parser.classifyRow(
    { kills: src.kills, placement_points: src.placement_points, starting_points: 0, total_points: src.total_points },
    core,
  );
  reconciliation.push({
    scope: "aggregate over 18 matches",
    match_number: null,
    team: src.team,
    team_match_key: key,
    core_team: core?.name ?? null,
    source_value: `${src.kills}/${src.placement_points}/${src.total_points}`,
    source_detail: { kills: src.kills, placement_points: src.placement_points, total_points: src.total_points },
    core_value: core ? `${core.kill_points}/${core.placement_points}/${core.total_points}` : null,
    core_detail: core
      ? { kill_points: core.kill_points, placement_points: core.placement_points, total_points: core.total_points }
      : null,
    total_agrees: core ? src.total_points === core.total_points : null,
    total_comparison: core ? `${src.total_points} vs ${core.total_points}` : "no CORE value",
    discrepancy_classification: classification,
    adjudication_status: classification === parser.FIELD_EXACT ? "NOT_REQUIRED" : "UNRESOLVED",
  });
}

const canonical = parser.buildCanonicalPayload({
  tournament: { id: TARGET.tournamentId, name: TARGET.tournamentName },
  stage: TARGET.stage,
  parsed,
  teamIdByKey,
  source,
  reconciledRows: reconciliation,
  disputePolicy: "PRESERVE_DISPUTE_V1",
});

// Classify map differences against the approved, per-pilot decision record. This
// is what makes the m4/m10/m16 change auditable instead of silent: every observed
// difference is either an approved SOURCE_CORRECTION or an UNAPPROVED tripwire.
const sourceCorrection = await import("./source-correction-policy.mjs");
const mapReconciliation = sourceCorrection.buildMapReconciliation(
  existingMatches,
  canonical.matches,
);

const payload = {
  tournamentId: TARGET.tournamentId,
  stage: TARGET.stage,
  matches: canonical.matches,
  resultsByMatch: canonical.resultsByMatch,
  playerStats: canonical.playerStats,
  source: {
    source_name: source.source_name,
    source_url: source.page_url,
    retrieved_at: source.retrieved_at,
    checksum: source.checksum,
  },
  // Companion metadata for the operator/reviewer. enrich-stage.mjs ignores keys
  // it does not consume, so this travels with the artifact harmlessly.
  _metadata: {
    tournament_name: TARGET.tournamentName,
    expected_matches: TARGET.expectedMatches,
    expected_teams_per_match: TARGET.expectedTeamsPerMatch,
    expected_result_rows: TARGET.expectedResultRows,
    extracted_matches: canonical.matches.length,
    extracted_result_rows: canonical.match_results.length,
    canonical_rows_consistent: canonical.validation.canonical_rows_consistent,
    player_match_stats: 0,
    player_match_stats_status: "SOURCE_NOT_AVAILABLE",
    player_match_stats_reason: canonical.validation.player_match_stats_reason,
    dispute_policy: canonical.dispute_policy,
    map_reconciliation: mapReconciliation,
    reconciliation: {
      field_exact: reconciliation.filter((r) => r.discrepancy_classification === parser.FIELD_EXACT).length,
      disputed_split_total_agrees: reconciliation.filter(
        (r) => r.discrepancy_classification === parser.DISPUTED_SPLIT_TOTAL_AGREES,
      ).length,
      totals_only_agree: reconciliation.filter((r) => r.discrepancy_classification === parser.TOTALS_ONLY_AGREE).length,
      identity_unresolved: 0,
      rows: reconciliation,
    },
    provenance: canonical.provenance,
  },
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));

console.log("=== BMPS 2025 Grand Finals enrichment payload ===");
console.log(`Tournament:  ${TARGET.tournamentId} (${TARGET.tournamentName})`);
console.log(`Stage:       ${TARGET.stage}`);
console.log(`Matches:     ${payload.matches.length}`);
console.log(
  `Results:     ${Object.values(payload.resultsByMatch).reduce((n, rows) => n + rows.length, 0)}`,
);
console.log(`Player rows: ${payload.playerStats.length} (SOURCE_NOT_AVAILABLE)`);
console.log(`Consistent:  ${payload._metadata.canonical_rows_consistent}`);
console.log(`Disputes:    ${payload._metadata.dispute_policy.disputes.length} under ${payload._metadata.dispute_policy.policy_version}`);
console.log("");
console.log(`Map reconciliation (${mapReconciliation.policy_version}): ${mapReconciliation.corrections.length} approved correction(s)`);
for (const c of mapReconciliation.corrections) {
  console.log(`  ${c.status}  m${c.match_number} ${c.field}: ${c.existing_core} -> ${c.source}  [${c.policy}]`);
}
console.log(`  (${mapReconciliation.unchanged_count} match maps unchanged)`);
if (mapReconciliation.unapproved.length > 0) {
  console.log("");
  console.log("UNAPPROVED source differences — refusing to emit a safe payload:");
  for (const u of mapReconciliation.unapproved) {
    console.log(`  m${u.match_number} ${u.field}: core=${u.existing_core} source=${u.source} — ${u.detail}`);
  }
}
if (!mapReconciliation.approved_all_exercised) {
  console.log("");
  console.log("WARNING: approved corrections not exercised by the data:");
  for (const m of mapReconciliation.approved_not_exercised) {
    console.log(`  m${m.match_number} ${m.field} (approved ${m.existing_core} -> ${m.source})`);
  }
}
console.log("");
console.log(`Wrote:       ${outPath}`);
console.log("");
console.log("Dry run:  node tools/enrich-stage.mjs --file <payload>");
console.log("Apply:    node tools/enrich-stage.mjs --file <payload> --apply --replace-synthetic");
if (has("apply")) {
  console.log("");
  console.log("NOTE: --apply is not performed by this emitter. Use enrich-stage.mjs above.");
}

// A difference nobody approved must not reach an apply. The payload is still
// written for review, but the emitter exits non-zero so a pipeline stops here.
if (!mapReconciliation.safe_to_apply) {
  console.error("");
  console.error(`FAIL: ${mapReconciliation.unapproved.length} unapproved source difference(s). Review before applying.`);
  process.exit(1);
}
