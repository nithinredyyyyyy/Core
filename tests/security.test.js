import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { startServer, stopServer, getBaseUrl } from "./helpers/server.js";
import { createAuthSession } from "../server/services/auth.js";
import { db } from "../server/db.js";

const ADMIN_ROUTES = [
  ["GET", "/admin/overview"],
  ["GET", "/admin/news/sources"],
  ["GET", "/admin/backup-status"],
  ["POST", "/admin/news/import"],
  ["POST", "/admin/news/backfill"],
  ["POST", "/admin/bmps-2026-player-stats"],
  ["POST", "/admin/cache/clear"],
];
const ENTITY_WRITES = [
  ["POST", "/entities/Tournament"],
  ["POST", "/entities/Tournament/bulk"],
  ["PUT", "/entities/Tournament/missing"],
  ["DELETE", "/entities/Tournament/missing"],
];

function headers(role, csrf = true) {
  const token = createAuthSession({ id: `security-${role}`, email: `${role}@example.test`, role }).token;
  return {
    Cookie: `stagecore_auth_token=${token}; stagecore_csrf=test-csrf`,
    ...(csrf ? { "X-StageCore-CSRF": "test-csrf" } : {}),
    "Content-Type": "application/json",
  };
}

async function assertSafeError(response, status) {
  assert.equal(response.status, status);
  const body = await response.json();
  assert.match(body.requestId, /^[a-f0-9-]{36}$/);
  assert.equal(response.headers.get("X-Request-ID"), body.requestId);
  assert.deepEqual(Object.keys(body).sort(), body.code
    ? ["code", "error", "requestId"] : ["error", "requestId"]);
  return body;
}

