import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const TOOL = join(ROOT, "tools", "liquipedia", "audit-stage-standings.mjs");
const COMMITTED_DB = join(ROOT, "server", "data", "stagecore.sqlite");

const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

function run(dbPath, extra = []) {
  try {
    const out = execFileSync(
      process.execPath,
      [TOOL, "--db", dbPath, ...extra],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { code: 0, out };
  } catch (error) {
    return { code: error.status, out: `${error.stdout || ""}${error.stderr || ""}` };
  }
}

function withCopy(fn) {
  const dir = mkdtempSync(join("/tmp", "phase3-audit-"));
  const copy = join(dir, "stagecore.sqlite");
  copyFileSync(COMMITTED_DB, copy);
  try {
    return fn(copy, dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("phase 3 stage_standings audit", () => {
  test("is read-only: the inspected database is byte-identical afterwards", () => {
    withCopy((copy) => {
      const before = sha(copy);
      run(copy, ["--rehearsal"]);
      assert.equal(sha(copy), before);
    });
  });

  test("refuses a non-production target without --rehearsal", () => {
    withCopy((copy) => {
      const r = run(copy);
      assert.equal(r.code, 3);
      assert.match(r.out, /Refusing to operate on an unexpected database target/);
    });
  });

  test("runs against an explicit rehearsal target", () => {
    withCopy((copy) => {
      const r = run(copy, ["--rehearsal"]);
      // Exit 1 signals high-severity disputes were found, which is expected on the
      // committed dataset; the run itself must not crash.
      assert.ok(r.code === 0 || r.code === 1, `unexpected exit ${r.code}`);
      assert.match(r.out, /Phase 3 stage_standings audit/);
    });
  });

  test("reports the coverage matrix with all four classifications", () => {
    withCopy((copy) => {
      const r = run(copy, ["--rehearsal"]);
      for (const key of ["RECONSTRUCTABLE", "AGGREGATE_ONLY", "SOURCE_ONLY", "EMPTY"]) {
        assert.match(r.out, new RegExp(key));
      }
    });
  });

  test("classifies a synthetic snapshot as AGGREGATE_ONLY, not RECONSTRUCTABLE", () => {
    withCopy((copy, dir) => {
      const json = join(dir, "out.json");
      run(copy, ["--rehearsal", "--json", json]);
      const report = JSON.parse(readFileSync(json, "utf8"));
      // BMPS 2025 Grand Finals has only the synthetic aggregate at this point.
      const bmps = report.coverage.find(
        (c) => c.stage === "Grand Finals"
          && c.tournament === "Battlegrounds Mobile India Pro Series 2025",
      );
      assert.ok(bmps, "BMPS 2025 Grand Finals should be in coverage");
      assert.equal(bmps.classification, "AGGREGATE_ONLY");
      assert.equal(bmps.aggregate_backed_matches, 1);
      assert.equal(bmps.per_match_backed_matches, 0);
    });
  });

  test("classifies a stage with real per-match results as RECONSTRUCTABLE", () => {
    withCopy((copy, dir) => {
      const json = join(dir, "out.json");
      run(copy, ["--rehearsal", "--json", json]);
      const report = JSON.parse(readFileSync(json, "utf8"));
      const pel = report.coverage.find(
        (c) => c.tournament === "Peacekeeper Elite League 2026 Summer"
          && c.stage === "Grand Finals",
      );
      assert.ok(pel);
      assert.equal(pel.classification, "RECONSTRUCTABLE");
      assert.equal(pel.per_match_backed_matches, 19);
    });
  });

  test("flags stored-vs-derived disagreement on result-backed stages", () => {
    withCopy((copy, dir) => {
      const json = join(dir, "out.json");
      run(copy, ["--rehearsal", "--json", json]);
      const report = JSON.parse(readFileSync(json, "utf8"));
      const mism = report.disputes.filter((d) => d.code === "STORED_VS_DERIVED_MISMATCH");
      assert.ok(mism.length > 0, "expected stored/derived mismatches on PEL");
      const lg = mism.find((d) => d.team === "LGD Gaming");
      assert.ok(lg, "LGD Gaming should disagree between stored and derived");
      assert.equal(lg.stored.total, 172);
      assert.equal(lg.derived.total, 168);
      assert.equal(lg.components_match, true);
      assert.equal(lg.totals_match, false);
    });
  });

  test("flags the placeholder-shaped matches that hold real results", () => {
    withCopy((copy, dir) => {
      const json = join(dir, "out.json");
      run(copy, ["--rehearsal", "--json", json]);
      const report = JSON.parse(readFileSync(json, "utf8"));
      const haz = report.disputes.filter((d) => d.code === "PLACEHOLDER_SHAPED_MATCH_HAS_RESULTS");
      assert.ok(haz.length > 0);
      // PEL's 19 matches are match_number NULL with real maps; a future
      // replaceSyntheticSnapshot would delete all of them.
      const pel = haz.filter((d) => d.tournament === "Peacekeeper Elite League 2026 Summer");
      assert.ok(pel.length > 0, "PEL matches should be flagged as a deletion hazard");
      const maps = new Set(pel.map((d) => d.map));
      for (const m of ["Rondo", "Erangel", "Miramar"]) {
        assert.ok(maps.has(m), `expected ${m} among the flagged PEL maps`);
      }
      const totalRows = pel.reduce((n, d) => n + d.result_rows, 0);
      assert.equal(totalRows, 304);
    });
  });

  test("does not mutate the committed database", () => {
    const before = sha(COMMITTED_DB);
    run(COMMITTED_DB, ["--rehearsal"]);
    assert.equal(sha(COMMITTED_DB), before);
    assert.ok(existsSync(COMMITTED_DB));
  });
});
