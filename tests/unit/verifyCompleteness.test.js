import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const repoRoot = join(fileURLToPath(import.meta.url), "..", "..", "..");
const validator = join(repoRoot, "tools", "verify-stage-completeness.mjs");
const dbUrl = new URL("../../server/db.js", import.meta.url).href;
const enrichmentUrl = new URL("../../server/services/enrichment.js", import.meta.url).href;
const fixtureUrl = new URL("../../server/seed/goldenFixture.js", import.meta.url).href;

const tempDirs = [];
function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), "stagecore-validator-"));
  tempDirs.push(dir);
  return dir;
}
after(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

async function seedDb(dbPath, { withSynthetic = false } = {}) {
  const { stdout } = await execFileAsync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
        const { db } = await import(${JSON.stringify(dbUrl)});
        const enr = await import(${JSON.stringify(enrichmentUrl)});
        const fx = await import(${JSON.stringify(fixtureUrl)});
        const now = new Date().toISOString();
        const T = "validator-tour";
        db.prepare("INSERT INTO tournaments (id, name, game, status, max_teams, created_date, updated_date) VALUES (?, 'Validator Cup', 'BGMI', 'completed', 16, ?, ?)").run(T, now, now);
        const teamIds = Array.from({ length: 16 }, (_, i) => "vt-" + (i + 1));
        for (const t of teamIds) db.prepare("INSERT INTO teams (id, name, tag, game, created_date, updated_date) VALUES (?, ?, 'VT', 'BGMI', ?, ?)").run(t, "Team " + t, now, now);
        const payload = fx.buildGoldenFixture({ tournamentId: T, teamIds });
        enr.enrichStage({
          tournamentId: T,
          stage: payload.stage,
          matches: payload.matches,
          resultsByMatch: payload.resultsByMatch,
          playerStats: payload.playerStats,
          source: payload.source,
        });
        ${
          withSynthetic
            ? `db.prepare("INSERT INTO matches (id, tournament_id, stage, match_number, map, status, created_date, updated_date) VALUES ('vt-synth', ?, ?, 0, 'Other', 'completed', ?, ?)").run(T, payload.stage, now, now);`
            : ""
        }
        db.close();
      `,
    ],
    { cwd: repoRoot, env: { ...process.env, NODE_ENV: "test", CORE_DB_PATH: dbPath } },
  );
  return stdout;
}

describe("verify-stage-completeness classification", () => {
  // Builds a stage with an exact match/synthetic/result shape so each branch of
  // the classifier can be asserted independently of the enrichment fixture.
  async function seedShaped(dbPath, { realMatches, synthetic = 0, resultsOnReal = 0 }) {
    await execFileAsync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
          const { db } = await import(${JSON.stringify(dbUrl)});
          const now = new Date().toISOString();
          const T = "shape-tour";
          const STAGE = "Shaped Stage";
          db.prepare("INSERT INTO tournaments (id, name, game, status, created_date, updated_date) VALUES (?, 'Shaped Cup', 'BGMI', 'completed', ?, ?)").run(T, now, now);
          db.prepare("INSERT INTO tournament_stages (id, tournament_id, name, slug, stage_order, created_date, updated_date) VALUES ('shape-stage', ?, ?, 'shaped-stage', 1, ?, ?)").run(T, STAGE, now, now);
          const teamIds = Array.from({ length: 16 }, (_, i) => "st-" + (i + 1));
          for (const t of teamIds) db.prepare("INSERT INTO teams (id, name, tag, game, created_date, updated_date) VALUES (?, ?, 'ST', 'BGMI', ?, ?)").run(t, "Shape " + t, now, now);

          for (let i = 1; i <= ${realMatches}; i += 1) {
            const mid = "shape-m" + i;
            db.prepare("INSERT INTO matches (id, tournament_id, stage, match_number, map, status, created_date, updated_date) VALUES (?, ?, ?, ?, 'Erangel', 'completed', ?, ?)").run(mid, T, STAGE, i, now, now);
            if (i <= ${resultsOnReal}) {
              for (let t = 0; t < 16; t += 1) {
                db.prepare("INSERT INTO match_results (id, match_id, tournament_id, team_id, placement, kill_points, placement_points, total_points, stage, created_date, updated_date) VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?)").run("shape-r-" + i + "-" + t, mid, T, teamIds[t], t + 1, STAGE, now, now);
              }
            }
          }
          ${
            synthetic > 0
              ? `const sid = "shape-synth";
                 db.prepare("INSERT INTO matches (id, tournament_id, stage, match_number, map, status, created_date, updated_date) VALUES (?, ?, ?, 0, 'Other', 'completed', ?, ?)").run(sid, T, STAGE, now, now);
                 for (let t = 0; t < 16; t += 1) {
                   db.prepare("INSERT INTO match_results (id, match_id, tournament_id, team_id, placement, kill_points, placement_points, total_points, stage, matches_count, created_date, updated_date) VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, ${realMatches || 1}, ?, ?)").run("shape-sr-" + t, sid, T, teamIds[t], t + 1, STAGE, now, now);
                 }`
              : ""
          }
          db.close();
        `,
      ],
      { cwd: repoRoot, env: { ...process.env, NODE_ENV: "test", CORE_DB_PATH: dbPath } },
    );
  }

  // The validator exits non-zero for genuinely incomplete stages (V1/V2), which
  // is correct. Classification assertions therefore read stdout/stderr directly
  // rather than treating a non-zero exit as a test failure.
  async function runValidator(dbPath) {
    try {
      const { stdout, stderr } = await execFileAsync(
        process.execPath,
        [validator, "--db", dbPath, "--all"],
        { cwd: repoRoot },
      );
      return { code: 0, stdout, stderr };
    } catch (error) {
      return { code: error.code, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
    }
  }

  function parse(stdout) {
    return {
      classification: stdout.match(/classification=([A-Z_]+)/)?.[1],
      realMatchCount: Number(stdout.match(/real_match_count=(\d+)/)?.[1]),
      syntheticMatchCount: Number(stdout.match(/synthetic_match_count=(\d+)/)?.[1]),
      realMatchesWithResults: Number(stdout.match(/real_matches_with_results=(\d+)/)?.[1]),
      realResultRows: Number(stdout.match(/real_result_rows=(\d+)/)?.[1]),
      syntheticResultRows: Number(stdout.match(/synthetic_result_rows=(\d+)/)?.[1]),
    };
  }

  test("Case 1: 1 synthetic + 18 real shells + 0 real results => SYNTHETIC_PLUS_EMPTY_SHELLS, real_match_count=18", async () => {
    const dbPath = join(tempDir(), "case1.sqlite");
    await seedShaped(dbPath, { realMatches: 18, synthetic: 1, resultsOnReal: 0 });
    const { stdout, stderr } = await runValidator(dbPath);
    assert.equal(parse(stdout).classification, "SYNTHETIC_PLUS_EMPTY_SHELLS");
    assert.equal(parse(stdout).realMatchCount, 18);
    assert.equal(parse(stdout).syntheticMatchCount, 1);
    assert.equal(parse(stdout).realMatchesWithResults, 0);
    assert.equal(parse(stdout).syntheticResultRows, 16);
    // Pre-extraction debt is a note; it must not be reported as double-counting.
    assert.match(stdout, /pre-extraction debt, no double-count yet/);
    assert.doesNotMatch(stderr, /SYNTHETIC_PLUS_REAL_RESULTS/);
    assert.doesNotMatch(stderr, /double-count/);
  });

  test("Case 2: 1 synthetic + 18 real matches + real results => SYNTHETIC_PLUS_REAL_RESULTS", async () => {
    const dbPath = join(tempDir(), "case2.sqlite");
    await seedShaped(dbPath, { realMatches: 18, synthetic: 1, resultsOnReal: 18 });
    const { code, stdout, stderr } = await runValidator(dbPath);
    assert.equal(code, 1);
    assert.equal(parse(stdout).classification, "SYNTHETIC_PLUS_REAL_RESULTS");
    assert.equal(parse(stdout).realMatchCount, 18);
    assert.equal(parse(stdout).realMatchesWithResults, 18);
    assert.match(stderr, /SYNTHETIC_PLUS_REAL_RESULTS/);
    assert.match(stderr, /double-count/);
  });

  test("Case 3: 12 real matches + 0 results + 0 synthetic => REAL_MATCHES_NO_RESULTS", async () => {
    const dbPath = join(tempDir(), "case3.sqlite");
    await seedShaped(dbPath, { realMatches: 12, synthetic: 0, resultsOnReal: 0 });
    const { code, stdout, stderr } = await runValidator(dbPath);
    assert.equal(code, 1, "a stage with unmatched results is incomplete");
    assert.equal(parse(stdout).classification, "REAL_MATCHES_NO_RESULTS");
    assert.equal(parse(stdout).realMatchCount, 12);
    assert.equal(parse(stdout).syntheticMatchCount, 0);
    assert.match(stderr, /results present for only 0/);
    assert.doesNotMatch(stderr, /SYNTHETIC_PLUS/);
  });

  test("Case 4: 0 real + 0 results + 0 synthetic => EMPTY_STAGE", async () => {
    const dbPath = join(tempDir(), "case4.sqlite");
    await seedShaped(dbPath, { realMatches: 0, synthetic: 0 });
    const { code, stdout, stderr } = await runValidator(dbPath);
    assert.equal(code, 1, "an empty stage is a genuine gap");
    assert.equal(parse(stdout).classification, "EMPTY_STAGE");
    assert.equal(parse(stdout).realMatchCount, 0);
    assert.equal(parse(stdout).syntheticMatchCount, 0);
    assert.equal(parse(stdout).realResultRows, 0);
    assert.match(stderr, /V1/);
  });

  test("synthetic snapshots never contribute to real_match_count", async () => {
    const dbPath = join(tempDir(), "synth-only.sqlite");
    await seedShaped(dbPath, { realMatches: 0, synthetic: 1 });
    const { stdout } = await runValidator(dbPath);
    const parsed = parse(stdout);
    assert.equal(parsed.classification, "SYNTHETIC_ONLY");
    assert.equal(parsed.realMatchCount, 0, "a match_number=0 snapshot must not count as a real match");
    assert.equal(parsed.syntheticMatchCount, 1);
    assert.equal(parsed.realResultRows, 0);
    assert.equal(parsed.syntheticResultRows, 16);
  });
});

