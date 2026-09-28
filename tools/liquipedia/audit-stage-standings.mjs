#!/usr/bin/env node
// Read-only Phase 3 audit of stage_standings coverage across every tournament and
// stage in CORE.
//
// This tool performs NO writes. It opens the target database with
// `readonly: true` plus `PRAGMA query_only = ON` and only SELECTs. Its job is to
// establish, per stage, whether standings can be reconstructed from published
// match-level results or must come from an authoritative published source, and to
// surface every integrity anomaly as a dispute rather than silently fixing it.
//
// It deliberately does not decide what "correct" standings are. It reports the
// evidence and the conflicts; the operator adjudicates.
//
// Usage:
//   node tools/liquipedia/audit-stage-standings.mjs --db <path> [--json <file>] [--rehearsal]

import fs from "node:fs";
import path from "node:path";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
};
const has = (name) => process.argv.includes(`--${name}`);

const dbPath = arg("db");
if (!dbPath) {
  console.error("Usage: node tools/liquipedia/audit-stage-standings.mjs --db <path> [--json <file>]");
  console.error("This is read-only. Point --db at the database to inspect.");
  process.exit(2);
}
const guard = await import("./production-target-guard.mjs");
let target;
try {
  target = guard.assertProductionTarget(dbPath, {
    allowRehearsal: has("rehearsal"),
    rehearsalReason: has("rehearsal") ? "operator passed --rehearsal" : undefined,
  });
} catch (error) {
  console.error(String(error.message));
  process.exit(3);
}
console.log(`Target: ${guard.describeTarget(target)} (${path.resolve(dbPath)})`);

const { DatabaseSync } = await import("node:sqlite");
const db = new DatabaseSync(dbPath, { readOnly: true });
db.exec("PRAGMA query_only = ON");
const q = (sql, params = []) => db.prepare(sql).all(...params);
const one = (sql, params = []) => db.prepare(sql).get(...params);

// Standings are aggregated from match_results using the same publication rules as
// server/services/stageStandings.js and src/lib/matchResultPublication.js: a row
// counts only when it is published AND no sibling row for the same match is draft.
const PUBLISHED = `
  COALESCE(NULLIF(mr.publication_status, ''), 'published') = 'published'
  AND mr.match_id NOT IN (
    SELECT match_id FROM match_results
    WHERE COALESCE(NULLIF(publication_status, ''), 'published') <> 'published'
  )
`;

// ---------------------------------------------------------------------------
// 1. Coverage per stage
// ---------------------------------------------------------------------------
const stages = q(`
  SELECT ts.id, ts.name AS stage, t.id AS tournament_id, t.name AS tournament
  FROM tournament_stages ts JOIN tournaments t ON t.id = ts.tournament_id
  ORDER BY t.name, ts.stage_order
`);

