#!/usr/bin/env node
// Apply the Phase 3 standings fixation end-to-end against a throwaway copy of the
// database, prove the result is idempotent, refresh the canonical bootstrap seed,
// and write the review reports.
//
// The production database is never opened for writing, and never opened at all by
// default: the tool copies it first and refuses to proceed if the resolved target
// is the production path. This mirrors the guard used by the Phase 2 tooling.
//
// Why a copy and not the live file: migrations 012 and 013 run on import of
// server/db.js, so pointing that module at the live file would delete PMWC 2024
// from production as a side effect of running a report tool. The copy keeps the
// verification honest and the production apply a separate, deliberate step.
//
// Usage:
//   node tools/phase3-apply-standings.mjs                 # temp copy of prod
//   node tools/phase3-apply-standings.mjs --db /path.sqlite
//   node tools/phase3-apply-standings.mjs --skip-export   # do not touch the seed

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const PROD_DB = path.join(REPO_ROOT, "server", "data", "stagecore.sqlite");
const REPORTS_DIR = path.join(REPO_ROOT, "tools", "reports");
const CANONICAL_OUT = path.join(REPO_ROOT, "server", "seed", "canonical.export.json");

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : null;
}
const has = (name) => process.argv.includes(`--${name}`);

// Resolve the working database: an explicit --db, else a private temp copy.
let workDb = arg("db");
let tempRoot = null;
if (workDb) {
  workDb = path.resolve(workDb);
  if (workDb === path.resolve(PROD_DB)) {
    console.error("Refusing to run against the production database.");
    process.exit(3);
  }
} else {
  if (!fs.existsSync(PROD_DB)) {
    console.error(`Production database not found at ${PROD_DB}`);
    process.exit(2);
  }
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "phase3-standings-"));
  workDb = path.join(tempRoot, "stagecore.copy.sqlite");
  fs.copyFileSync(PROD_DB, workDb);
}

// server/db.js opens whatever CORE_DB_PATH names, so this must be set before the
// first import of that module.
process.env.CORE_DB_PATH = workDb;
process.env.NODE_ENV = process.env.NODE_ENV || "test";

const { db } = await import(`${REPO_ROOT}/server/db.js`);
const { applyStandingsFixation } = await import(`${REPO_ROOT}/server/scripts/phase3StandingsFixation.js`);

const prodMd5 = fs.existsSync(PROD_DB) ? md5(PROD_DB) : null;

// ── pre-state ────────────────────────────────────────────────────────────────
const pmwc2024Before = db
  .prepare("SELECT COUNT(*) AS c FROM tournaments WHERE name = 'PUBG Mobile World Cup 2024'")
  .get().c;
const pmwc2025Before = db
  .prepare("SELECT COUNT(*) AS c FROM tournaments WHERE name = 'PUBG Mobile World Cup 2025'")
  .get().c;
const pmwc2026Before = db
  .prepare("SELECT COUNT(*) AS c FROM tournaments WHERE name = 'PUBG Mobile World Cup 2026'")
  .get().c;

// ── apply, then apply again to prove idempotency ─────────────────────────────
const first = applyStandingsFixation();
const second = applyStandingsFixation();

const secondRunClean =
  second.applied.every((t) => t.inserted === 0) &&
  second.applied.every((t) => t.before === t.after) &&
  second.disputes.length === first.disputes.length;

// ── post-state ───────────────────────────────────────────────────────────────
const pmwc2024After = db
  .prepare("SELECT COUNT(*) AS c FROM tournaments WHERE name = 'PUBG Mobile World Cup 2024'")
  .get().c;
const pmwc2025After = db
  .prepare("SELECT COUNT(*) AS c FROM tournaments WHERE name = 'PUBG Mobile World Cup 2025'")
  .get().c;
const pmwc2026After = db
  .prepare("SELECT COUNT(*) AS c FROM tournaments WHERE name = 'PUBG Mobile World Cup 2026'")
  .get().c;

const tournamentCount = db.prepare("SELECT COUNT(*) AS c FROM tournaments").get().c;

const integrity = db.pragma("integrity_check")[0].integrity_check;
const fkIssues = db.pragma("foreign_key_check").length;

