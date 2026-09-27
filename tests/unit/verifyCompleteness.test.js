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

  test("fails when a synthetic aggregate coexists with real per-match rows", async () => {
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
