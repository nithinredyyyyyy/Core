import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const authModuleUrl = new URL("../../server/services/auth.js", import.meta.url).href;

// The probe imports server/services/auth.js, which imports server/db.js and runs
// migrations. Give every probe its own throwaway database so the committed
// server/data/stagecore.sqlite is never opened (and never mutated) by tests.
const probeDbDir = mkdtempSync(path.join(tmpdir(), "stagecore-authcookie-"));
const probeDbPath = path.join(probeDbDir, "stagecore.sqlite");
process.on("exit", () => rmSync(probeDbDir, { recursive: true, force: true }));

// The cookie module reads its SameSite/Secure policy from env at import time,
// so each deployment shape needs its own process to exercise the real code.
const PROBE = `
import express from "express";
import { issueAuthSessionCookies } from ${JSON.stringify(authModuleUrl)};

const app = express();
app.get("/probe", (req, res) => {
  issueAuthSessionCookies(res, "probe-token");
  res.json({ ok: true });
});

const server = app.listen(0, async () => {
  const { port } = server.address();
  const response = await fetch("http://127.0.0.1:" + port + "/probe");
  process.stdout.write(JSON.stringify(response.headers.getSetCookie()));
  server.close();
});
`;

async function probeCookies(env) {
  const { stdout } = await execFileAsync(
    process.execPath,
    ["--input-type=module", "-e", PROBE],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        CORE_DB_PATH: probeDbPath,
        CORE_AUTH_SESSION_SECRET: "cookie-policy-probe-secret",
        ...env,
      },
    },
  );
  return JSON.parse(stdout);
}

function findCookie(cookies, name) {
  return cookies.find((cookie) => cookie.startsWith(`${name}=`)) || "";
}

describe("auth session cookie attributes", () => {
  test("Render same-origin production uses HttpOnly, Secure, SameSite=Lax", async () => {
    const cookies = await probeCookies({
      NODE_ENV: "production",
      CORE_AUTH_COOKIE_SAMESITE: "lax",
    });

    const session = findCookie(cookies, "stagecore_auth_token");
    assert.match(session, /HttpOnly/);
    assert.match(session, /Secure/);
    assert.match(session, /SameSite=Lax/);

    // The CSRF cookie must stay readable by the SPA so it can echo the header.
    const csrf = findCookie(cookies, "stagecore_csrf");
    assert.doesNotMatch(csrf, /HttpOnly/);
    assert.match(csrf, /SameSite=Lax/);
  });

  test("Vercel cross-origin production uses HttpOnly, Secure, SameSite=None", async () => {
    const cookies = await probeCookies({
      NODE_ENV: "production",
      CORE_AUTH_COOKIE_SAMESITE: "none",
    });

    const session = findCookie(cookies, "stagecore_auth_token");
    assert.match(session, /HttpOnly/);
    assert.match(session, /Secure/);
    assert.match(session, /SameSite=None/);
  });

  test("production defaults to SameSite=None without an explicit override", async () => {
    const cookies = await probeCookies({
      NODE_ENV: "production",
      CORE_AUTH_COOKIE_SAMESITE: "",
    });

    assert.match(findCookie(cookies, "stagecore_auth_token"), /SameSite=None/);
  });

  test("development defaults to SameSite=Lax and does not force Secure", async () => {
    const cookies = await probeCookies({
      NODE_ENV: "development",
      CORE_AUTH_COOKIE_SAMESITE: "",
    });

    const session = findCookie(cookies, "stagecore_auth_token");
    assert.match(session, /HttpOnly/);
    assert.match(session, /SameSite=Lax/);
    assert.doesNotMatch(session, /Secure/);
  });
});