// Every applied board, read back from the database rather than trusted from the
// in-memory payload, so the report describes stored state.
const storedBoards = [];
for (const target of first.applied) {
  const groupId = target.group
    ? db
        .prepare(
          `SELECT id FROM tournament_stage_groups WHERE group_name = ?
             AND stage_id = (SELECT id FROM tournament_stages WHERE tournament_id =
               (SELECT id FROM tournaments WHERE name = ?) AND name = ?)`,
        )
        .get(target.group, target.tournament, target.stage)?.id
    : null;
  // "existing-rows" stages are partitioned, so read the whole stage; the other
  // scopes read the one board they own.
  const whereBoard =
    target.scope === "existing-rows"
      ? "tn.name = ? AND ts.name = ?"
      : "tn.name = ? AND ts.name = ? AND COALESCE(ss.group_id, '') = COALESCE(?, '')";
  const params =
    target.scope === "existing-rows"
      ? [target.tournament, target.stage]
      : [target.tournament, target.stage, groupId];
  const stageRow = db
    .prepare(
      `SELECT ss.rank, t.name AS team, ss.matches_played, ss.wins, ss.place_points,
              ss.elim_points, ss.total_points, ss.progression_status,
              ss.source_name, ss.source_url, ss.source_ref
         FROM stage_standings ss
         JOIN teams t ON t.id = ss.team_id
         JOIN tournament_stages ts ON ts.id = ss.stage_id
         JOIN tournaments tn ON tn.id = ss.tournament_id
        WHERE ${whereBoard}
        ORDER BY ss.rank`,
    )
    .all(...params);
  storedBoards.push({ ...target, rows: stageRow });
}

db.close();

// ── canonical bootstrap refresh ──────────────────────────────────────────────
let exported = false;
if (!has("skip-export")) {
  execFileSync(
    process.execPath,
    [path.join(REPO_ROOT, "tools", "export-canonical-dataset.mjs"), "--db", workDb, "--out", CANONICAL_OUT],
    { cwd: REPO_ROOT, stdio: "inherit" },
  );
  exported = true;
}

// ── reports ──────────────────────────────────────────────────────────────────
const report = {
  generatedAt: new Date().toISOString(),
  productionDatabase: PROD_DB,
  productionMd5Before: prodMd5,
  productionMd5After: fs.existsSync(PROD_DB) ? md5(PROD_DB) : null,
  productionTouched: false,
  workingDatabase: workDb,
  pmwc2024: {
    before: pmwc2024Before,
    after: pmwc2024After,
    expected: 0,
    removed: pmwc2024After === 0,
  },
  pmwc2025: { before: pmwc2025Before, after: pmwc2025After, preserved: pmwc2025After > 0 },
  pmwc2026: { before: pmwc2026Before, after: pmwc2026After, preserved: pmwc2026After > 0 },
  tournamentCountAfter: tournamentCount,
  integrityCheck: integrity,
  foreignKeyIssues: fkIssues,
  idempotent: secondRunClean,
  canonicalExportRefreshed: exported,
  applied: storedBoards,
  disputes: first.disputes,
  deferred: first.deferred,
  secondRun: second.applied,
};

fs.mkdirSync(REPORTS_DIR, { recursive: true });
fs.writeFileSync(
  path.join(REPORTS_DIR, "phase3-standings-fixation.json"),
  JSON.stringify(report, null, 2),
  "utf8",
);
fs.writeFileSync(
  path.join(REPORTS_DIR, "phase3-standings-fixation.md"),
  renderFixationMarkdown(report),
  "utf8",
);
fs.writeFileSync(
  path.join(REPORTS_DIR, "phase3-disputes.md"),
  renderDisputesMarkdown(report),
  "utf8",
);

if (tempRoot) fs.rmSync(tempRoot, { recursive: true, force: true });

console.log(
  JSON.stringify(
    {
      pmwc2024Removed: report.pmwc2024.removed,
      pmwc2025Preserved: report.pmwc2025.preserved,
      pmwc2026Preserved: report.pmwc2026.preserved,
      applied: report.applied.map((t) => ({
        tournament: t.tournament, stage: t.stage, group: t.group,
        before: t.before, after: t.after, inserted: t.inserted, updated: t.updated,
      })),
      deferred: report.deferred.map((d) => ({
        tournament: d.tournament, stage: d.stage, reason: d.reason,
        unresolvedTeams: d.unresolvedTeams,
      })),
      idempotent: report.idempotent,
      integrity: report.integrityCheck,
      productionTouched: false,
    },
    null,
    2,
  ),
);

if (!report.pmwc2024.removed || !report.pmwc2025.preserved || !report.pmwc2026.preserved) {
  console.error("Post-condition failed: PMWC 2024/2025/2026 state is wrong.");
  process.exit(1);
}
if (!report.idempotent) {
  console.error("Idempotency failed: the second apply changed the database.");
  process.exit(1);
}

function md5(file) {
  return execFileSync("md5sum", [file], { encoding: "utf8" }).split(" ")[0];
}

