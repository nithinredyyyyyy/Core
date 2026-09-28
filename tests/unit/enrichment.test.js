import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Everything here runs against a throwaway database. CORE_DB_PATH is set before
// server modules are imported so the live singleton opens the temp file, never the
// committed server/data/stagecore.sqlite.
const tempDir = mkdtempSync(join(tmpdir(), "stagecore-enrich-"));
process.env.CORE_DB_PATH = join(tempDir, "enrich.sqlite");
process.env.NODE_ENV = "test";

let db;
let enrichment;
let standings;
let seed;
let fixture;

const TOURNAMENT_ID = "tour-fixture-1";
const TEAM_IDS = Array.from({ length: 16 }, (_, i) => `team-${String(i + 1).padStart(2, "0")}`);

before(async () => {
  ({ db } = await import("../../server/db.js"));
  enrichment = await import("../../server/services/enrichment.js");
  standings = await import("../../server/services/stageStandings.js");
  seed = await import("../../server/services/seed.js");
  fixture = await import("../../server/seed/goldenFixture.js");

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO tournaments (id, name, game, status, max_teams, created_date, updated_date)
     VALUES (?, ?, ?, 'completed', 16, ?, ?)`,
  ).run(TOURNAMENT_ID, "Fixture Championship 2026", "BGMI", now, now);
  for (const teamId of TEAM_IDS) {
    db.prepare(
      `INSERT INTO teams (id, name, tag, game, created_date, updated_date)
       VALUES (?, ?, ?, 'BGMI', ?, ?)`,
    ).run(teamId, `Team ${teamId}`, teamId.slice(-2).toUpperCase(), now, now);
  }
});

after(() => {
  try {
    db?.close();
  } catch {
    // already closed
  }
  rmSync(tempDir, { recursive: true, force: true });
});

function fixturePayload() {
  return fixture.buildGoldenFixture({
    tournamentId: TOURNAMENT_ID,
    teamIds: TEAM_IDS,
  });
}

describe("idempotent enrichment", () => {
  test("imports the golden fixture shape exactly once", () => {
    const payload = fixturePayload();
    const summary = enrichment.enrichStage({
      tournamentId: TOURNAMENT_ID,
      stage: payload.stage,
      matches: payload.matches,
      resultsByMatch: payload.resultsByMatch,
      playerStats: payload.playerStats,
      source: payload.source,
    });

    assert.equal(summary.matches, 19);
    assert.equal(summary.results, 19 * 16);
    assert.equal(summary.playerStats, 19 * 16 * 4);

    const counts = {
      matches: db.prepare("SELECT COUNT(*) c FROM matches").get().c,
      results: db.prepare("SELECT COUNT(*) c FROM match_results").get().c,
      stats: db.prepare("SELECT COUNT(*) c FROM player_match_stats").get().c,
    };
    assert.deepEqual(counts, { matches: 19, results: 304, stats: 1216 });
  });

  test("re-running enrichment updates rather than duplicates", () => {
    const payload = fixturePayload();
    enrichment.enrichStage({
      tournamentId: TOURNAMENT_ID,
      stage: payload.stage,
      matches: payload.matches,
      resultsByMatch: payload.resultsByMatch,
      playerStats: payload.playerStats,
      source: payload.source,
    });

    assert.equal(db.prepare("SELECT COUNT(*) c FROM matches").get().c, 19);
    assert.equal(db.prepare("SELECT COUNT(*) c FROM match_results").get().c, 304);
    assert.equal(db.prepare("SELECT COUNT(*) c FROM player_match_stats").get().c, 1216);
  });

  test("provenance persists on matches, results, and match_sources", () => {
    const missing = db
      .prepare(
        "SELECT COUNT(*) c FROM matches WHERE source_slug IS NULL OR source_url IS NULL OR source_name IS NULL",
      )
      .get().c;
    assert.equal(missing, 0);
    assert.ok(db.prepare("SELECT COUNT(*) c FROM match_sources").get().c >= 1);

    // Duplicate source URL is rejected (UNIQUE(tournament_id, source_url)).
    const existing = db.prepare("SELECT source_url FROM match_sources LIMIT 1").get();
    assert.throws(() =>
      db
        .prepare(
          "INSERT INTO match_sources (id, tournament_id, source_name, source_url, retrieved_at, created_date) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run("dup", TOURNAMENT_ID, "fixture", existing.source_url, "now", "now"),
    );
  });

  test("validation failure rolls the whole transaction back", () => {
    const before = db.prepare("SELECT COUNT(*) c FROM matches").get().c;
    assert.throws(() =>
      enrichment.enrichStage({
        tournamentId: TOURNAMENT_ID,
        stage: "Rollback Stage",
        matches: [
          {
            stage: "Rollback Stage",
            match_number: 1,
            map: "Erangel",
            status: "completed",
            source_slug: `fixture:${TOURNAMENT_ID}:rb:m1`,
            source_url: "https://example.test/rb",
            source_name: "fixture",
          },
        ],
        resultsByMatch: {},
        validate() {
          throw new Error("gate failed");
        },
      }),
    );
    assert.equal(db.prepare("SELECT COUNT(*) c FROM matches").get().c, before);
    assert.equal(
      db.prepare("SELECT COUNT(*) c FROM tournament_stages WHERE name = 'Rollback Stage'").get().c,
      0,
    );
  });
});

describe("synthetic snapshot replacement", () => {
  test("removes placeholders, inserts real rows, and is atomic on failure", () => {
    const stage = "Replace Stage";
    const now = new Date().toISOString();
    // Seed a synthetic snapshot: match_number 0, map Other, cumulative results.
    const synthId = "synth-match-1";
    db.prepare(
      `INSERT INTO matches (id, tournament_id, stage, match_number, map, status, created_date, updated_date)
       VALUES (?, ?, ?, 0, 'Other', 'completed', ?, ?)`,
    ).run(synthId, TOURNAMENT_ID, stage, now, now);
    db.prepare(
      `INSERT INTO match_results (id, match_id, tournament_id, team_id, placement, kill_points, placement_points, total_points, matches_count, wins_count, stage, publication_status, created_date, updated_date)
       VALUES ('synth-res-1', ?, ?, ?, 1, 10, 10, 20, 19, 3, ?, 'published', ?, ?)`,
    ).run(synthId, TOURNAMENT_ID, TEAM_IDS[0], stage, now, now);

    const payload = fixture.buildGoldenFixture({
      tournamentId: TOURNAMENT_ID,
      stage,
      teamIds: TEAM_IDS.slice(0, 4),
    });

    const summary = enrichment.replaceSyntheticSnapshot({
      tournamentId: TOURNAMENT_ID,
      stage,
      matches: payload.matches,
      resultsByMatch: payload.resultsByMatch,
      playerStats: payload.playerStats,
      source: payload.source,
    });

    assert.equal(summary.removedSyntheticMatches, 1);
    assert.equal(
      db
        .prepare("SELECT COUNT(*) c FROM matches WHERE tournament_id = ? AND stage = ? AND (match_number = 0 OR match_number IS NULL)")
        .get(TOURNAMENT_ID, stage).c,
      0,
    );
    assert.equal(
      db.prepare("SELECT COUNT(*) c FROM matches WHERE tournament_id = ? AND stage = ?").get(TOURNAMENT_ID, stage).c,
      19,
    );
    assert.equal(
      db.prepare("SELECT COUNT(*) c FROM match_results WHERE match_id = ?").get(synthId).c,
      0,
    );
  });

  test("rolls back a failed replacement, leaving the snapshot intact", () => {
    const stage = "Atomic Stage";
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO matches (id, tournament_id, stage, match_number, map, status, created_date, updated_date)
       VALUES ('synth-atomic', ?, ?, 0, 'Other', 'completed', ?, ?)`,
    ).run(TOURNAMENT_ID, stage, now, now);
    db.prepare(
      `INSERT INTO match_results (id, match_id, tournament_id, team_id, placement, kill_points, placement_points, total_points, stage, publication_status, created_date, updated_date)
       VALUES ('synth-atomic-res', 'synth-atomic', ?, ?, 1, 1, 1, 2, ?, 'published', ?, ?)`,
    ).run(TOURNAMENT_ID, TEAM_IDS[1], stage, now, now);

    const payload = fixture.buildGoldenFixture({
      tournamentId: TOURNAMENT_ID,
      stage,
      teamIds: TEAM_IDS.slice(0, 4),
    });

    assert.throws(() =>
      enrichment.replaceSyntheticSnapshot({
        tournamentId: TOURNAMENT_ID,
        stage,
        matches: payload.matches,
        resultsByMatch: payload.resultsByMatch,
        validate() {
          throw new Error("nope");
        },
      }),
    );

    assert.equal(db.prepare("SELECT COUNT(*) c FROM matches WHERE id = 'synth-atomic'").get().c, 1);
    assert.equal(
      db.prepare("SELECT COUNT(*) c FROM match_results WHERE match_id = 'synth-atomic'").get().c,
      1,
    );
  });
});

