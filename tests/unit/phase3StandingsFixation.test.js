import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtempSync, rmSync, copyFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const prodDb = path.join(repoRoot, "server", "data", "stagecore.sqlite");

const temps = [];
function tempDir(prefix = "stagecore-phase3-") {
  const dir = mkdtempSync(path.join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
}
after(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

// Runs a fragment in a child process against a private copy of the database,
// because server/db.js holds one connection per process. Mirrors how the
// production apply actually runs.
async function runAgainstCopy(body) {
  const dir = tempDir();
  const dbPath = path.join(dir, "copy.sqlite");
  copyFileSync(prodDb, dbPath);
  const script = `
    process.env.NODE_ENV = "test";
    process.env.CORE_DB_PATH = ${JSON.stringify(dbPath)};
    const { db } = await import(${JSON.stringify(new URL("../../server/db.js", import.meta.url).href)});
    const { applyStandingsFixation } = await import(${JSON.stringify(new URL("../../server/scripts/phase3StandingsFixation.js", import.meta.url).href)});
    const out = await (async () => { ${body} })();
    console.log("RESULT:" + JSON.stringify(out));
    db.close();
  `;
  const { stdout } = await execFileAsync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: repoRoot,
    env: { ...process.env, NODE_ENV: "test" },
  });
  const line = stdout.split("\n").find((l) => l.startsWith("RESULT:"));
  return { result: JSON.parse(line.slice("RESULT:".length)), dbPath };
}

describe("phase 3: PMWC 2024 removal", () => {
  test("migration 012 removes PMWC 2024 and preserves PMWC 2025/2026", async () => {
    const { result } = await runAgainstCopy(`
      const count = (name) => db.prepare("SELECT COUNT(*) AS c FROM tournaments WHERE name = ?").get(name).c;
      return {
        pmwc2024: count("PUBG Mobile World Cup 2024"),
        pmwc2025: count("PUBG Mobile World Cup 2025"),
        pmwc2026: count("PUBG Mobile World Cup 2026"),
      };
    `);
    assert.equal(result.pmwc2024, 0, "PMWC 2024 must be gone");
    assert.equal(result.pmwc2025, 1, "PMWC 2025 must survive");
    assert.equal(result.pmwc2026, 1, "PMWC 2026 must survive");
  });

  test("the seed dataset no longer contains PMWC 2024", async () => {
    const canonical = JSON.parse(
      (await import("node:fs")).readFileSync(path.join(repoRoot, "server", "seed", "canonical.export.json"), "utf8"),
    );
    const names = canonical.tournaments.map((t) => t.name);
    assert.ok(!names.includes("PUBG Mobile World Cup 2024"));
    assert.ok(names.includes("PUBG Mobile World Cup 2025"));
    assert.ok(names.includes("PUBG Mobile World Cup 2026"));
    assert.ok(
      !canonical.news_articles.some((a) => a.title === "Alpha7 Esports win PUBG Mobile World Cup 2024"),
      "PMWC 2024 article must not be in the bootstrap seed",
    );
  });
});

