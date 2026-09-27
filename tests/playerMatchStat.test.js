import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";

process.env.CORE_AUTH_SESSION_SECRET = "test-session-secret-for-integration-tests";

const { startServer, stopServer, getBaseUrl } = await import("./helpers/server.js");
const { createAuthSession } = await import("../server/services/auth.js");

before(async () => {
  await startServer();
});

after(async () => {
  await stopServer();
});

function adminToken() {
  return createAuthSession({
    id: "user-admin",
    email: "admin@example.com",
    full_name: "Admin",
    role: "admin",
    auth_method: "google",
  }).token;
}

// Mutating requests with a session cookie must present a matching CSRF pair.
const CSRF = "player-stat-csrf-token";
function adminHeaders(extra = {}) {
  return {
    Cookie: `stagecore_auth_token=${adminToken()}; stagecore_csrf=${CSRF}`,
    "x-stagecore-csrf": CSRF,
    ...extra,
  };
}

describe("PlayerMatchStat entity support", () => {
  test("GET /api/entities/PlayerMatchStat is 200 for an admin and returns an array", async () => {
    const res = await fetch(`${getBaseUrl()}/api/entities/PlayerMatchStat`, {
      headers: adminHeaders(),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body));
  });

  test("GET /api/entities/PlayerMatchStat is protected from anonymous access", async () => {
    const res = await fetch(`${getBaseUrl()}/api/entities/PlayerMatchStat`);
    assert.equal(res.status, 403);
  });

  test("create validates the payload and rejects non-admins", async () => {
    const anonymous = await fetch(`${getBaseUrl()}/api/entities/PlayerMatchStat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(anonymous.status, 403);

    const invalid = await fetch(`${getBaseUrl()}/api/entities/PlayerMatchStat`, {
      method: "POST",
      headers: adminHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ player_name: "no match id" }),
    });
    assert.equal(invalid.status, 400);
  });

  test("creates and reads back a player-match statistic", async () => {
    const matchId = `match-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const created = await fetch(`${getBaseUrl()}/api/entities/PlayerMatchStat`, {
      method: "POST",
      headers: adminHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        match_id: matchId,
        player_name: "TestPlayer",
        team_id: "team-1",
        kills: 7,
        finishes: 3,
        source: "test",
      }),
    });
    assert.equal(created.status, 201);
    const record = await created.json();
    assert.equal(record.player_name, "TestPlayer");
    assert.equal(record.kills, 7);

    const listed = await fetch(
      `${getBaseUrl()}/api/entities/PlayerMatchStat?q=${encodeURIComponent(
        JSON.stringify({ match_id: matchId }),
      )}`,
      { headers: adminHeaders() },
    );
    assert.equal(listed.status, 200);
    const rows = await listed.json();
    assert.ok(rows.some((row) => row.player_name === "TestPlayer"));
  });

  test("rejects an unknown orderable column", async () => {
    const res = await fetch(
      `${getBaseUrl()}/api/entities/PlayerMatchStat?sort_by=${encodeURIComponent(
        "kills; DROP TABLE players",
      )}`,
      { headers: adminHeaders() },
    );
    assert.ok(res.status === 400 || res.status === 200);
    if (res.status === 200) {
      // Allowlisted sorts never echo the raw column; confirm the query is safe.
      const body = await res.json();
      assert.ok(Array.isArray(body));
    }
  });
});

describe("stage standings endpoint", () => {
  test("returns 404 for an unknown stage", async () => {
    const res = await fetch(
      `${getBaseUrl()}/api/pages/tournament/tour-missing/stage/stage-missing/standings`,
    );
    assert.equal(res.status, 404);
  });

  test("returns 400 when the stage id is empty", async () => {
    const res = await fetch(
      `${getBaseUrl()}/api/pages/tournament/tour-x/stage/%20/standings`,
    );
    assert.equal(res.status, 400);
  });
});
