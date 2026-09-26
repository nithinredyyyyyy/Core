import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";

process.env.CORE_AUTH_SESSION_SECRET = "test-session-secret-for-integration-tests";

const { startServer, stopServer, getBaseUrl } = await import("./helpers/server.js");
const { createAuthSession } = await import("../server/services/auth.js");

function memberToken() {
  return createAuthSession({
    id: "user-member",
    email: "member@example.com",
    full_name: "Member",
    role: "member",
    auth_method: "google",
  }).token;
}

function adminToken() {
  return createAuthSession({
    id: "user-admin",
    email: "admin@example.com",
    full_name: "Admin",
    role: "admin",
    auth_method: "google",
  }).token;
}

function cookieHeader(token, { csrf } = {}) {
  const parts = [`stagecore_auth_token=${token}`];
  if (csrf) parts.push(`stagecore_csrf=${csrf}`);
  return parts.join("; ");
}

describe("auth session and access control", () => {
  before(async () => {
    await startServer();
  });

  after(async () => {
    await stopServer();
  });

  describe("session cookie", () => {
    test("accepts a valid session cookie on /api/auth/me", async () => {
      const res = await fetch(`${getBaseUrl()}/api/auth/me`, {
        headers: { Cookie: cookieHeader(adminToken()) },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.role, "admin");
    });

    test("rejects a legacy X-StageCore-Auth-Token header", async () => {
      const res = await fetch(`${getBaseUrl()}/api/auth/me`, {
        headers: { "X-StageCore-Auth-Token": adminToken() },
      });
      assert.equal(res.status, 401);
    });

    test("rejects a tampered token in the cookie", async () => {
      const res = await fetch(`${getBaseUrl()}/api/auth/me`, {
        headers: { Cookie: cookieHeader(`${memberToken()}tampered`) },
      });
      assert.equal(res.status, 401);
    });
  });

  describe("CSRF protection", () => {
    test("blocks state-changing requests without a CSRF header", async () => {
      const res = await fetch(`${getBaseUrl()}/api/auth/logout`, {
        method: "POST",
        headers: { Cookie: cookieHeader(adminToken()) },
      });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.code, "csrf_invalid");
    });

    test("blocks state-changing requests with a mismatched CSRF header", async () => {
      const res = await fetch(`${getBaseUrl()}/api/auth/logout`, {
        method: "POST",
        headers: {
          Cookie: cookieHeader(adminToken(), { csrf: "cookie-value" }),
          "X-StageCore-CSRF": "different-value",
        },
      });
      assert.equal(res.status, 403);
    });

    test("allows state-changing requests with a matching CSRF pair", async () => {
      const res = await fetch(`${getBaseUrl()}/api/auth/logout`, {
        method: "POST",
        headers: {
          Cookie: cookieHeader(adminToken(), { csrf: "matching-value" }),
          "X-StageCore-CSRF": "matching-value",
        },
      });
      assert.equal(res.status, 204);
    });
  });

  describe("logout revocation", () => {
    test("revokes the session token server-side", async () => {
      const token = adminToken();
      const csrf = "logout-csrf-token";

      const logout = await fetch(`${getBaseUrl()}/api/auth/logout`, {
        method: "POST",
        headers: {
          Cookie: cookieHeader(token, { csrf }),
          "X-StageCore-CSRF": csrf,
        },
      });
      assert.equal(logout.status, 204);

      const afterLogout = await fetch(`${getBaseUrl()}/api/auth/me`, {
        headers: { Cookie: cookieHeader(token) },
      });
      assert.equal(afterLogout.status, 401);
    });
  });

  describe("admin authorization", () => {
    test("rejects unauthenticated admin requests with 401", async () => {
      const res = await fetch(`${getBaseUrl()}/api/admin/overview`);
      assert.equal(res.status, 401);
    });

    test("rejects non-admin member tokens with 403 on admin routes", async () => {
      const res = await fetch(`${getBaseUrl()}/api/admin/overview`, {
        headers: { Cookie: cookieHeader(memberToken()) },
      });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.code, "admin_required");
    });

    test("rejects non-admin member tokens with 403 on entity writes", async () => {
      const res = await fetch(`${getBaseUrl()}/api/entities/Tournament`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader(memberToken(), { csrf: "csrf" }),
          "X-StageCore-CSRF": "csrf",
        },
        body: JSON.stringify({ name: "Hijacked Tournament" }),
      });
      assert.equal(res.status, 403);
      const body = await res.json();
      assert.equal(body.code, "admin_required");
    });

    test("rejects unauthenticated entity writes with 403", async () => {
      const res = await fetch(`${getBaseUrl()}/api/entities/Tournament`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Anonymous Tournament" }),
      });
      assert.equal(res.status, 403);
    });

    test("rejects non-admin reads of protected entities with 403", async () => {
      const res = await fetch(`${getBaseUrl()}/api/entities/TournamentStage`, {
        headers: { Cookie: cookieHeader(memberToken()) },
      });
      assert.equal(res.status, 403);
    });

    test("per-route rate limits do not cap unrelated public endpoints", async () => {
      // The auth limiter allows 20/min. Public reads must not be counted
      // against it, so a 25-request burst on a public route must stay 200.
      const statuses = [];
      for (let i = 0; i < 25; i += 1) {
        const res = await fetch(`${getBaseUrl()}/api/entities/Team?limit=1`);
        statuses.push(res.status);
      }
      assert.equal(statuses.includes(429), false, `unexpected 429 in ${statuses.join(",")}`);
      assert.equal(statuses.every((status) => status === 200), true);
    });
  });

  describe("unpublished match result visibility", () => {
    const unique = Date.now().toString(36);
    let tournamentId;
    let matchId;
    let draftId;
    let publishedSiblingId;

    async function adminCreate(path, body) {
      const res = await fetch(`${getBaseUrl()}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader(adminToken(), { csrf: "csrf" }),
          "X-StageCore-CSRF": "csrf",
        },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => null);
      assert.ok(res.status === 201, `create ${path} failed: ${res.status} ${JSON.stringify(payload)}`);
      return payload;
    }

    before(async () => {
      const team = await adminCreate("/api/entities/Team", {
        name: `Draft Test Team ${unique}`,
        tag: `DT${unique.slice(-4)}`,
      });
      const tournament = await adminCreate("/api/entities/Tournament", {
        name: `Draft Test Tour ${unique}`,
        game: "BGMI",
        status: "ongoing",
      });
      tournamentId = tournament.id;
      const match = await adminCreate("/api/entities/Match", {
        tournament_id: tournamentId,
        stage: "Group",
        match_number: 1,
      });
      matchId = match.id;
      const draft = await adminCreate("/api/entities/MatchResult", {
        match_id: matchId,
        tournament_id: tournamentId,
        team_id: team.id,
        placement: 7,
        total_points: 99,
        publication_status: "draft",
      });
      draftId = draft.id;

      // A published sibling on the same match: the whole match must be withheld
      // so partially entered matches never produce public standings.
      const publishedSibling = await adminCreate("/api/entities/MatchResult", {
        match_id: matchId,
        tournament_id: tournamentId,
        team_id: (
          await adminCreate("/api/entities/Team", {
            name: `Draft Test Team B ${unique}`,
            tag: `DB${unique.slice(-4)}`,
          })
        ).id,
        placement: 3,
        total_points: 55,
        publication_status: "published",
      });
      publishedSiblingId = publishedSibling.id;
    });

    test("anonymous list hides draft match results", async () => {
      const res = await fetch(`${getBaseUrl()}/api/entities/MatchResult?limit=5000`);
      assert.equal(res.status, 200);
      const rows = await res.json();
      assert.equal(rows.some((row) => row.id === draftId), false);
      assert.equal(rows.some((row) => row.publication_status === "draft"), false);
    });

    test("anonymous single read of a draft returns 404", async () => {
      const res = await fetch(`${getBaseUrl()}/api/entities/MatchResult/${draftId}`);
      assert.equal(res.status, 404);
    });

    test("admin list still includes draft match results", async () => {
      const res = await fetch(`${getBaseUrl()}/api/entities/MatchResult?limit=5000`, {
        headers: { Cookie: cookieHeader(adminToken()) },
      });
      assert.equal(res.status, 200);
      const rows = await res.json();
      assert.equal(rows.some((row) => row.id === draftId), true);
    });

    test("admin single read of a draft returns 200", async () => {
      const res = await fetch(`${getBaseUrl()}/api/entities/MatchResult/${draftId}`, {
        headers: { Cookie: cookieHeader(adminToken()) },
      });
      assert.equal(res.status, 200);
    });

    test("public page payloads do not expose draft match results", async () => {
      const res = await fetch(`${getBaseUrl()}/api/pages/team-detail`);
      assert.equal(res.status, 200);
      const payload = await res.json();
      const results = payload.results || [];
      assert.equal(results.some((row) => row.id === draftId), false);
      assert.equal(results.some((row) => row.publication_status === "draft"), false);
    });

    test("withholds published siblings of a partially entered match", async () => {
      const res = await fetch(`${getBaseUrl()}/api/entities/MatchResult?limit=5000`);
      const rows = await res.json();
      assert.equal(rows.some((row) => row.id === publishedSiblingId), false);
      assert.equal(rows.some((row) => row.match_id === matchId), false);
    });
  });
});
