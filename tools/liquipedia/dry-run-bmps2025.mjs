#!/usr/bin/env node
// Phase 2 single-stage dry-run pilot: BMPS 2025 Grand Finals.
//
// Scope is deliberately one stage. This tool never writes to the production
// database. It:
//   1. hashes production (main + WAL + SHM) before and after,
//   2. reads the authoritative team identity from a read-only production handle,
//   3. copies production to throwaway SQLite files under the system temp dir,
//   4. parses the captured Liquipedia wikitext into the canonical payload,
//   5. validates arithmetic and reconciles against the existing synthetic snapshot,
//   6. materialises the payload into the COPIES and runs the completeness validator,
//   7. asserts the production hash is unchanged and writes a JSON report.
//
// Player-match statistics are intentionally absent: the source does not publish
// per-match player data. That is recorded as SOURCE_NOT_AVAILABLE, not a failure.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..", "..");
const PROD_DB = path.join(REPO_ROOT, "server", "data", "stagecore.sqlite");
const FIXTURE = path.join(REPO_ROOT, "tests", "fixtures", "bmps2025-grand-finals.wikitext");
const VALIDATOR = path.join(REPO_ROOT, "tools", "verify-stage-completeness.mjs");

const TARGET = {
  tournamentId: "843e95ec-51ab-4cff-8b1d-ceb5ebfcce1c",
  tournamentName: "Battlegrounds Mobile India Pro Series 2025",
  stage: "Grand Finals",
  expectedMatches: 18,
  expectedTeamsPerMatch: 16,
  expectedResultRows: 288,
};

const SOURCE = {
  source_name: "Liquipedia",
  page_name: "Battlegrounds_Mobile_India_Pro_Series/2025",
  page_url: "https://liquipedia.net/pubgmobile/Battlegrounds_Mobile_India_Pro_Series/2025",
  slug_prefix: "liquipedia:bmps2025",
  retrieved_at: "2026-09-26",
  checksum: "sha256:" + crypto.createHash("sha256").update(fs.readFileSync(FIXTURE)).digest("hex"),
  license: "CC BY-SA 3.0",
};

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
}
const has = (name) => process.argv.includes(`--${name}`);
const reportPath = arg("report", path.join(REPO_ROOT, "tools", "reports", "phase2-bmps2025-gf-dry-run.json"));

function sha256File(p) {
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}
function dbFingerprint(p) {
  const main = sha256File(p);
  const wal = sha256File(`${p}-wal`);
  const shm = sha256File(`${p}-shm`);
  return {
    main_sha256: main,
    main_bytes: fs.existsSync(p) ? fs.statSync(p).size : null,
    wal_present: fs.existsSync(`${p}-wal`),
    wal_sha256: wal,
    wal_bytes: fs.existsSync(`${p}-wal`) ? fs.statSync(`${p}-wal`).size : 0,
    shm_present: fs.existsSync(`${p}-shm`),
    shm_sha256: shm,
  };
}
function copyDb(src, destDir, name = "stagecore.sqlite") {
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, name);
  fs.copyFileSync(src, dest);
  for (const suffix of ["-wal", "-shm"]) {
    if (fs.existsSync(`${src}${suffix}`)) fs.copyFileSync(`${src}${suffix}`, `${dest}${suffix}`);
  }
  return dest;
}

const parser = await import("./parser.mjs");
const Database = (await import("better-sqlite3")).default;

// Guard: never operate on the production path with the application.
if (path.resolve(PROD_DB) !== PROD_DB) throw new Error("unexpected production path");

const before = dbFingerprint(PROD_DB);

// Authoritative team identity, read read-only. No writes, no WAL creation.
const prod = new Database(PROD_DB, { readonly: true, fileMustExist: true });
const coreTeams = prod
  .prepare(
    `SELECT tm.id AS team_id, tm.name AS name, mr.placement AS placement,
            mr.kill_points AS kill_points, mr.placement_points AS placement_points,
            mr.total_points AS total_points, mr.wins_count AS wins_count,
            mr.matches_count AS matches_count
       FROM matches m
       JOIN match_results mr ON mr.match_id = m.id
       JOIN teams tm ON tm.id = mr.team_id
      WHERE m.tournament_id = ? AND m.stage = ?
        AND (m.match_number = 0 OR m.match_number IS NULL)
      ORDER BY mr.placement`,
  )
  .all(TARGET.tournamentId, TARGET.stage);
prod.close();

const teamIdByKey = {};
for (const row of coreTeams) teamIdByKey[parser.teamMatchKey(row.name)] = row.team_id;

// --- Parse ---------------------------------------------------------------
const wikitext = fs.readFileSync(FIXTURE, "utf8");
const parsed = parser.parseGrandFinalsWikitext(wikitext, {
  expectedMatches: TARGET.expectedMatches,
  expectedTeams: TARGET.expectedTeamsPerMatch,
});

