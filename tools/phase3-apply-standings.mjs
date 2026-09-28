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

// Read the pre-migration state of the working copy directly, before importing
// server/db.js (whose import runs migrations 012/013). Without this the report
// would show PMWC 2024 as already absent, because the removal migration would
// have run before the first count.
const { default: Database } = await import("better-sqlite3");
const preDb = new Database(workDb, { readonly: true });
const preCount = (name) =>
  preDb.prepare("SELECT COUNT(*) AS c FROM tournaments WHERE name = ?").get(name).c;
const preState = {
  pmwc2024: preCount("PUBG Mobile World Cup 2024"),
  pmwc2025: preCount("PUBG Mobile World Cup 2025"),
  pmwc2026: preCount("PUBG Mobile World Cup 2026"),
  tournaments: preDb.prepare("SELECT COUNT(*) AS c FROM tournaments").get().c,
};
preDb.close();

// server/db.js opens whatever CORE_DB_PATH names, so this must be set before the
// first import of that module.
process.env.CORE_DB_PATH = workDb;
process.env.NODE_ENV = process.env.NODE_ENV || "test";

const { db } = await import(`${REPO_ROOT}/server/db.js`);
const { applyStandingsFixation } = await import(`${REPO_ROOT}/server/scripts/phase3StandingsFixation.js`);

const prodMd5 = fs.existsSync(PROD_DB) ? md5(PROD_DB) : null;

// ── pre-state (after migrations have run) ────────────────────────────────────
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
  second.disputes.length === 0;

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
  // "existing-rows" stages are partitioned across groups, so the board is the
  // whole stage; every other scope reads the single board it owns.
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
      `SELECT ss.rank, ssg.group_name, t.name AS team, ss.matches_played, ss.wins,
              ss.place_points, ss.elim_points, ss.total_points, ss.progression_status,
              ss.source_name, ss.source_url, ss.source_ref
         FROM stage_standings ss
         JOIN teams t ON t.id = ss.team_id
         JOIN tournament_stages ts ON ts.id = ss.stage_id
         JOIN tournaments tn ON tn.id = ss.tournament_id
         LEFT JOIN tournament_stage_groups ssg ON ssg.id = ss.group_id
        WHERE ${whereBoard}
        ORDER BY ss.rank`,
    )
    .all(...params);
  storedBoards.push({ ...target, rows: stageRow });
}

// Prove the write landed by asserting a couple of values that must have changed,
// straight from the working copy. This is a guard against a silently-skipped
// apply, not a substitute for the read-back table above.
function assertStored({ tournament, stage, group = null, team, field, value }) {
  const groupId = group
    ? db
        .prepare("SELECT id FROM tournament_stage_groups WHERE group_name = ? AND stage_id = (SELECT id FROM tournament_stages WHERE tournament_id = (SELECT id FROM tournaments WHERE name = ?) AND name = ?)")
        .get(group, tournament, stage)?.id
    : null;
  const row = db
    .prepare(
      `SELECT ss.${field} AS v FROM stage_standings ss
         JOIN teams tm ON tm.id = ss.team_id
         JOIN tournament_stages ts ON ts.id = ss.stage_id
         JOIN tournaments tn ON tn.id = ss.tournament_id
        WHERE tn.name = ? AND ts.name = ? AND tm.name = ? AND COALESCE(ss.group_id,'') = COALESCE(?,'')`,
    )
    .get(tournament, stage, team, groupId);
  if (!row) throw new Error(`assertStored: no row for ${tournament} / ${stage} / ${team}`);
  if (row.v !== value) {
    throw new Error(`assertStored: ${team} ${field} is ${row.v}, expected ${value}`);
  }
}

