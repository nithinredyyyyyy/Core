import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { applySqlMigrations } from '../../server/db/migrate.js';

const digest = value => createHash('sha256').update(value).digest('hex');
function snapshot(db) {
  return Object.fromEntries(db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(({name}) => {
    const rows = db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`).all().map(row => JSON.stringify(row)).sort();
    return [name, { rows: rows.length, sha256: digest(JSON.stringify(rows)) }];
  }));
}

test('migration 010 twice preserves every committed application row and is idempotent', () => {
  const temporary = mkdtempSync(path.join(tmpdir(), 'core-migration010-'));
  const committed = execFileSync('git', ['show', 'HEAD:server/data/stagecore.sqlite'], { maxBuffer: 64 * 1024 * 1024 });
  const source = new URL('../../server/data/stagecore.sqlite', import.meta.url);
  const sourceBefore = digest(readFileSync(source));
  let db;
  try {
    const dbPath = path.join(temporary, 'copy.sqlite');
    writeFileSync(dbPath, committed);
    db = new Database(dbPath);
    const migrations = path.join(temporary, 'migrations');
    mkdirSync(migrations);
    const sql = readFileSync(new URL('../../server/db/migrations/010_session_revocations.sql', import.meta.url), 'utf8');
    writeFileSync(path.join(migrations, '010_session_revocations.sql'), sql);
    const before = snapshot(db);
    const first = applySqlMigrations(db, migrations);
    const afterFirst = snapshot(db);
    const second = applySqlMigrations(db, migrations);
    const afterSecond = snapshot(db);
    assert.deepEqual(first.applied, ['010_session_revocations.sql']);
    assert.deepEqual(second.applied, []);
    assert.deepEqual(second.skipped, ['010_session_revocations.sql']);
    for (const [table, state] of Object.entries(before)) {
      if (table !== 'schema_migrations') assert.deepEqual(afterFirst[table], state, table);
    }
    assert.equal(afterFirst.schema_migrations.rows, before.schema_migrations.rows + 1);
    assert.equal(afterFirst.session_revocations.rows, 0);
    assert.deepEqual(afterSecond, afterFirst);
    // Also execute the SQL itself twice: verify IF NOT EXISTS, independent of the ledger.
    db.exec(sql); db.exec(sql);
    assert.deepEqual(snapshot(db), afterSecond);
    assert.equal(db.pragma('integrity_check', { simple: true }), 'ok');
    assert.equal(digest(readFileSync(source)), sourceBefore);
    if (process.env.ROLLOUT_MIGRATION_EVIDENCE) writeFileSync(process.env.ROLLOUT_MIGRATION_EVIDENCE, JSON.stringify({
      committedSha256: digest(committed), workingDbUnchanged: true, first, second, before, afterFirst, afterSecond, rawSqlRepeated: true, integrityCheck: 'ok',
    }, null, 2) + '\n');
  } finally { db?.close(); rmSync(temporary, { recursive: true, force: true }); }
});
