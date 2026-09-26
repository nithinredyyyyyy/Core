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
  });
});
