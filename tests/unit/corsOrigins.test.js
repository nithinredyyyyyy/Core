import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { buildAllowedOrigins, corsOriginCallback } from "../../server/services/corsOrigins.js";

describe("CORS allowlist (unit)", () => {
  test("production allows only configured origins; development adds loopback", () => {
    const prod = buildAllowedOrigins(
      { FRONTEND_ORIGIN: "https://app.example.com", CORS_ORIGIN: "" },
      { isProduction: true },
    );
    assert.ok(prod.has("https://app.example.com"));
    assert.ok(!prod.has("http://localhost:5173"), "no dev origins in production");
    assert.ok(!prod.has("https://attacker.example.com"));

    const dev = buildAllowedOrigins(
      { FRONTEND_ORIGIN: "https://app.example.com" },
      { isProduction: false },
    );
    assert.ok(dev.has("https://app.example.com"));
    assert.ok(dev.has("http://localhost:5173"), "dev origins available outside production");
  });

  test("accepts comma-separated origins from both variables and trims them", () => {
    const allowed = buildAllowedOrigins(
      {
        FRONTEND_ORIGIN: "https://a.example.com, https://b.example.com ",
        CORS_ORIGIN: "https://c.example.com",
      },
      { isProduction: true },
    );
    assert.deepEqual(
      [...allowed].sort(),
      ["https://a.example.com", "https://b.example.com", "https://c.example.com"],
    );
  });

  test("wildcards are treated as literal origins, never as a match-all", () => {
    const allowed = buildAllowedOrigins(
      { FRONTEND_ORIGIN: "*", CORS_ORIGIN: "https://*.example.com" },
      { isProduction: true },
    );
    assert.ok(allowed.has("*"), "a literal '*' entry is stored as-is");
    assert.ok(!allowed.has("https://app.example.com"), "a glob does not expand into a wildcard");
  });

  test("callback allows no-Origin requests and exact matches, rejects others", () => {
    const allowed = buildAllowedOrigins(
      { FRONTEND_ORIGIN: "https://app.example.com" },
      { isProduction: true },
    );
    const origin = corsOriginCallback(allowed);

    const call = (value) => {
      let result;
      origin(value, (err, ok) => (result = { err, ok }));
      return result;
    };

    assert.equal(call(undefined).ok, true, "same-origin / non-browser requests pass");
    assert.equal(call("https://app.example.com").ok, true);
    assert.ok(call("https://evil.example.com").err, "unknown origin is rejected");
    assert.ok(call("https://app.example.com.evil.com").err, "suffix trick is rejected");
    assert.ok(call("http://app.example.com").err, "scheme mismatch is rejected");
  });
});

// Integration: the real server must honor the allowlist on preflight requests.
process.env.CORE_AUTH_SESSION_SECRET = "test-session-secret-for-cors";
process.env.FRONTEND_ORIGIN = "https://allowed.example.com";
process.env.CORS_ORIGIN = "";

const { startServer, stopServer, getBaseUrl } = await import("../helpers/server.js");

describe("CORS enforcement (integration)", () => {
  before(async () => {
    await startServer();
  });
  after(async () => {
    await stopServer();
  });

  test("preflight from an allowed origin is accepted with credentials", async () => {
    const res = await fetch(`${getBaseUrl()}/api/entities/tournaments`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://allowed.example.com",
        "Access-Control-Request-Method": "GET",
      },
    });
    assert.ok(res.status < 400, `expected success, got ${res.status}`);
    assert.equal(res.headers.get("access-control-allow-origin"), "https://allowed.example.com");
    assert.equal(res.headers.get("access-control-allow-credentials"), "true");
    assert.notEqual(res.headers.get("access-control-allow-origin"), "*", "no wildcard with credentials");
  });

  test("preflight from a disallowed origin is not granted access", async () => {
    const res = await fetch(`${getBaseUrl()}/api/entities/tournaments`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://evil.example.com",
        "Access-Control-Request-Method": "GET",
      },
    });
    assert.notEqual(
      res.headers.get("access-control-allow-origin"),
      "https://evil.example.com",
      "a disallowed origin must not receive an allow-origin header",
    );
  });

  test("a normal same-origin request needs no Origin header", async () => {
    const res = await fetch(`${getBaseUrl()}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
  });
});