describe("verify-stage-completeness tool", () => {
  let cleanDb;

  before(async () => {
    cleanDb = join(tempDir(), "clean.sqlite");
    await seedDb(cleanDb);
  });

  test("passes on a fully enriched stage", async () => {
    const { stdout } = await execFileAsync(
      process.execPath,
      [validator, "--db", cleanDb, "--all"],
      { cwd: repoRoot },
    );
    assert.match(stdout, /All completeness gates passed/);
    assert.match(stdout, /integrity_check: ok/);
    assert.match(stdout, /foreign_key_check: 0 violations/);
  });

  test("fails when a synthetic snapshot coexists with real matches that carry results", async () => {
    const dirtyDb = join(tempDir(), "dirty.sqlite");
    await seedDb(dirtyDb, { withSynthetic: true });

    await assert.rejects(
      execFileAsync(process.execPath, [validator, "--db", dirtyDb, "--all"], {
        cwd: repoRoot,
      }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /V3/);
        return true;
      },
    );
  });

  test("never writes to the database it inspects", async () => {
    const before = new Database(cleanDb, { readonly: true });
    const beforeCounts = ["matches", "match_results", "player_match_stats"].map(
      (t) => before.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c,
    );
    before.close();

    await execFileAsync(process.execPath, [validator, "--db", cleanDb, "--all"], {
      cwd: repoRoot,
    });

    const after = new Database(cleanDb, { readonly: true });
    const afterCounts = ["matches", "match_results", "player_match_stats"].map(
      (t) => after.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c,
    );
    after.close();

    assert.deepEqual(afterCounts, beforeCounts);
  });
});