const coverage = stages.map((s) => {
  const standingRows = one(
    "SELECT COUNT(*) c FROM stage_standings WHERE stage_id = ?",
    [s.id],
  ).c;
  const realMatches = one(
    `SELECT COUNT(*) c FROM matches m
     WHERE m.tournament_id = ? AND m.stage = ? AND COALESCE(m.match_number, 0) >= 1`,
    [s.tournament_id, s.stage],
  ).c;
  const synthetic = one(
    `SELECT COUNT(*) c FROM matches m
     WHERE m.tournament_id = ? AND m.stage = ?
       AND (m.match_number = 0 OR m.match_number IS NULL) AND m.map = 'Other'`,
    [s.tournament_id, s.stage],
  ).c;
  // Matches that actually carry published result rows - the only thing standings
  // can legitimately be rebuilt from.
  const resultBacked = one(
    `SELECT COUNT(DISTINCT mr.match_id) c FROM match_results mr
     JOIN matches m ON m.id = mr.match_id
     WHERE m.tournament_id = ? AND m.stage = ? AND ${PUBLISHED}`,
    [s.tournament_id, s.stage],
  ).c;
  // Result rows sitting on real per-match rows. "Real" follows the codebase's own
  // definition in enrichment.js: a synthetic cumulative snapshot is
  // (match_number = 0 OR NULL) AND map = 'Other'. Anything else is a real match,
  // even when match_number is NULL (some stages legitimately have no numbering).
  const perMatchBacked = one(
    `SELECT COUNT(DISTINCT mr.match_id) c FROM match_results mr
     JOIN matches m ON m.id = mr.match_id
     WHERE m.tournament_id = ? AND m.stage = ?
       AND NOT ((m.match_number = 0 OR m.match_number IS NULL) AND m.map = 'Other')
       AND ${PUBLISHED}`,
    [s.tournament_id, s.stage],
  ).c;
  // Rows per result-backed match, to detect partial boards (e.g. 1 row where a
  // 16-team board is expected). A partial board cannot substantiate standings.
  const rowsPerMatch = perMatchBacked > 0
    ? one(
        `SELECT ROUND(AVG(cnt), 1) a FROM (
           SELECT COUNT(*) cnt FROM match_results mr
           JOIN matches m ON m.id = mr.match_id
           WHERE m.tournament_id = ? AND m.stage = ?
             AND NOT ((m.match_number = 0 OR m.match_number IS NULL) AND m.map = 'Other')
             AND ${PUBLISHED}
           GROUP BY mr.match_id)`,
        [s.tournament_id, s.stage],
      ).a
    : null;
  // Result rows sitting on a synthetic cumulative snapshot (match_number 0/NULL,
  // map = Other). These are a stage total, not per-match data; standings cannot be
  // reconstructed from them, only compared against them.
  const aggregateBacked = one(
    `SELECT COUNT(DISTINCT mr.match_id) c FROM match_results mr
     JOIN matches m ON m.id = mr.match_id
     WHERE m.tournament_id = ? AND m.stage = ?
       AND (m.match_number = 0 OR m.match_number IS NULL) AND m.map = 'Other'
       AND ${PUBLISHED}`,
    [s.tournament_id, s.stage],
  ).c;

  let classification;
  if (perMatchBacked > 0) classification = "RECONSTRUCTABLE";
  else if (aggregateBacked > 0) classification = "AGGREGATE_ONLY";
  else if (standingRows > 0) classification = "SOURCE_ONLY";
  else classification = "EMPTY";

  return {
    tournament: s.tournament,
    tournament_id: s.tournament_id,
    stage: s.stage,
    stage_id: s.id,
    standings_rows: standingRows,
    real_matches: realMatches,
    synthetic_matches: synthetic,
    result_backed_matches: resultBacked,
    per_match_backed_matches: perMatchBacked,
    aggregate_backed_matches: aggregateBacked,
    rows_per_match: rowsPerMatch,
    classification,
  };
});

// ---------------------------------------------------------------------------
// 2. Disputes
// ---------------------------------------------------------------------------
const disputes = [];
const add = (code, severity, detail) => disputes.push({ code, severity, ...detail });