describe("phase 3: standings fixation is non-destructive", () => {
  test("never overwrites a stored value and reports the disagreement", async () => {
    const { result } = await runAgainstCopy(`
      const before = db.prepare(
        "SELECT ss.id, ss.rank, ss.place_points, ss.elim_points, ss.total_points FROM stage_standings ss " +
        "JOIN teams t ON t.id = ss.team_id JOIN tournament_stages ts ON ts.id = ss.stage_id " +
        "JOIN tournaments tn ON tn.id = ss.tournament_id " +
        "WHERE tn.name = 'PUBG Mobile World Cup 2025' AND ts.name = 'Group Stage' AND t.name = 'POWR Esports'"
      ).get();
      const report = applyStandingsFixation();
      const after = db.prepare("SELECT rank, place_points, elim_points, total_points FROM stage_standings WHERE id = ?").get(before.id);
      return { before, after, disputes: report.disputes };
    `);
    // The stored row keeps its id and its values; the supplied split is recorded.
    assert.equal(result.after.place_points, result.before.place_points);
    assert.equal(result.after.elim_points, result.before.elim_points);
    assert.equal(result.after.total_points, result.before.total_points);
    assert.ok(
      result.disputes.some((d) => d.team === "POWR Esports" && d.field === "place_points"),
      "the component-split disagreement must be reported",
    );
  });

  test("creates no duplicate team within a stage", async () => {
    const { result } = await runAgainstCopy(`
      applyStandingsFixation();
      const dupes = db.prepare(
        "SELECT stage_id, COALESCE(group_id, '') g, team_id, COUNT(*) c FROM stage_standings " +
        "GROUP BY stage_id, g, team_id HAVING c > 1"
      ).all();
      return { duplicates: dupes.length };
    `);
    assert.equal(result.duplicates, 0, "no (stage, group, team) row may repeat");
  });

  test("fills PMWC 2026 Survival Stage, whose 16 teams are all participants", async () => {
    const { result } = await runAgainstCopy(`
      applyStandingsFixation();
      const rows = db.prepare(
        "SELECT COUNT(*) c FROM stage_standings ss JOIN tournament_stages ts ON ts.id = ss.stage_id " +
        "JOIN tournaments tn ON tn.id = ss.tournament_id " +
        "WHERE tn.name = 'PUBG Mobile World Cup 2026' AND ts.name = 'Survival Stage'"
      ).get().c;
      const nonParticipants = db.prepare(
        "SELECT COUNT(*) c FROM stage_standings ss JOIN tournament_stages ts ON ts.id = ss.stage_id " +
        "JOIN tournaments tn ON tn.id = ss.tournament_id " +
        "WHERE tn.name = 'PUBG Mobile World Cup 2026' AND ts.name = 'Survival Stage' " +
        "AND NOT EXISTS (SELECT 1 FROM tournament_participants tp WHERE tp.tournament_id = tn.id AND tp.team_id = ss.team_id)"
      ).get().c;
      return { rows, nonParticipants };
    `);
    assert.equal(result.rows, 16);
    assert.equal(result.nonParticipants, 0, "a standings row may only name a participant");
  });

  test("is idempotent: a second apply inserts nothing and adds no disputes", async () => {
    const { result } = await runAgainstCopy(`
      const first = applyStandingsFixation();
      const second = applyStandingsFixation();
      return {
        insertedFirst: first.applied.reduce((a, t) => a + t.inserted, 0),
        insertedSecond: second.applied.reduce((a, t) => a + t.inserted, 0),
        disputesFirst: first.disputes.length,
        disputesSecond: second.disputes.length,
      };
    `);
    assert.equal(result.insertedSecond, 0, "second apply must not insert");
    assert.equal(result.disputesSecond, result.disputesFirst, "second apply must not invent new disputes");
  });

  test("stays within PRESERVE_DISPUTE_V1: disagreements are reported, not chased", async () => {
    const { result } = await runAgainstCopy(`
      const report = applyStandingsFixation();
      const unsafeInserts = [];
      for (const t of report.applied.filter((x) => x.scope === "existing-rows")) {
        if (t.inserted > 0) unsafeInserts.push(t);
      }
      return { unsafeInserts, deferredReasons: report.deferred.map((d) => d.reason) };
    `);
    assert.equal(result.unsafeInserts.length, 0, "partitioned stages must never gain stage-wide rows");
  });
});

describe("phase 3: applier refuses to run against production", () => {
  test("the guarded tool rejects the production path", async () => {
    let code = 0;
    let stderr = "";
    try {
      await execFileAsync(
        process.execPath,
        [path.join(repoRoot, "tools", "phase3-apply-standings.mjs"), "--db", prodDb],
        { cwd: repoRoot, env: { ...process.env, NODE_ENV: "test" } },
      );
    } catch (error) {
      code = error.code ?? 1;
      stderr = error.stderr ?? "";
    }
    assert.equal(code, 3);
    assert.match(stderr, /Refusing to run against the production database/);
  });

  test("production database exists and was not deleted by the test run", () => {
    assert.ok(existsSync(prodDb), "the production database file must still exist");
  });
});