// PMWC 2025: the supplied Grand Finals board differs from CORE's stored split for
// several teams; these two must now carry the source values.
assertStored({ tournament: "PUBG Mobile World Cup 2025", stage: "Grand Finals", team: "POWR Esports", field: "place_points", value: 28 });
assertStored({ tournament: "PUBG Mobile World Cup 2025", stage: "Grand Finals", team: "POWR Esports", field: "elim_points", value: 61 });
// PMGC 2025 Group Green: "9z" must have resolved with its source split.
assertStored({ tournament: "PUBG Mobile Global Championship 2025", stage: "Group Stage", group: "Group Green", team: "9z Team", field: "place_points", value: 27 });
// BMPS 2026 Survival Stage was empty; its winner must now be stored with provenance.
assertStored({ tournament: "Battlegrounds Mobile India Pro Series 2026", stage: "Survival Stage", team: "Team Apex Gaming", field: "total_points", value: 137 });

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
    preMigration: preState.pmwc2024,
    afterMigrations: pmwc2024Before,
    after: pmwc2024After,
    expected: 0,
    removed: pmwc2024After === 0,
    removedByMigration: preState.pmwc2024 > 0 && pmwc2024Before === 0,
  },
  tournamentCountBefore: preState.tournaments,
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
  lines.push(`- Present in the starting database: ${r.pmwc2024.preMigration}`);
  lines.push(`- After migrations 009-013: ${r.pmwc2024.afterMigrations}`);
  lines.push(`- After apply: ${r.pmwc2024.after} (expected ${r.pmwc2024.expected})`);
  lines.push(`- Removed by the migration path: ${r.pmwc2024.removedByMigration}`);
  lines.push(`- Tournaments: ${r.tournamentCountBefore} -> ${r.tournamentCountAfter}`);
  lines.push(`- PMWC 2025 preserved: ${r.pmwc2025.preserved}`);
  lines.push(`- PMWC 2026 preserved: ${r.pmwc2026.preserved}`, "");
  lines.push("## Applied standings", "");
  lines.push("| Tournament | Stage | Group | Scope | Before | Expected | After | Inserted | Updated | Source |");
  lines.push("|---|---|---|---|---|---|---|---|---|---|");
  for (const t of r.applied) {
    lines.push(
      `| ${t.tournament} | ${t.stage} | ${t.group || "—"} | ${t.scope} | ${t.before} | ${t.expected} | ${t.after} | ${t.inserted} | ${t.updated} | ${t.source} |`,
    );
  }
  lines.push("", "## Source labels resolved to canonical teams", "");
  lines.push(
    "Every supplied label below resolved to an existing CORE team, so no team was",
    "created. The row's `team_id` points at the canonical team; the source's own",
    "wording is preserved here as the audit trail.", "",
  );
  const labelRows = [];
  for (const t of r.applied) {
    for (const l of t.sourceLabels || []) labelRows.push({ ...l, stage: `${t.tournament} / ${t.stage}` });
  }
  if (!labelRows.length) {
    lines.push("None — every supplied label already matched a canonical name.", "");
  } else {
    lines.push("| Stage | Supplied label | Canonical team | Team id |", "|---|---|---|---|");
    for (const l of labelRows) lines.push(`| ${l.stage} | ${l.supplied} | ${l.canonical} | \`${l.teamId}\` |`);
    lines.push("");
  }
  lines.push("", "## Disputes (prior CORE value retained; source value now canonical)", "");
  if (!r.disputes.length) {
    lines.push("None. Every supplied value matched stored state or was a clean insert.", "");
  } else {
    lines.push("| Team | Field | Prior CORE value | Source value |", "|---|---|---|---|");
    for (const d of r.disputes) {
      lines.push(`| ${d.team} | ${d.field} | ${d.stored} | ${d.supplied} |`);
    }
    lines.push("");
    lines.push(
      "Per `PRESERVE_DISPUTE_V1` the disagreement is represented, not adjudicated:",
      "the canonical row now carries the source value and the prior CORE value is",
      "kept here. The supplied total was validated against its own components",
      "before the write, so no stored row has components that disagree with its",
      "total.",
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
    "- CORE holds duplicate team rows for `Rising Esports` (`27fc2f1f` and",
    "  `02dd4d30`) and for `RiotNations` (`04780409`) vs `RiotNationZ` (`cb5e47df`).",
    "  This is a pre-existing data-integrity issue, reported here and NOT fixed:",
    "  the fixation pins the BMPS 2026 participant row for each name rather than",
    "  merging, renaming, or deleting a team.",
    "- BMPS 2025 Survival Stage was NOT created. The 32-team Survival board is",
    "  BMPS 2026's composition and CORE has no BMPS 2025 Survival Stage; the board",
    "  is written to `Battlegrounds Mobile India Pro Series 2026 / Survival Stage`.",
  );
  return lines.join("\n");
}