// D-1: stored vs derived disagreement on result-backed stages. Components and
// totals are compared separately because the two can disagree independently.
for (const c of coverage.filter((x) => x.classification === "RECONSTRUCTABLE")) {
  const stored = q(
    `SELECT tm.id, tm.name, ss.rank, ss.place_points, ss.elim_points, ss.total_points
     FROM stage_standings ss
     JOIN teams tm ON tm.id = ss.team_id
     WHERE ss.stage_id = ?`,
    [c.stage_id],
  );
  const derived = q(
    `SELECT mr.team_id AS id, SUM(COALESCE(mr.placement_points,0)) place,
            SUM(COALESCE(mr.kill_points,0)) elim, SUM(COALESCE(mr.total_points,0)) total
     FROM match_results mr JOIN matches m ON m.id = mr.match_id
     WHERE m.tournament_id = ? AND m.stage = ? AND ${PUBLISHED}
     GROUP BY mr.team_id`,
    [c.tournament_id, c.stage],
  );
  const byId = new Map(derived.map((d) => [d.id, d]));
  const storedIds = new Set(stored.map((s) => s.id));
  const derivedIds = new Set(derived.map((d) => d.id));

  for (const s of stored) {
    const d = byId.get(s.id);
    if (!d) {
      add("STANDING_WITHOUT_RESULTS", "high", {
        tournament: c.tournament, stage: c.stage, team: s.name,
        note: "standing row has no result rows to back it",
      });
      continue;
    }
    const componentsMatch =
      Number(s.place_points || 0) === Number(d.place || 0) &&
      Number(s.elim_points || 0) === Number(d.elim || 0);
    const totalsMatch = Number(s.total_points || 0) === Number(d.total || 0);
    if (!componentsMatch || !totalsMatch) {
      add("STORED_VS_DERIVED_MISMATCH", "high", {
        tournament: c.tournament, stage: c.stage, team: s.name,
        stored: {
          place: Number(s.place_points || 0),
          elim: Number(s.elim_points || 0),
          total: Number(s.total_points || 0),
        },
        derived: {
          place: Number(d.place || 0),
          elim: Number(d.elim || 0),
          total: Number(d.total || 0),
        },
        components_match: componentsMatch,
        totals_match: totalsMatch,
      });
    }
  }
  for (const id of derivedIds) {
    if (!storedIds.has(id)) {
      add("RESULTS_WITHOUT_STANDING", "medium", {
        tournament: c.tournament, stage: c.stage,
        team_id: id,
        note: "team has result rows but no standing row",
      });
    }
  }
}

// D-2: internal arithmetic. place + elim should equal total. Split into two
// distinct codes because they mean different things:
//   - components zero with non-zero total => components simply not broken out yet
//     (the breakdown table is empty, so this is expected in bulk)
//   - components non-zero and not summing => a real conflict
const arithmetic = q(
  `SELECT t.name AS tournament, ts.name AS stage, tm.name AS team,
          ss.place_points, ss.elim_points, ss.total_points
   FROM stage_standings ss
   JOIN tournaments t ON t.id = ss.tournament_id
   JOIN tournament_stages ts ON ts.id = ss.stage_id
   JOIN teams tm ON tm.id = ss.team_id
   WHERE COALESCE(ss.place_points,0) + COALESCE(ss.elim_points,0) <> COALESCE(ss.total_points,0)`,
);
for (const r of arithmetic) {
  const place = Number(r.place_points || 0);
  const elim = Number(r.elim_points || 0);
  const total = Number(r.total_points || 0);
  const breakdownAbsent = place === 0 && elim === 0 && total > 0;
  add(breakdownAbsent ? "BREAKDOWN_NOT_RECORDED" : "ARITHMETIC_CONFLICT",
    breakdownAbsent ? "low" : "high", {
      tournament: r.tournament, stage: r.stage, team: r.team,
      place, elim, total, gap: place + elim - total,
    });
}

// D-3: match_results arithmetic.
for (const r of q(
  `SELECT t.name AS tournament, m.stage AS stage, tm.name AS team,
          mr.placement_points, mr.kill_points, mr.total_points
   FROM match_results mr
   JOIN matches m ON m.id = mr.match_id
   JOIN tournaments t ON t.id = m.tournament_id
   JOIN teams tm ON tm.id = mr.team_id
   WHERE COALESCE(mr.placement_points,0) + COALESCE(mr.kill_points,0) <> COALESCE(mr.total_points,0)`,
)) {
  add("RESULT_ARITHMETIC_CONFLICT", "high", {
    tournament: r.tournament, stage: r.stage, team: r.team,
    place: Number(r.placement_points || 0),
    elim: Number(r.kill_points || 0),
    total: Number(r.total_points || 0),
  });
}

