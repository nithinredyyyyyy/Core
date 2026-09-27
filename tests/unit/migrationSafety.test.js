import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { applySqlMigrations, listMigrationFiles } from "../../server/db/migrate.js";

const execFileAsync = promisify(execFile);

// Every database in this file is a throwaway file in the OS temp directory. The
// committed server/data/stagecore.sqlite is never opened here.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const realMigrationDir = path.join(repoRoot, "server", "db", "migrations");

const temps = [];
function tempDir(prefix = "stagecore-migrate-") {
  const dir = mkdtempSync(path.join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
}
after(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function openTempDb() {
  const dbPath = path.join(tempDir(), "test.sqlite");
  return new Database(dbPath);
}

// A throwaway migration directory so the real migration set is never altered.
function tempMigrationDir(files) {
  const dir = tempDir("stagecore-migdir-");
  for (const [name, sql] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), sql, "utf8");
  }
  return dir;
}

// Imports the app's DB module in a fresh process so the startup path (schema
// creation -> migrations -> seed) runs exactly as it would on boot. Returns the
// process exit code, which is what a production boot would surface.
async function bootAppWith({ dbPath, migrationDir, allowSeed = false }) {
  const script = `
    process.env.NODE_ENV = "test";
    const db = await import(${JSON.stringify(new URL("../../server/db.js", import.meta.url).href)});
    ${allowSeed ? `const seed = await import(${JSON.stringify(new URL("../../server/services/seed.js", import.meta.url).href)}); seed.seedIfEmpty();` : ""}
    db.db.close();
  `;
  try {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      ["--input-type=module", "-e", script],
      {
        cwd: repoRoot,
        env: {
          ...process.env,
          NODE_ENV: "test",
          CORE_DB_PATH: dbPath,
          ...(migrationDir ? { CORE_MIGRATION_DIR: migrationDir } : {}),
        },
      },
    );
    return { code: 0, stdout, stderr };
  } catch (error) {
    return { code: error.code ?? 1, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
  }
}

function ledgerOf(dbPath) {
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  const ids = db.prepare("SELECT id FROM schema_migrations ORDER BY id").all().map((r) => r.id);
  db.close();
  return ids;
}

describe("migration runner: ordering, ledger, idempotency", () => {
  test("applies migrations in lexicographic order and records each once", () => {
    const db = openTempDb();
    const dir = tempMigrationDir({
      "002_second.sql": "CREATE TABLE IF NOT EXISTS two (id TEXT);",
      "001_first.sql": "CREATE TABLE IF NOT EXISTS one (id TEXT);",
      "010_tenth.sql": "CREATE TABLE IF NOT EXISTS ten (id TEXT);",
    });

    const { applied } = applySqlMigrations(db, dir);
    assert.deepEqual(applied, ["001_first.sql", "002_second.sql", "010_tenth.sql"]);

    const ledger = db.prepare("SELECT id FROM schema_migrations ORDER BY id").all().map((r) => r.id);
    assert.deepEqual(ledger, ["001_first.sql", "002_second.sql", "010_tenth.sql"]);

    // Second run is a no-op: nothing applied, everything already present.
    const second = applySqlMigrations(db, dir);
    assert.deepEqual(second.applied, []);
    assert.deepEqual(second.skipped, ["001_first.sql", "002_second.sql", "010_tenth.sql"]);
    db.close();
  });

  test("the committed migration set lists cleanly", () => {
    const files = listMigrationFiles(realMigrationDir);
    assert.ok(files.length > 0);
    assert.deepEqual([...files].sort(), files, "committed migrations sort in apply order");
  });
});