const missingIdentity = parsed.teams
  .filter((t) => !teamIdByKey[t.match_key])
  .map((t) => ({ name: t.name, match_key: t.match_key }));

// Aggregate the per-match source rows per team, so they can be compared with the
// cumulative synthetic snapshot (the only CORE-derived value that exists here).
const sourceAgg = {};
for (const team of parsed.teams) {
  const entry = { team: team.name, match_key: team.match_key, kills: 0, placement_points: 0, total_points: 0, wins: 0, matches: 0 };
  for (const decoded of Object.values(parsed.matrix[team.slug] || {})) {
    entry.kills += decoded.kills;
    const pp = parsed.pointsTable[decoded.placement] ?? 0;
    entry.placement_points += pp;
    entry.total_points += decoded.kills + pp;
    entry.wins += decoded.placement === 1 ? 1 : 0;
    entry.matches += 1;
  }
  sourceAgg[team.match_key] = entry;
}

const coreByKey = {};
for (const row of coreTeams) {
  coreByKey[parser.teamMatchKey(row.name)] = {
    team_id: row.team_id,
    name: row.name,
    placement: row.placement,
    kill_points: row.kill_points,
    placement_points: row.placement_points,
    total_points: row.total_points,
    wins_count: row.wins_count,
    matches_count: row.matches_count,
  };
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
    team_match_key: src.match_key,
    core_team: core?.name ?? null,
    source_value: `${src.kills}/${src.placement_points}/${src.total_points}`,
    source_detail: { kills: src.kills, placement_points: src.placement_points, total_points: src.total_points, wins: src.wins, matches: src.matches },
    core_value: core ? `${core.kill_points}/${core.placement_points}/${core.total_points}` : null,
    core_detail: core ? { kill_points: core.kill_points, placement_points: core.placement_points, total_points: core.total_points, wins_count: core.wins_count, matches_count: core.matches_count } : null,
    total_agrees: core ? src.total_points === core.total_points : null,
    total_comparison: core ? `${src.total_points} vs ${core.total_points}` : "no CORE value",
    discrepancy_classification: classification,
    adjudication_status: classification === parser.FIELD_EXACT ? "NOT_REQUIRED" : "UNRESOLVED",
  });
}
const disputed = reconciliation.filter((r) => r.discrepancy_classification === parser.DISPUTED_SPLIT_TOTAL_AGREES);
const fieldExact = reconciliation.filter((r) => r.discrepancy_classification === parser.FIELD_EXACT);
const totalsOnly = reconciliation.filter((r) => r.discrepancy_classification === parser.TOTALS_ONLY_AGREE);

// --- Canonical payload ---------------------------------------------------
const payload = parser.buildCanonicalPayload({
  tournament: { id: TARGET.tournamentId, name: TARGET.tournamentName },
  stage: TARGET.stage,
  parsed,
  teamIdByKey,
  source: SOURCE,
  reconciledRows: reconciliation,
  identityUnresolved: missingIdentity,
  disputePolicy: "PRESERVE_DISPUTE_V1",
});
const arithmeticErrors = parser.validateArithmetic(payload);

// Per-match source detail for any disputed team, so the review gate can inspect
// the exact rows behind a split disagreement without re-deriving them.
function disputedTeamMatchDetail(teamMatchKey) {
  const team = parsed.teams.find((t) => t.match_key === teamMatchKey);
  if (!team) return null;
  return parsed.matches.map((match) => {
    const entry = parsed.matrix[team.slug][match.match_number];
    const hasPoints = Object.prototype.hasOwnProperty.call(parsed.pointsTable, entry.placement);
    return {
      match_number: match.match_number,
      placement: entry.placement,
      kills: entry.kills,
      placement_points: hasPoints ? parsed.pointsTable[entry.placement] : 0,
      placement_points_source: hasPoints ? "source_points_table" : "outside_points_table",
    };
  });
}

// --- Materialise into copies and validate ---------------------------------
// Each copy is mutated by a child process, because server/db.js holds a single
// connection at module scope. Production is only ever touched read-only.
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "phase2-bmps2025-"));
const payloadPath = path.join(tmpRoot, "payload.json");
fs.writeFileSync(payloadPath, JSON.stringify(payload, null, 2));
const APPLY = path.join(__dirname, "apply-copy.mjs");
const results = {};

