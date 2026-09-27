import fs from "node:fs";
import path from "node:path";

// SQL migration runner, extracted from schema.js so it can be exercised against a
// throwaway database in tests without importing the live singleton connection.
//
// Behaviour that callers depend on:
//   - ordering: files are applied in lexicographic order, so numeric prefixes are
//     the migration order,
//   - idempotency: a migration already recorded in schema_migrations is skipped,
//   - atomicity: each migration's statements and its ledger row commit together,
//     so a failure leaves neither the schema change nor the ledger entry behind,
//   - ledger integrity: a migration is recorded only after its SQL succeeds.

export const MIGRATION_LEDGER_DDL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    applied_date TEXT NOT NULL
  )
`;

export function ensureMigrationLedger(db) {
  db.exec(MIGRATION_LEDGER_DDL);
}

export function listMigrationFiles(migrationDir) {
  return fs
    .readdirSync(migrationDir)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));
}

export function appliedMigrationIds(db) {
  return new Set(
    db.prepare("SELECT id FROM schema_migrations").all().map((row) => row.id),
  );
}

/**
 * Apply every pending migration in `migrationDir` to `db`.
 *
 * Throws on the first failure after rolling that migration's transaction back.
 * Callers must treat a throw as fatal: continuing on a partially migrated schema
 * risks running the application against tables it cannot understand.
 *
 * @returns {{ applied: string[], skipped: string[] }}
 */
export function applySqlMigrations(db, migrationDir) {
  ensureMigrationLedger(db);

  const runInTransaction = (fn) => db.transaction(fn)();
  const alreadyApplied = appliedMigrationIds(db);
  const applied = [];
  const skipped = [];

  for (const file of listMigrationFiles(migrationDir)) {
    if (alreadyApplied.has(file)) {
      skipped.push(file);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationDir, file), "utf8").trim();
    if (!sql) {
      skipped.push(file);
      continue;
    }

    runInTransaction(() => {
      db.exec(sql);
      db.prepare(
        "INSERT INTO schema_migrations (id, applied_date) VALUES (?, ?)",
      ).run(file, new Date().toISOString());
    });
    applied.push(file);
  }

  return { applied, skipped };
}