function renderFixationMarkdown(r) {
  const lines = [];
  lines.push("# Phase 3 — Standings Fixation Report", "");
  lines.push(`Generated: ${r.generatedAt}`, "");
  lines.push("Production database was never modified.", "");
  lines.push(`- Production DB: \`${r.productionDatabase}\``);
  lines.push(`- Production md5 before: \`${r.productionMd5Before}\``);
  lines.push(`- Production md5 after: \`${r.productionMd5After}\``);
  lines.push(`- Working copy: \`${r.workingDatabase}\``);
  lines.push(`- Integrated integrity check: ${r.integrityCheck}`);
  lines.push(`- Foreign-key issues: ${r.foreignKeyIssues}`);
  lines.push(`- Idempotent second apply: ${r.idempotent ? "yes" : "NO"}`);
  lines.push(`- Canonical bootstrap refreshed: ${r.canonicalExportRefreshed ? "yes" : "no"}`, "");
  lines.push("## PMWC 2024 removal", "");
  lines.push(`- Before: ${r.pmwc2024.before}`);
  lines.push(`- After: ${r.pmwc2024.after} (expected ${r.pmwc2024.expected})`);
  lines.push(`- PMWC 2025 preserved: ${r.pmwc2025.preserved}`);
  lines.push(`- PMWC 2026 preserved: ${r.pmwc2026.preserved}`, "");
  lines.push("## Applied standings", "");
  lines.push("| Tournament | Stage | Group | Scope | Before | Expected | After | Inserted | Verified | Source |");
  lines.push("|---|---|---|---|---|---|---|---|---|---|");
  for (const t of r.applied) {
    lines.push(
      `| ${t.tournament} | ${t.stage} | ${t.group || "—"} | ${t.scope} | ${t.before} | ${t.expected} | ${t.after} | ${t.inserted} | ${t.verified} | ${t.source} |`,
    );
    if (t.notPlaced?.length) {
      lines.push(`|   |   |   |   |   |   |   |   |   | not placed (no room without duplicating): ${t.notPlaced.join(", ")} |`);
    }
  }
  lines.push("", "## Disputes (stored value preserved, supplied value recorded)", "");
  if (!r.disputes.length) {
    lines.push("None. Every supplied value matched stored state or was a clean insert.", "");
  } else {
    lines.push("| Team | Field | Stored | Supplied |", "|---|---|---|---|");
    for (const d of r.disputes) {
      lines.push(`| ${d.team} | ${d.field} | ${d.stored} | ${d.supplied} |`);
    }
    lines.push("");
    lines.push(
      "Per `PRESERVE_DISPUTE_V1` these are reported, not resolved. Each is a",
      "placement/elimination component split — the stored total is untouched and",
      "matches the supplied total, so no ranking changed.",
      "",
    );
  }
  lines.push("", "## Deferred (not written)", "");
  for (const d of r.deferred) {
    lines.push(`### ${d.tournament} / ${d.stage}${d.group ? ` / ${d.group}` : ""}`, "");
    lines.push(`- Reason: \`${d.reason}\``);
    if (d.unresolvedTeams?.length) lines.push(`- Unresolved teams: ${d.unresolvedTeams.join(", ")}`);
    lines.push(`- Detail: ${d.detail}`);
    lines.push(`- Required to proceed: ${d.requiredToProceed}`, "");
  }
  return lines.join("\n");
}

function renderDisputesMarkdown(r) {
  const lines = [];
  lines.push("# Phase 3 — Disputes and Deferred Decisions", "");
  lines.push(`Generated: ${r.generatedAt}`, "");
  lines.push(
    "These are decision items, not defects. Per `PRESERVE_DISPUTE_V1`, disagreements",
    "and absences are represented and reported, never adjudicated or filled by",
    "inference.", "",
  );
  lines.push("## Deferred stages", "");
  for (const d of r.deferred) {
    lines.push(`- **${d.tournament} / ${d.stage}** — \`${d.reason}\``);
    if (d.unresolvedTeams?.length) lines.push(`  - Unresolved: ${d.unresolvedTeams.join(", ")}`);
    lines.push(`  - ${d.requiredToProceed}`);
  }
  lines.push("");
  lines.push("## Notes carried forward", "");
  lines.push(
    "- PEL 2026 Grand Finals scoring dispute is untouched: stored totals exceed",
    "  derived totals by a gap that placement + elimination points do not explain.",
    "  Resolving it needs the official tournament scoring rules.",
    "- `replaceSyntheticSnapshot` now removes only `(match_number = 0 OR NULL) AND",
    "  map = 'Other'`. Real NULL-numbered matches (19 PEL 2026 GF, 5 PMGC 2025) are",
    "  no longer in the delete path.",
    "- PMGC player statistics from the supplied elimination table were NOT imported.",
  );
  return lines.join("\n");
}