describe("security boundaries", () => {
  before(startServer);
  after(stopServer);

  test("an old admin role cannot outlive removal from the current allowlist", async () => {
    const token = createAuthSession({ id: "removed-admin", email: "removed@example.test", role: "admin", auth_method: "google" }).token;
    const requestHeaders = {
      Cookie: `stagecore_auth_token=${token}; stagecore_csrf=test-csrf`,
      "X-StageCore-CSRF": "test-csrf", "Content-Type": "application/json",
    };
    const identity = await fetch(`${getBaseUrl()}/api/auth/me`, { headers: requestHeaders });
    assert.equal(identity.status, 200);
    assert.equal((await identity.json()).role, "member");
    await assertSafeError(await fetch(`${getBaseUrl()}/api/admin/overview`, { headers: requestHeaders }), 403);
    await assertSafeError(await fetch(`${getBaseUrl()}/api/entities/Tournament`, { method: "POST", headers: requestHeaders, body: "{}" }), 403);
  });

  test("all admin routes are represented in the access-control matrix", () => {
    const source = readFileSync(new URL("../server/routes/admin.js", import.meta.url), "utf8");
    const routes = [...source.matchAll(/adminRouter\.(get|post|put|patch|delete)\("([^"]+)"/g)]
      .map(([, method, path]) => `${method.toUpperCase()} ${path}`).sort();
    assert.deepEqual(routes, ADMIN_ROUTES.map(([method, path]) => `${method} ${path}`).sort());
  });

  test("every admin route rejects anonymous and member callers", async () => {
    for (const [method, path] of ADMIN_ROUTES) {
      await assertSafeError(await fetch(`${getBaseUrl()}/api${path}`, { method }), 401);
      await assertSafeError(await fetch(`${getBaseUrl()}/api${path}`, {
        method, headers: headers("member"),
      }), 403);
    }
  });

  test("all generic entity write methods reject anonymous and member callers", async () => {
    for (const [method, path] of ENTITY_WRITES) {
      await assertSafeError(await fetch(`${getBaseUrl()}/api${path}`, { method }), 403);
      await assertSafeError(await fetch(`${getBaseUrl()}/api${path}`, {
        method, headers: headers("member"),
      }), 403);
    }
  });

  test("CSRF covers every state-changing route, including auth and all write methods", async () => {
    const routes = [
      ...ADMIN_ROUTES.filter(([method]) => method !== "GET"), ...ENTITY_WRITES,
      ["POST", "/auth/google"], ["POST", "/auth/logout"],
    ];
    for (const [method, path] of routes) {
      const body = await assertSafeError(await fetch(`${getBaseUrl()}/api${path}`, {
        method, headers: headers("admin", false),
      }), 403);
      assert.equal(body.code, "csrf_invalid");
    }
    // The unauthenticated login has no session/CSRF pair yet. CORS and JSON
    // validation must still reject cross-site and simple form submissions.
    await assertSafeError(await fetch(`${getBaseUrl()}/api/auth/google`, {
      method: "POST", headers: { Origin: "https://untrusted.example", "Content-Type": "application/json" },
      body: "{}",
    }), 403);
    await assertSafeError(await fetch(`${getBaseUrl()}/api/auth/google`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "credential=untrusted",
    }), 400);
  });

  test("entity and news lists enforce defaults, caps and safe offsets", async () => {
    db.transaction(() => {
      const insert = db.prepare("INSERT INTO teams (id, name, tag, created_date, updated_date) VALUES (?, ?, ?, ?, ?)");
      for (let i = 0; i < 520; i++) insert.run(`security-team-${i}`, `Security Team ${i}`, `S${i}`, "2026-01-01", "2026-01-01");
    })();
    const list = async (query) => {
      const response = await fetch(`${getBaseUrl()}/api/entities/Team${query}`);
      assert.equal(response.status, 200);
      return response.json();
    };
    assert.equal((await list("")).length, 100);
    assert.equal((await list("?limit=99999")).length, 500);
    const firstTwo = await list("?limit=2&sort_by=name");
    const second = await list("?limit=1&skip=1&sort_by=name");
    assert.equal(firstTwo[1].id, second[0].id);
    for (const path of ["/entities/Team", "/news/public"]) {
      for (const query of ["limit=-1", "limit=0", "limit=1.5", "limit=", "limit=1&limit=2", "skip=-1", "q=null", "sort_by=a&sort_by=b"]) {
        if (path === "/news/public" && query === "q=null") continue;
        await assertSafeError(await fetch(`${getBaseUrl()}/api${path}?${query}`), 400);
      }
    }
  });

  test("search rejects malformed limits and queries; results have a hard cap", async () => {
    for (const query of ["q=soul&limit=-1", "q=soul&limit=1.5", "q=a&q=b", `q=${"x".repeat(201)}`]) {
      await assertSafeError(await fetch(`${getBaseUrl()}/api/search?${query}`), 400);
    }
    const response = await fetch(`${getBaseUrl()}/api/search?q=security&limit=999`);
    assert.equal(response.status, 200);
    assert.ok((await response.json()).length <= 20);
  });

  test("malformed JSON and server failures return generic errors with independent ids", async () => {
    const marker = "private-marker-do-not-disclose";
    const response = await fetch(`${getBaseUrl()}/api/entities/Tournament`, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Request-ID": marker },
      body: `{${marker}`,
    });
    const body = await assertSafeError(response, 400);
    assert.equal(JSON.stringify(body).includes(marker), false);

    // Force a database failure without touching the schema or production data.
    const prepare = db.prepare;
    db.prepare = () => { throw new Error(marker); };
    try {
      const failed = await fetch(`${getBaseUrl()}/api/home/summary`);
      const failure = await assertSafeError(failed, 500);
      assert.equal(failure.error, "Internal server error");
      assert.equal(JSON.stringify(failure).includes(marker), false);
      assert.notEqual(failure.requestId, body.requestId);
    } finally {
      db.prepare = prepare;
    }
  });

  test("authorized tournament create/update work and reject invalid input", async () => {
    const adminHeaders = headers("admin");
    const url = `${getBaseUrl()}/api/entities/Tournament`;
    await assertSafeError(await fetch(url, {
      method: "POST", headers: adminHeaders, body: JSON.stringify({ name: "", game: "BGMI" }),
    }), 400);
    const created = await fetch(url, {
      method: "POST", headers: adminHeaders,
      body: JSON.stringify({ name: "Security Test Tournament", game: "BGMI" }),
    });
    assert.equal(created.status, 201);
    const tournament = await created.json();
    const updated = await fetch(`${url}/${tournament.id}`, {
      method: "PUT", headers: adminHeaders, body: JSON.stringify({ name: "Updated Tournament" }),
    });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).name, "Updated Tournament");
    await assertSafeError(await fetch(`${url}/${tournament.id}`, {
      method: "PUT", headers: adminHeaders, body: JSON.stringify({ max_teams: "not a number" }),
    }), 400);
    const persisted = await (await fetch(`${url}/${tournament.id}`)).json();
    assert.equal(persisted.name, "Updated Tournament");
  });
});