describe("derived stage standings endpoint", () => {
  test("aggregates match_results with publication rules and sorts correctly", () => {
    const payload = fixturePayload();
    const stageRow = db
      .prepare("SELECT id FROM tournament_stages WHERE tournament_id = ? AND name = ?")
      .get(TOURNAMENT_ID, payload.stage);
    const result = standings.getStageStandingsFromResults(TOURNAMENT_ID, stageRow.id);

    assert.ok(result);
    assert.equal(result.standings.length, 16);

    // Totals must equal a direct aggregation of published match_results.
    const direct = db
      .prepare(
        `SELECT SUM(COALESCE(total_points,0)) t, SUM(COALESCE(matches_count,1)) m
         FROM match_results WHERE tournament_id = ? AND stage = ?`,
      )
      .get(TOURNAMENT_ID, payload.stage);
    const summed = result.standings.reduce((acc, row) => acc + row.total_points, 0);
    assert.equal(summed, direct.t);
    const summedMatches = result.standings.reduce((acc, row) => acc + row.matches_count, 0);
    assert.equal(summedMatches, direct.m);

    // Sorted by total_points descending.
    for (let i = 1; i < result.standings.length; i += 1) {
      assert.ok(result.standings[i - 1].total_points >= result.standings[i].total_points);
    }
  });

  test("returns null for an unknown stage", () => {
    assert.equal(standings.getStageStandingsFromResults(TOURNAMENT_ID, "missing-stage"), null);
  });
});

describe("startup safety", () => {
  test("repair does not remove valid imported stages or duplicate participants", async () => {
    const repair = await import("../../server/services/tournamentDataRepair.js");
    const before = db.prepare("SELECT COUNT(*) c FROM tournament_stages").get().c;
    const summary = repair.repairTournamentDataIntegrity();
    const after = db.prepare("SELECT COUNT(*) c FROM tournament_stages").get().c;

    assert.equal(after, before);
    assert.equal(summary.prunedStages, 0);
    // Stage slugs stay unique after repair.
    const dupes = db
      .prepare("SELECT COUNT(*) c FROM (SELECT tournament_id, slug FROM tournament_stages GROUP BY tournament_id, slug HAVING COUNT(*) > 1)")
      .get().c;
    assert.equal(dupes, 0);
  });

  test("seedIfEmpty does not overwrite a populated database", () => {
    const before = db.prepare("SELECT COUNT(*) c FROM tournaments").get().c;
    seed.seedIfEmpty();
    assert.equal(db.prepare("SELECT COUNT(*) c FROM tournaments").get().c, before);
  });
});