// D-4: rank ordering. A lower rank (better) must not carry more points.
for (const s of q("SELECT DISTINCT stage_id, tournament_id FROM stage_standings")) {
  const rows = q(
    "SELECT rank, COALESCE(total_points,0) tp FROM stage_standings WHERE stage_id = ? ORDER BY rank",
    [s.stage_id],
  );
  for (let i = 1; i < rows.length; i += 1) {
    if (rows[i].tp > rows[i - 1].tp) {
      const meta = one(
        `SELECT t.name AS tournament, ts.name AS stage FROM tournament_stages ts
         JOIN tournaments t ON t.id = ts.tournament_id WHERE ts.id = ?`,
        [s.stage_id],
      );
      add("RANK_ORDER_CONFLICT", "medium", {
        tournament: meta.tournament, stage: meta.stage,
        higher_rank: rows[i - 1].rank, higher_points: rows[i - 1].tp,
        lower_rank: rows[i].rank, lower_points: rows[i].tp,
      });
      break;
    }
  }
}

// D-5: identity. Every standing must reference a real team and stage, and the
// stage must belong to the same tournament the standing claims.
for (const r of q(
  `SELECT ss.id, ss.team_id, ss.stage_id, ss.tournament_id
   FROM stage_standings ss
   LEFT JOIN teams tm ON tm.id = ss.team_id
   LEFT JOIN tournament_stages ts ON ts.id = ss.stage_id
   WHERE tm.id IS NULL OR ts.id IS NULL OR ts.tournament_id <> ss.tournament_id`,
)) {
  add("IDENTITY_BROKEN", "high", {
    standing_id: r.id, team_id: r.team_id, stage_id: r.stage_id,
  });
}

// D-6: duplicates.
for (const r of q(
  `SELECT stage_id, COALESCE(group_id,'-') grp, team_id, COUNT(*) n
   FROM stage_standings GROUP BY 1,2,3 HAVING n > 1`,
)) {
  add("DUPLICATE_TEAM_IN_BOARD", "high", {
    stage_id: r.stage_id, group_id: r.grp, team_id: r.team_id, count: r.n,
  });
}
for (const r of q(
  `SELECT stage_id, COALESCE(group_id,'-') grp, rank, COUNT(*) n
   FROM stage_standings WHERE rank IS NOT NULL GROUP BY 1,2,3 HAVING n > 1`,
)) {
  add("DUPLICATE_RANK_IN_BOARD", "high", {
    stage_id: r.stage_id, group_id: r.grp, rank: r.rank, count: r.n,
  });
}

// D-7: breakdown table entirely absent while standings carry totals.
const breakdownRows = one("SELECT COUNT(*) c FROM stage_match_breakdown").c;
const standingsWithTotals = one(
  "SELECT COUNT(*) c FROM stage_standings WHERE COALESCE(total_points,0) > 0",
).c;
if (breakdownRows === 0 && standingsWithTotals > 0) {
  add("BREAKDOWN_TABLE_EMPTY", "medium", {
    breakdown_rows: breakdownRows,
    standings_with_totals: standingsWithTotals,
    note: "no per-match breakdown exists to substantiate any stored total",
  });
}

// D-8: stages with a synthetic aggregate still present. For a stage with real
// result rows this double-counts; for a stage with nothing else it is the only
// representation. Distinguished by whether real result-backed matches exist.
for (const c of coverage.filter((x) => x.synthetic_matches > 0)) {
  add(
    c.result_backed_matches > 0 ? "SYNTHETIC_COEXISTS_WITH_RESULTS" : "SYNTHETIC_PLACEHOLDER_ONLY",
    c.result_backed_matches > 0 ? "high" : "low",
    {
      tournament: c.tournament, stage: c.stage,
      synthetic_matches: c.synthetic_matches,
      result_backed_matches: c.result_backed_matches,
    },
  );
}

