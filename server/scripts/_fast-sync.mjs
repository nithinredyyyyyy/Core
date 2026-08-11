import Database from "libsql";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const envPath = path.join(rootDir, ".env");

function loadEnvFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  const lines = fs.readFileSync(filepath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || /^\s*#/.test(line) || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = val.replace(/^['"]|['"]$/g, "");
  }
}
loadEnvFile(envPath);

const tursoUrl = String(process.env.TURSO_DATABASE_URL || "").trim();
const tursoToken = String(process.env.TURSO_AUTH_TOKEN || "").trim();
if (!tursoUrl) throw new Error("TURSO_DATABASE_URL not set");

const localDb = new Database(path.join(rootDir, "server", "data", "stagecore.sqlite"));
const remoteDb = new Database(tursoUrl, tursoToken ? { authToken: tursoToken } : {});

const tables = localDb
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%' ORDER BY name")
  .all()
  .map(r => r.name);

console.log(`Syncing ${tables.length} tables to Turso...`);

for (const table of tables) {
  const createSql = localDb.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(table)?.sql;
  if (!createSql) continue;

  try { remoteDb.exec(createSql); } catch (e) {
    if (!String(e.message).includes("already exists")) throw e;
  }

  const localCols = localDb.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  const remoteCols = new Set(remoteDb.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name));
  for (const col of localDb.prepare(`PRAGMA table_info(${table})`).all()) {
    if (remoteCols.has(col.name)) continue;
    const parts = [col.type || "TEXT"];
    if (col.notnull) parts.push("NOT NULL");
    if (col.dflt_value != null) parts.push(`DEFAULT ${col.dflt_value}`);
    try { remoteDb.exec(`ALTER TABLE ${table} ADD COLUMN ${col.name} ${parts.join(" ")}`); } catch {}
  }

  const rows = localDb.prepare(`SELECT * FROM ${table}`).all();
  try { remoteDb.exec(`DELETE FROM ${table}`); } catch {}

  if (rows.length === 0) {
    console.log(`  ${table}: 0 rows (skipped)`);
    continue;
  }

  const placeholders = localCols.map(() => "?").join(",");
  const insert = remoteDb.prepare(`INSERT INTO ${table} (${localCols.join(",")}) VALUES (${placeholders})`);

  const BATCH = 50;
  let synced = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    for (const row of batch) {
      insert.run(...localCols.map(c => row[c]));
    }
    synced += batch.length;
    process.stdout.write(`\r  ${table}: ${synced}/${rows.length}`);
  }
  console.log(`\r  ${table}: ${rows.length} rows ✓`);
}

const remoteCount = remoteDb.prepare("SELECT COUNT(*) as c FROM tournaments").get()?.c;
console.log(`\nDone. Turso tournaments: ${remoteCount}`);
process.exit(0);