function runValidatorOn(dbPath) {
  try {
    const stdout = execFileSync(
      process.execPath,
      [VALIDATOR, "--db", dbPath, "--tournament", TARGET.tournamentId, "--stage", TARGET.stage],
      { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { code: 0, stdout, stderr: "" };
  } catch (error) {
    return { code: error.status ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
  }
}
function runApply(dbPath, mode, twice = false) {
  const argv = [APPLY, "--payload", payloadPath, "--mode", mode];
  if (twice) argv.push("--twice");
  const stdout = execFileSync(process.execPath, argv, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, NODE_ENV: "test", CORE_DB_PATH: dbPath },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const line = stdout.split("\n").find((l) => l.startsWith("__APPLY_JSON__"));
  if (!line) throw new Error(`apply-copy produced no JSON marker: ${stdout.slice(0, 400)}`);
  return JSON.parse(line.slice("__APPLY_JSON__".length));
}

// State A: plain enrichStage with the synthetic snapshot retained. This is the
// state that must never be applied, and it demonstrates why the replace has to
// happen in the same transaction.
{
  const copy = copyDb(PROD_DB, path.join(tmpRoot, "stateA"));
  const hashBefore = sha256File(copy);
  const applied = runApply(copy, "enrich");
  const validator = runValidatorOn(copy);
  results.stateA_enrichStage_synthetic_retained = {
    apply_summary: applied.applied,
    counts: applied.afterFirst,
    copy_hash_changed: hashBefore !== sha256File(copy),
    validator_code: validator.code,
    validator_failure: (validator.stderr.match(/\[V3 [^\]]+\] [^\n]+/) || [null])[0],
    classification: (validator.stdout.match(/classification=(\w+)/) || [null, null])[1],
  };
}

// State B: replaceSyntheticSnapshot - the intended end state, on a copy only.
// The production synthetic snapshot is untouched.
{
  const copy = copyDb(PROD_DB, path.join(tmpRoot, "stateB"));
  const applied = runApply(copy, "replace");
  const validator = runValidatorOn(copy);
  results.stateB_replaceSynthetic = {
    apply_summary: applied.applied,
    counts: applied.afterFirst,
    validator_code: validator.code,
    validator_stdout: validator.stdout,
    validator_stderr: validator.stderr,
    classification: (validator.stdout.match(/classification=(\w+)/) || [null, null])[1],
    canonical_rows_consistent: applied.canonical_rows_consistent,
    inconsistent_canonical_rows: applied.inconsistent_canonical_rows,
  };
}

// Idempotency: a second identical replace on the same copy must converge.
{
  const copy = copyDb(PROD_DB, path.join(tmpRoot, "stateC"));
  const applied = runApply(copy, "replace", true);
  results.idempotency = {
    first: applied.applied,
    second: applied.second,
    afterFirst: applied.afterFirst,
    afterSecond: applied.afterSecond,
    converged: applied.converged,
  };
}

const after = dbFingerprint(PROD_DB);
// Main-database bytes are the authoritative production content. A read-only open
// can create a zero-length -wal and touch -shm metadata, so those are reported
// and compared separately rather than treated as data mutation on their own.
const productionMainUnchanged = before.main_sha256 === after.main_sha256;
const productionWalUnchanged = before.wal_sha256 === after.wal_sha256;
const productionShmUnchanged = before.shm_sha256 === after.shm_sha256;
const producedWalShm =
  (!before.wal_present && after.wal_present && (after.wal_bytes ?? 0) === 0) ||
  (!before.shm_present && after.shm_present);
const productionUnchanged = productionMainUnchanged && productionWalUnchanged;

const report = {
  generated_at: new Date().toISOString(),
  parser_version: parser.PARSER_VERSION,
  target: TARGET,
  source: SOURCE,
  coverage: {
    expected_matches: TARGET.expectedMatches,
    extracted_matches: payload.matches.length,
    expected_teams_per_match: TARGET.expectedTeamsPerMatch,
    extracted_teams: parsed.teams.length,
    expected_result_rows: TARGET.expectedResultRows,
    extracted_result_rows: payload.match_results.length,
    teams_per_match: [...new Set(Object.values(payload.resultsByMatch).map((r) => r.length))],
    missing_fields: { team_identity_unresolved: missingIdentity },
  },
  validation: {
    parser_issues: parsed.issues,
    arithmetic_errors: arithmeticErrors,
    points_table: parsed.pointsTable,
    match_numbers: payload.matches.map((m) => m.match_number),
    all_matches_have_provenance: payload.matches.every((m) => m.source_slug && m.source_url && m.source_name),
    all_results_have_provenance: payload.match_results.every((r) => r.source_ref && r.source_url),
    canonical_rows_consistent: payload.validation.canonical_rows_consistent,
    canonical_consistency_errors: payload.validation.canonical_consistency_errors,
    player_match_stats: payload.match_results.length === 0 ? 0 : 0,
    player_match_stats_status: "SOURCE_NOT_AVAILABLE",
    player_match_stats_reason: "Liquipedia source does not publish per-match player statistics for this stage.",
  },
  dispute_policy: payload.dispute_policy,
  reconciliation: {
    field_exact: fieldExact.length,
    disputed_split_total_agrees: disputed.length,
    totals_only_agree: totalsOnly.length,
    identity_unresolved: missingIdentity.length,
    rows: reconciliation,
    disputed_rows: disputed.map((d) => ({
      ...d,
      source_per_match: disputedTeamMatchDetail(d.team_match_key),
    })),
    disputed_per_match_note:
      "Per-match source rows are shown for review only. No adjudication is performed: the split is presented as-is for a later decision gate.",
  },
  dry_run_state_A_enrichStage: results.stateA_enrichStage_synthetic_retained,
  dry_run_state_B_replaceSynthetic: results.stateB_replaceSynthetic,
  idempotency: results.idempotency,
  production_safety: {
    production_path: PROD_DB,
    before,
    after,
    production_main_sha256_unchanged: productionMainUnchanged,
    production_wal_content_unchanged: productionWalUnchanged,
    production_shm_unchanged: productionShmUnchanged,
    sidecar_files_created_by_readonly_open: producedWalShm,
    production_modified: !productionUnchanged,
    synthetic_snapshot_deleted: false,
    enrichment_applied: false,
    historical_extraction_applied: false,
    production_opened_readonly_only: true,
  },
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// --- Console summary -----------------------------------------------------
console.log("=== Phase 2 dry-run: BMPS 2025 Grand Finals ===");
console.log(`Parser: v${parser.PARSER_VERSION}`);
console.log(`Source: ${SOURCE.source_name} ${SOURCE.page_url}`);
console.log(`Checksum: ${SOURCE.checksum}`);
console.log("");
console.log(`Matches:  ${payload.matches.length} / ${TARGET.expectedMatches}`);
console.log(`Teams:    ${parsed.teams.length} / ${TARGET.expectedTeamsPerMatch}`);
console.log(`Rows:     ${payload.match_results.length} / ${TARGET.expectedResultRows}`);
console.log(`Teams per match: ${JSON.stringify(report.coverage.teams_per_match)}`);
console.log(`Match numbers: ${report.validation.match_numbers[0]}..${report.validation.match_numbers.at(-1)}`);
console.log(`Parser issues: ${parsed.issues.length}`);
console.log(`Arithmetic errors: ${arithmeticErrors.length}`);
console.log(`Points table: ${JSON.stringify(parsed.pointsTable)}`);
console.log("");
console.log(`Reconciliation: field_exact=${fieldExact.length} disputed=${disputed.length} totals_only=${totalsOnly.length} identity_unresolved=${missingIdentity.length}`);
for (const d of disputed) {
  console.log(`  DISPUTED ${d.team}: source ${d.source_value} vs CORE ${d.core_value} (total ${d.total_comparison}) -> ${d.adjudication_status}`);
}
console.log("");
console.log(`player_match_stats: 0 (SOURCE_NOT_AVAILABLE)`);
console.log("");
console.log(`Dispute policy: ${payload.dispute_policy.policy_version} canonical_value_source=${payload.dispute_policy.policy.canonical_value_source} adjudicated=${payload.dispute_policy.policy.adjudicated} overwrite=${payload.dispute_policy.policy.overwrite_existing}`);
console.log(`  canonical rows internally consistent: ${payload.validation.canonical_rows_consistent}`);
console.log(`  disputes carried: ${payload.dispute_policy.disputes.length} (existing CORE value preserved, not overwritten)`);
console.log("");
console.log("State A (enrichStage, synthetic retained): validator exit", results.stateA_enrichStage_synthetic_retained.validator_code, `classification=${results.stateA_enrichStage_synthetic_retained.classification}`);
console.log("  ", results.stateA_enrichStage_synthetic_retained.validator_failure);
console.log("State B (replaceSyntheticSnapshot): validator exit", results.stateB_replaceSynthetic.validator_code, `classification=${results.stateB_replaceSynthetic.classification}`);
console.log("  ", (results.stateB_replaceSynthetic.validator_stdout.match(/real_match_count=\d+ synthetic_match_count=\d+ real_matches_with_results=\d+ real_result_rows=\d+ synthetic_result_rows=\d+ classification=\w+/) || ["(no line)"])[0]);
console.log(`State B apply summary: ${JSON.stringify(results.stateB_replaceSynthetic.apply_summary)}`);
console.log(`State B canonical rows consistent in DB: ${results.stateB_replaceSynthetic.canonical_rows_consistent} (${results.stateB_replaceSynthetic.inconsistent_canonical_rows} inconsistent)`);
console.log(`Idempotency converged: ${results.idempotency.converged}`);
console.log("");
console.log(`PRODUCTION MODIFIED: ${productionUnchanged ? "NO" : "YES"}`);
console.log(`Report: ${reportPath}`);

fs.rmSync(tmpRoot, { recursive: true, force: true });
if (!productionUnchanged) process.exit(4);
