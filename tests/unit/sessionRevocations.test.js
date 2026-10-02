import { test } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createSessionRevocationStore } from "../../server/services/sessionRevocations.js";

const migration = readFileSync(new URL("../../server/db/migrations/010_session_revocations.sql", import.meta.url), "utf8");
const hash = (value) => createHash("sha256").update(value).digest("hex");

test("revocation survives closing/reopening SQLite and prunes only expired rows", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "core-revocations-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filename = join(directory, "test.sqlite");
  let db = new Database(filename);
  t.after(() => { if (db.open) db.close(); });
  db.exec("CREATE TABLE existing_data (value TEXT); INSERT INTO existing_data VALUES ('keep');");
  db.exec(migration);
  let now = 1000;
  let store = createSessionRevocationStore(db, { now: () => now });
  store.revoke(hash("revoked"), 100_000);
  store.revoke(hash("expired"), 2000);
  db.close();
  now = 2000;
  db = new Database(filename);
  store = createSessionRevocationStore(db, { now: () => now });
  assert.equal(store.isRevoked(hash("revoked")), true);
  assert.equal(store.isRevoked(hash("expired")), false);
  assert.equal(db.prepare("SELECT count(*) AS n FROM session_revocations").get().n, 1);
  assert.equal(db.prepare("SELECT value FROM existing_data").get().value, "keep");
  now = 100_000;
  assert.equal(store.isRevoked(hash("revoked")), false);
  assert.equal(db.prepare("SELECT count(*) AS n FROM session_revocations").get().n, 0);
});

test("repeated revocation cannot shorten expiry and expired input is not stored", () => {
  const db = new Database(":memory:");
  try {
    db.exec(migration);
    const store = createSessionRevocationStore(db, { now: () => 1000 });
    store.revoke(hash("same"), 5000);
    store.revoke(hash("same"), 2000);
    store.revoke(hash("old"), 1000);
    assert.deepEqual(db.prepare("SELECT * FROM session_revocations").all(), [
      { token_hash: hash("same"), expires_at: 5000 },
    ]);
  } finally { db.close(); }
});

test("a logged-out session stays rejected by auth in a fresh process", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "core-auth-restart-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const env = { ...process.env, NODE_ENV: "test", CORE_DB_PATH: join(directory, "test.sqlite"),
    CORE_AUTH_SESSION_SECRET: "synthetic-session-restart-test-secret" };
  const authUrl = new URL("../../server/services/auth.js", import.meta.url).href;
  const dbUrl = new URL("../../server/db.js", import.meta.url).href;
  const probe = (script, input) => execFileSync(process.execPath, ["--input-type=module", "-e", script], { env, input, encoding: "utf8" }).trim().split("\n").pop();
  // Tokens stay in process pipes only and are never printed by the test runner.
  const token = probe(`
    const auth = await import(${JSON.stringify(authUrl)});
    const session = auth.createAuthSession({ id: "synthetic", role: "member" });
    auth.revokeRequestToken({ headers: { cookie: "stagecore_auth_token=" + session.token } });
    process.stdout.write(session.token + "\\n");
    (await import(${JSON.stringify(dbUrl)})).db.close();
  `);
  const result = probe(`
    import { readFileSync } from "node:fs";
    const token = readFileSync(0, "utf8");
    const auth = await import(${JSON.stringify(authUrl)});
    const rejected = [token, token + ".suffix"].every(value =>
      !auth.resolveRequestAuth({ headers: { cookie: "stagecore_auth_token=" + value } }).isAuthenticated);
    process.stdout.write(JSON.stringify({ rejected }) + "\\n");
    (await import(${JSON.stringify(dbUrl)})).db.close();
  `, token);
  assert.deepEqual(JSON.parse(result), { rejected: true });
});