describe("migration runner: failure is fatal and atomic", () => {
  test("a failing migration throws and is not recorded in the ledger", () => {
    const db = openTempDb();
    const dir = tempMigrationDir({
      "001_ok.sql": "CREATE TABLE IF NOT EXISTS one (id TEXT);",
      "002_broken.sql": "SELECT * FROM table_that_does_not_exist;",
      "003_never.sql": "CREATE TABLE IF NOT EXISTS three (id TEXT);",
    });

    assert.throws(() => applySqlMigrations(db, dir), /table_that_does_not_exist/);

    const ledger = db.prepare("SELECT id FROM schema_migrations").all().map((r) => r.id);
    assert.deepEqual(ledger, ["001_ok.sql"], "only the successful migration is recorded");
    assert.equal(
      db.prepare("SELECT 1 FROM sqlite_master WHERE name='three'").get(),
      undefined,
      "later migrations are not attempted after a failure",
    );
    db.close();
  });

  test("a failed migration rolls its own partial changes back", () => {
    const db = openTempDb();
    const dir = tempMigrationDir({
      "001_base.sql": "CREATE TABLE IF NOT EXISTS base (id TEXT);",
      "002_partial_then_fail.sql":
        "CREATE TABLE IF NOT EXISTS partial (id TEXT);\nSELECT * FROM missing_table;",
    });

    assert.throws(() => applySqlMigrations(db, dir));

    assert.ok(
      db.prepare("SELECT 1 FROM sqlite_master WHERE name='base'").get(),
      "the earlier successful migration persists",
    );
    assert.equal(
      db.prepare("SELECT 1 FROM sqlite_master WHERE name='partial'").get(),
      undefined,
      "the failed migration's partial DDL was rolled back",
    );
    db.close();
  });

  test("a failed migration is retried rather than silently skipped", () => {
    const db = openTempDb();
    const dir = tempMigrationDir({ "001_dup.sql": "SELECT * FROM nope;" });
    assert.throws(() => applySqlMigrations(db, dir));
    assert.throws(() => applySqlMigrations(db, dir), /nope/);
    assert.equal(
      db.prepare("SELECT COUNT(*) c FROM schema_migrations").get().c,
      0,
      "a failed migration never leaves a ledger row behind",
    );
    db.close();
  });
});

describe("migration startup behavior (real app import path)", () => {
  test("fresh DB: migrations create the expected schema, integrity ok, zero FK issues", async () => {
    const dbPath = path.join(tempDir(), "fresh.sqlite");
    const result = await bootAppWith({ dbPath });

    assert.equal(result.code, 0, `boot should succeed\n${result.stderr}`);

    const db = new Database(dbPath, { readonly: true, fileMustExist: true });
    assert.equal(db.pragma("integrity_check")[0].integrity_check, "ok");
    assert.equal(db.pragma("foreign_key_check").length, 0);
    const tournamentsTable = db
      .prepare("SELECT count(*) c FROM sqlite_master WHERE type='table' AND name='tournaments'")
      .get().c;
    assert.equal(tournamentsTable, 1, "base schema is present");
    db.close();

    assert.deepEqual(ledgerOf(dbPath), listMigrationFiles(realMigrationDir));
  });

  test("existing DB: migrations apply without dropping existing data", async () => {
    const dbPath = path.join(tempDir(), "existing.sqlite");
    // First boot creates the schema and the ledger.
    assert.equal((await bootAppWith({ dbPath })).code, 0);

    // Insert a durable row, then boot again (migrations are skipped).
    const before = new Database(dbPath);
    before
      .prepare(
        "INSERT INTO tournaments (id, name, game, created_date, updated_date) VALUES (?,?,?,?,?)",
      )
      .run("keep-1", "Keep Me", "BGMI", new Date().toISOString(), new Date().toISOString());
    before.close();

    const result = await bootAppWith({ dbPath });
    assert.equal(result.code, 0);

    const after = new Database(dbPath, { readonly: true });
    assert.equal(
      after.prepare("SELECT name FROM tournaments WHERE id=?").get("keep-1").name,
      "Keep Me",
    );
    after.close();
  });

  test("failed migration: the boot exits non-zero and does not reseed", async () => {
    const dbPath = path.join(tempDir(), "failmig.sqlite");
    const brokenDir = tempMigrationDir({
      "001_ok.sql": "SELECT 1;",
      "002_broken.sql": "SELECT * FROM nope;",
    });

    const result = await bootAppWith({ dbPath, migrationDir: brokenDir, allowSeed: true });

    assert.notEqual(result.code, 0, "a migration failure must fail startup");
    assert.match(result.stderr, /Database migration failed/);

    // The failure happened during import, so seeding never ran: the DB was not
    // silently seeded after the failure.
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });
    const hasTournaments = db
      .prepare("SELECT count(*) c FROM sqlite_master WHERE name='tournaments'")
      .get().c;
    if (hasTournaments) {
      assert.equal(
        db.prepare("SELECT COUNT(*) c FROM tournaments").get().c,
        0,
        "no seed data was applied after a failed migration",
      );
    }
    db.close();
  });
});
