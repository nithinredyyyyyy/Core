import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const repoRoot = join(fileURLToPath(import.meta.url), "..", "..", "..");
const dbUrl = new URL("../../server/db.js", import.meta.url).href;
const enrichmentUrl = new URL("../../server/services/enrichment.js", import.meta.url).href;
const seedUrl = new URL("../../server/services/seed.js", import.meta.url).href;
const fixtureUrl = new URL("../../server/seed/goldenFixture.js", import.meta.url).href;
const exportTool = join(repoRoot, "tools", "export-canonical-dataset.mjs");

const TOURNAMENT_ID = "roundtrip-tour";
const TEAM_IDS = Array.from({ length: 16 }, (_, i) => `rt-team-${i + 1}`);

const tempDirs = [];
function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), "stagecore-roundtrip-"));
  tempDirs.push(dir);
  return dir;
}
after(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

async function runInline(script, env) {
  return execFileAsync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: repoRoot,
    env: { ...process.env, NODE_ENV: "test", ...env },
  });
}

describe("canonical export -> fresh bootstrap round-trip", () => {
  let sourceDbPath;
  let targetDbPath;
  let exportPath;

  before(async () => {
    sourceDbPath = join(tempDir(), "source.sqlite");
    targetDbPath = join(tempDir(), "target.sqlite");
    exportPath = join(tempDir(), "canonical.json");

    // Populate the source DB with the golden fixture through the enrichment path.
    await runInline(
      `
        const { db } = await import(${JSON.stringify(dbUrl)});
        const enr = await import(${JSON.stringify(enrichmentUrl)});
        const fx = await import(${JSON.stringify(fixtureUrl)});
        const now = new Date().toISOString();
        db.prepare("INSERT INTO tournaments (id, name, game, status, max_teams, created_date, updated_date) VALUES (?, 'Roundtrip Cup', 'BGMI', 'completed', 16, ?, ?)").run(${JSON.stringify(TOURNAMENT_ID)}, now, now);
        const teamIds = ${JSON.stringify(TEAM_IDS)};
        for (const t of teamIds) {
          db.prepare("INSERT INTO teams (id, name, tag, game, created_date, updated_date) VALUES (?, ?, 'RT', 'BGMI', ?, ?)").run(t, "Team " + t, now, now);
        }
        const payload = fx.buildGoldenFixture({ tournamentId: ${JSON.stringify(TOURNAMENT_ID)}, teamIds });
        enr.enrichStage({
          tournamentId: ${JSON.stringify(TOURNAMENT_ID)},
          stage: payload.stage,
          matches: payload.matches,
          resultsByMatch: payload.resultsByMatch,
          playerStats: payload.playerStats,
          source: payload.source,
        });
        db.close();
      `,
      { CORE_DB_PATH: sourceDbPath },
    );

    // Export the canonical dataset from the source DB (read-only tool).
    await execFileAsync(
      process.execPath,
      [exportTool, "--db", sourceDbPath, "--out", exportPath],
      { cwd: repoRoot },
    );

    // Bootstrap a fresh DB from the export. CORE_SEED_PATH is resolved against
    // cwd, so pass a path relative to the repo root.
    const relSeed = relative(repoRoot, exportPath);
    await runInline(
      `
        const { db } = await import(${JSON.stringify(dbUrl)});
        const seed = await import(${JSON.stringify(seedUrl)});
        seed.seedIfEmpty();
        db.close();
      `,
      { CORE_DB_PATH: targetDbPath, CORE_SEED_PATH: relSeed },
    );
  });

  test("player_match_stats round-trips through export and bootstrap", () => {
    const source = new Database(sourceDbPath, { readonly: true });
    const target = new Database(targetDbPath, { readonly: true });

    const sourceCount = source.prepare("SELECT COUNT(*) c FROM player_match_stats").get().c;
    const targetCount = target.prepare("SELECT COUNT(*) c FROM player_match_stats").get().c;
    assert.equal(sourceCount, 1216);
    assert.equal(targetCount, 1216);

    source.close();
    target.close();
  });

  test("provenance columns survive the round-trip", () => {
    const target = new Database(targetDbPath, { readonly: true });
    const missing = target
      .prepare(
        "SELECT COUNT(*) c FROM matches WHERE source_slug IS NULL OR source_url IS NULL OR source_name IS NULL",
      )
      .get().c;
    assert.equal(missing, 0);
    assert.equal(target.prepare("SELECT COUNT(*) c FROM matches").get().c, 19);
    assert.equal(target.prepare("SELECT COUNT(*) c FROM match_results").get().c, 304);
    target.close();
  });

  test("bootstrapped DB passes integrity and foreign-key checks", () => {
    const target = new Database(targetDbPath, { readonly: true });
    const integrity = target.pragma("integrity_check");
    assert.equal(integrity.length, 1);
    assert.equal(integrity[0].integrity_check, "ok");
    assert.equal(target.pragma("foreign_key_check").length, 0);
    target.close();
  });
});