// D-9: real result rows attached to placeholder-shaped matches (match_number = 0
// or NULL). `replaceSyntheticSnapshot` deletes every match in that shape, so a
// later apply on this stage would destroy these results. Flagged as high because
// it is a data-loss hazard, not a display issue.
for (const r of q(
  `SELECT t.name AS tournament, m.stage AS stage, m.match_number, m.map,
          COUNT(DISTINCT m.id) matches, COUNT(mr.id) result_rows
   FROM matches m
   JOIN tournaments t ON t.id = m.tournament_id
   JOIN match_results mr ON mr.match_id = m.id
   WHERE (m.match_number = 0 OR m.match_number IS NULL) AND m.map <> 'Other'
   GROUP BY t.name, m.stage, m.match_number, m.map`,
)) {
  add("PLACEHOLDER_SHAPED_MATCH_HAS_RESULTS", "high", {
    tournament: r.tournament, stage: r.stage,
    match_number: r.match_number, map: r.map,
    matches: r.matches, result_rows: r.result_rows,
    note: "replaceSyntheticSnapshot would delete these rows on a future apply",
  });
}

// D-10: result-backed stages whose per-match boards are too thin to substantiate
// standings (e.g. 1 result row where a full team board is expected). These are
// classified RECONSTRUCTABLE by presence of results, so the coverage matrix alone
// would overstate them; this makes the gap explicit.
for (const c of coverage.filter((x) => x.per_match_backed_matches > 0)) {
  if (Number(c.rows_per_match) < 8) {
    add("PARTIAL_RESULT_BOARD", "medium", {
      tournament: c.tournament, stage: c.stage,
      result_backed_matches: c.per_match_backed_matches,
      rows_per_match: c.rows_per_match,
      note: "results exist but are too sparse to substantiate a full standings board",
    });
  }
}

// ---------------------------------------------------------------------------
// 3. Report
// ---------------------------------------------------------------------------
const byClass = { RECONSTRUCTABLE: 0, AGGREGATE_ONLY: 0, SOURCE_ONLY: 0, EMPTY: 0 };
for (const c of coverage) byClass[c.classification] += 1;
const bySeverity = disputes.reduce((acc, d) => {
  acc[d.severity] = (acc[d.severity] || 0) + 1;
  return acc;
}, {});
const byCode = disputes.reduce((acc, d) => {
  acc[d.code] = (acc[d.code] || 0) + 1;
  return acc;
}, {});

const report = {
  generated_at: new Date().toISOString(),
  database: path.resolve(dbPath),
  read_only: true,
  summary: {
    tournaments: one("SELECT COUNT(*) c FROM tournaments").c,
    stages: stages.length,
    stages_with_standings: one("SELECT COUNT(DISTINCT stage_id) c FROM stage_standings").c,
    standings_rows: one("SELECT COUNT(*) c FROM stage_standings").c,
    breakdown_rows: breakdownRows,
    classifications: byClass,
    disputes_by_severity: bySeverity,
    disputes_by_code: byCode,
  },
  coverage,
  disputes,
};

console.log("\n=== Phase 3 stage_standings audit (read-only) ===");
console.log(`Tournaments: ${report.summary.tournaments}   Stages: ${report.summary.stages}`);
console.log(`Standings rows: ${report.summary.standings_rows} across ${report.summary.stages_with_standings} stages`);
console.log(`Breakdown rows: ${report.summary.breakdown_rows}`);
console.log("\nReconstructability:");
console.log(`  RECONSTRUCTABLE (published per-match results) : ${byClass.RECONSTRUCTABLE}`);
console.log(`  AGGREGATE_ONLY  (stage total only, no per-match) : ${byClass.AGGREGATE_ONLY}`);
console.log(`  SOURCE_ONLY     (standings, no match results) : ${byClass.SOURCE_ONLY}`);
console.log(`  EMPTY           (neither)                     : ${byClass.EMPTY}`);

console.log("\nDisputes by code:");
for (const [code, n] of Object.entries(byCode).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${code}`);
}

const out = arg("json");
if (out) {
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nWrote: ${out}`);
}

// Read-only by construction; exit non-zero only to signal that disputes exist.
db.close();
process.exit(disputes.some((d) => d.severity === "high") ? 1 : 0);
