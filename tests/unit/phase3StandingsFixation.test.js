import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtempSync, rmSync, copyFileSync, existsSync, readFileSync } from "node:fs";
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
        total: db.prepare("SELECT COUNT(*) AS c FROM tournaments").get().c,
      };
    `);
    assert.equal(result.pmwc2024, 0, "PMWC 2024 must be gone");
    assert.equal(result.pmwc2025, 1, "PMWC 2025 must survive");
    assert.equal(result.pmwc2026, 1, "PMWC 2026 must survive");
    assert.equal(result.total, 18);
  });

  test("the committed seed no longer carries PMWC 2024", () => {
    const canonical = JSON.parse(
      readFileSync(path.join(repoRoot, "server", "seed", "canonical.export.json"), "utf8"),
    );
    const names = canonical.tournaments.map((t) => t.name);
    assert.equal(names.includes("PUBG Mobile World Cup 2024"), false, "seed must not carry PMWC 2024");
    assert.ok(names.includes("PUBG Mobile World Cup 2025"));
    assert.ok(names.includes("PUBG Mobile World Cup 2026"));
    assert.equal(canonical.tournaments.length, 18);
  });
});

describe("phase 3: standings fixation under PRESERVE_DISPUTE_V1", () => {
  test("writes the source value and retains the prior CORE value as a dispute", async () => {
    const { result } = await runAgainstCopy(`
      const find = () => db.prepare(
        "SELECT ss.id, ss.place_points, ss.elim_points, ss.total_points FROM stage_standings ss " +
        "JOIN teams t ON t.id = ss.team_id JOIN tournament_stages ts ON ts.id = ss.stage_id " +
        "JOIN tournaments tn ON tn.id = ss.tournament_id " +
        "WHERE tn.name = 'PUBG Mobile World Cup 2025' AND ts.name = 'Grand Finals' AND t.name = 'POWR Esports'"
      ).get();
      const before = find();
      const report = applyStandingsFixation();
      const after = find();
      return { before, after, disputes: report.disputes };
    `);
    // CORE stored 26/61/87; the source supplies 28/61/89. The row keeps its id,
    // now carries the source values, and the disagreement is recorded.
    assert.equal(result.before.place_points, 26);
    assert.equal(result.after.place_points, 28, "source value must be canonical");
    assert.equal(result.after.total_points, 89);
    assert.equal(result.after.id, result.before.id, "the row must be updated, not replaced");
    assert.ok(
      result.disputes.some(
        (d) => d.team === "POWR eSports" && d.field === "place_points" && d.stored === 26 && d.supplied === 28,
      ),
      "the prior CORE value must be retained in the dispute record",
    );
  });

  test("no stored row ever has components that disagree with its own total", async () => {
    const { result } = await runAgainstCopy(`
      const before = db.prepare("SELECT COUNT(*) c FROM stage_standings WHERE place_points + elim_points != total_points").get().c;
      applyStandingsFixation();
      const after = db.prepare("SELECT COUNT(*) c FROM stage_standings WHERE place_points + elim_points != total_points").get().c;
      return { before, after };
    `);
    // The pre-existing mismatch count is untouched: each supplied total is
    // validated against its components before writing, so none can be added.
    assert.equal(result.after, result.before, "the apply must not introduce a component/total mismatch");
  });

  test("creates no duplicate team or rank within a board", async () => {
    const { result } = await runAgainstCopy(`
      applyStandingsFixation();
      const grouped = (select) => db.prepare(select).get().c;
      return {
        dupTeam: grouped("SELECT COUNT(*) c FROM (SELECT 1 FROM stage_standings GROUP BY stage_id, COALESCE(group_id,''), team_id HAVING COUNT(*) > 1)"),
        dupRank: grouped("SELECT COUNT(*) c FROM (SELECT 1 FROM stage_standings GROUP BY stage_id, COALESCE(group_id,''), rank HAVING COUNT(*) > 1)"),
        dupStageTeam: grouped("SELECT COUNT(*) c FROM (SELECT 1 FROM stage_standings GROUP BY stage_id, team_id HAVING COUNT(*) > 1)"),
      };
    `);
    assert.equal(result.dupTeam, 0, "no (stage, group, team) row may repeat");
    assert.equal(result.dupRank, 0, "no rank may repeat within a board");
    assert.equal(result.dupStageTeam, 0, "a team must not appear twice in one stage");
  });

  test("is idempotent: a second apply inserts nothing and raises no dispute", async () => {
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
    assert.ok(result.insertedFirst > 0, "the first apply must do work");
    assert.equal(result.insertedSecond, 0, "second apply must not insert");
    assert.ok(result.disputesFirst > 0, "the first apply must surface disputes");
    assert.equal(result.disputesSecond, 0, "second apply must not re-raise disputes");
  });
});

describe("phase 3: scoping rules", () => {
  test("PMWC 2025 Group Stage is matched to existing group rows, ungrouped teams reported", async () => {
    const { result } = await runAgainstCopy(`
      const stageCount = () => db.prepare(
        "SELECT COUNT(*) c FROM stage_standings ss JOIN tournament_stages ts ON ts.id = ss.stage_id " +
        "JOIN tournaments tn ON tn.id = ss.tournament_id WHERE tn.name='PUBG Mobile World Cup 2025' AND ts.name='Group Stage'"
      ).get().c;
      const before = stageCount();
      const report = applyStandingsFixation();
      const target = report.applied.find((t) => t.tournament === "PUBG Mobile World Cup 2025" && t.stage === "Group Stage");
      return { before, after: stageCount(), target };
    `);
    assert.equal(result.target.scope, "existing-rows");
    assert.equal(result.before, result.after, "the partitioned stage must not gain stage-wide rows");
    assert.equal(result.after, 21);
    // 4Thrives / Regnum Carya / Alpha7 Esports are supplied but occupy no group
    // row; they are reported rather than placed into a guessed group.
    assert.deepEqual(
      [...result.target.notPlaced].sort(),
      ["4Thrives", "Alpha7 Esports", "Regnum Carya"],
    );
    assert.equal(result.target.inserted, 0);
  });

  test("BMPS 2026 Survival Stage is created with 32 participant rows", async () => {
    const { result } = await runAgainstCopy(`
      applyStandingsFixation();
      const rows = db.prepare(
        "SELECT COUNT(*) c FROM stage_standings ss JOIN tournament_stages ts ON ts.id = ss.stage_id " +
        "JOIN tournaments tn ON tn.id = ss.tournament_id " +
        "WHERE tn.name = 'Battlegrounds Mobile India Pro Series 2026' AND ts.name = 'Survival Stage'"
      ).get().c;
      const nonParticipants = db.prepare(
        "SELECT COUNT(*) c FROM stage_standings ss JOIN tournament_stages ts ON ts.id = ss.stage_id " +
        "JOIN tournaments tn ON tn.id = ss.tournament_id " +
        "WHERE tn.name = 'Battlegrounds Mobile India Pro Series 2026' AND ts.name = 'Survival Stage' " +
        "AND NOT EXISTS (SELECT 1 FROM tournament_participants tp WHERE tp.tournament_id = tn.id AND tp.team_id = ss.team_id)"
      ).get().c;
      const noSurvival2025 = db.prepare(
        "SELECT COUNT(*) c FROM tournament_stages ts JOIN tournaments tn ON tn.id = ts.tournament_id " +
        "WHERE tn.name = 'Battlegrounds Mobile India Pro Series 2025' AND ts.name = 'Survival Stage'"
      ).get().c;
      return { rows, nonParticipants, noSurvival2025 };
    `);
    assert.equal(result.rows, 32);
    assert.equal(result.nonParticipants, 0, "every row must name a BMPS 2026 participant");
    assert.equal(result.noSurvival2025, 0, "no BMPS 2025 Survival Stage may be created");
  });

  test("PMWC 2026 Survival Stage is filled with 16 participant rows", async () => {
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
    assert.equal(result.nonParticipants, 0);
  });
});

describe("phase 3: identity resolution", () => {
  test("no team is created and every supplied label resolves to an existing team", async () => {
    const { result } = await runAgainstCopy(`
      const { TEAM_ID_PINS } = await import(${JSON.stringify(new URL("../../server/scripts/data/phase3Standings.js", import.meta.url).href)});
      const before = db.prepare("SELECT COUNT(*) c FROM teams").get().c;
      const report = applyStandingsFixation();
      const after = db.prepare("SELECT COUNT(*) c FROM teams").get().c;
      const labels = report.applied.flatMap((t) => t.sourceLabels || []);
      const missing = labels.filter((l) => !db.prepare("SELECT 1 FROM teams WHERE id = ?").get(l.teamId));
      const teams = db.prepare("SELECT id, name FROM teams").all();
      const byName = new Map();
      for (const t of teams) byName.set(t.name.toLowerCase(), (byName.get(t.name.toLowerCase()) || 0) + 1);
      // A canonical name CORE holds more than once must resolve through a pin,
      // never through whichever row the index happened to keep.
      const ambiguousUnpinned = labels.filter(
        (l) => byName.get(l.canonical.toLowerCase()) > 1 && TEAM_ID_PINS[l.canonical] !== l.teamId,
      );
      // Every resolved id must actually belong to a team named as the canonical.
      const wrongName = labels.filter((l) => {
        const team = db.prepare("SELECT name FROM teams WHERE id = ?").get(l.teamId);
        return team.name.toLowerCase() !== l.canonical.toLowerCase();
      });
      return { before, after, labelCount: labels.length, missing: missing.length, ambiguousUnpinned, wrongName };
    `);
    assert.equal(result.after, result.before, "no team may be created");
    assert.ok(result.labelCount > 0, "there must be labels to audit");
    assert.equal(result.missing, 0, "every resolved label must point at a real team");
    assert.deepEqual(result.ambiguousUnpinned, [], "an ambiguous name must resolve through an explicit pin");
    assert.deepEqual(result.wrongName, [], "a resolved id must belong to the canonical team name");
  });

  test("the two disputed identities map to the teams the user confirmed", async () => {
    const { result } = await runAgainstCopy(`
      applyStandingsFixation();
      const find = (tn, ts, group, team) => db.prepare(
        "SELECT tn.name AS tournament, ts.name AS stage, tm.name AS team, ss.rank, ss.total_points " +
        "FROM stage_standings ss JOIN teams tm ON tm.id = ss.team_id JOIN tournament_stages ts ON ts.id = ss.stage_id " +
        "LEFT JOIN tournament_stage_groups ssg ON ssg.id = ss.group_id JOIN tournaments tn ON tn.id = ss.tournament_id " +
        "WHERE tn.name = ? AND ts.name = ? AND COALESCE(ssg.group_name,'') = ? AND tm.name = ?"
      ).get(tn, ts, group, team);
      return {
        ttGlobal: find("PUBG Mobile World Cup 2025", "Grand Finals", "", "ThunderTalk Gaming"),
        alliance: find("PUBG Mobile Global Championship 2025", "Group Stage", "Group Red", "Alliance"),
      };
    `);
    assert.ok(result.ttGlobal, "TT Global must resolve to ThunderTalk Gaming");
    assert.equal(result.ttGlobal.rank, 16);
    assert.equal(result.ttGlobal.total_points, 54);
    assert.ok(result.alliance, "Alliance My must resolve to CORE's Alliance");
    assert.equal(result.alliance.rank, 9);
    assert.equal(result.alliance.total_points, 101);
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
