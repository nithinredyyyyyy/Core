import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, stopServer, getBaseUrl } from "./helpers/server.js";

describe("API integration tests", () => {
  before(async () => {
    await startServer();
  });

  after(async () => {
    await stopServer();
  });

  test("public player payload supplies bounded display data while raw identity entities stay protected", async () => {
    const response = await fetch(`${getBaseUrl()}/api/pages/player-detail`);
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.ok(payload.players.length > 0 && payload.players.length <= 800);
    assert.ok(payload.playerAliases.length > 0 && payload.playerAliases.length <= 3000);
    assert.ok(payload.playerTeamHistory.length > 0 && payload.playerTeamHistory.length <= 4000);
    for (const row of payload.playerAliases) assert.deepEqual(Object.keys(row).sort(), ["alias", "normalized_alias", "player_id"]);
    for (const row of payload.playerTeamHistory) assert.ok(!("source" in row) && !("created_by" in row));
    for (const entity of ["PlayerAlias", "PlayerTeamHistory", "TeamAlias", "TournamentStage", "TournamentParticipant", "StageStanding"]) {
      const raw = await fetch(`${getBaseUrl()}/api/entities/${entity}`);
      assert.equal(raw.status, 403, entity);
    }
  });

  describe("GET /api/health", () => {
    test("returns 200 with status information", async () => {
      const res = await fetch(`${getBaseUrl()}/api/health`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.ok, true);
      assert.ok(body.service);
      assert.ok(body.timestamp);
    });
  });

  describe("GET /api/entities/:entity", () => {
    test("returns 200 with array for Tournament", async () => {
      const res = await fetch(`${getBaseUrl()}/api/entities/Tournament`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body));
    });

    test("returns 200 with array for Team", async () => {
      const res = await fetch(`${getBaseUrl()}/api/entities/Team`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body));
    });

    test("returns 200 with array for Player", async () => {
      const res = await fetch(`${getBaseUrl()}/api/entities/Player`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body));
    });

    test("returns 404 for unknown entity", async () => {
      const res = await fetch(`${getBaseUrl()}/api/entities/UnknownEntity`);
      assert.equal(res.status, 404);
    });
  });

  describe("GET /api/entities/:entity/:id", () => {
    test("returns 404 for bad id", async () => {
      const res = await fetch(`${getBaseUrl()}/api/entities/Tournament/bad-id`);
      assert.equal(res.status, 404);
    });
  });

  describe("GET /api/home/summary", () => {
    test("returns 200 with tournaments field", async () => {
      const res = await fetch(`${getBaseUrl()}/api/home/summary`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok("tournaments" in body);
      assert.ok(Array.isArray(body.tournaments));
    });
  });

  describe("GET /api/search", () => {
    test("returns 200 with array for query", async () => {
      const res = await fetch(`${getBaseUrl()}/api/search?q=soul`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body));
    });
  });

  describe("GET /api/entities/Tournament (list)", () => {
    test("returns 200 with array", async () => {
      const res = await fetch(`${getBaseUrl()}/api/entities/Tournament`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body));
    });
  });

  describe("GET /api/news/public", () => {
    test("returns 200 with array", async () => {
      const res = await fetch(`${getBaseUrl()}/api/news/public`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(Array.isArray(body));
    });
  });

  describe("GET /api/pages/rankings", () => {
    test("returns 200 with teams field", async () => {
      const res = await fetch(`${getBaseUrl()}/api/pages/rankings`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok("teams" in body);
      assert.ok(Array.isArray(body.teams));
    });
  });
});
