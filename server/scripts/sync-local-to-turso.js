import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "libsql";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const envPath = path.join(rootDir, ".env");
const localDbPath = path.join(rootDir, "server", "data", "stagecore.sqlite");

function loadEnvFile(filepath) {
  if (!fs.existsSync(filepath)) return;
  const lines = fs.readFileSync(filepath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || /^\s*#/.test(line) || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const rawValue = line.slice(index + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(envPath);

const tursoUrl = String(process.env.TURSO_DATABASE_URL || "").trim();
const tursoAuthToken = String(process.env.TURSO_AUTH_TOKEN || "").trim();

if (!tursoUrl) {
  throw new Error("TURSO_DATABASE_URL is required in .env to sync remote data.");
}

const localDb = new Database(localDbPath);
const remoteDb = new Database(tursoUrl, tursoAuthToken ? { authToken: tursoAuthToken } : {});

function getTableNames(db) {
  return db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all()
    .flatMap((row) =>
      row.name && row.name !== "libsql_wasm_func_table" ? [row.name] : [],
    );
}

function getTableSql(db, table) {
  return db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table)?.sql;
}

function getColumns(db, table) {
  return db.prepare(`PRAGMA table_info(${table})`).all();
}

function syncTableSchema(local, remote, table) {
  const createSql = getTableSql(local, table);
  if (!createSql) {
    throw new Error(`Missing CREATE TABLE SQL for ${table}`);
  }

  try {
    remote.exec(createSql);
  } catch (error) {
    if (!String(error.message || "").includes("already exists")) {
      throw error;
    }
  }

  const localColumns = getColumns(local, table);
  const remoteColumns = new Set(getColumns(remote, table).map((column) => column.name));

  for (const column of localColumns) {
    if (remoteColumns.has(column.name)) continue;
    const pieces = [column.type || "TEXT"];
    if (column.notnull) pieces.push("NOT NULL");
    if (column.dflt_value !== null && column.dflt_value !== undefined) {
      pieces.push(`DEFAULT ${column.dflt_value}`);
    }
    remote.exec(`ALTER TABLE ${table} ADD COLUMN ${column.name} ${pieces.join(" ")}`);
  }
}

function copyTable(local, remote, table) {
  const rows = local.prepare(`SELECT * FROM ${table}`).all();
  const columns = getColumns(local, table).map((column) => column.name);

  remote.exec(`DELETE FROM ${table}`);

  if (rows.length === 0) {
    return { table, copied: 0 };
  }

  const placeholders = columns.map(() => "?").join(", ");
  const insert = remote.prepare(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`
  );

  for (const row of rows) {
    insert.run(...columns.map((column) => row[column]));
  }

  return { table, copied: rows.length };
}

function countRows(db, table) {
  return Number(db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()?.count || 0);
}

function main() {
  const tables = getTableNames(localDb);
  const summary = [];

  for (const table of tables) {
    syncTableSchema(localDb, remoteDb, table);
    const result = copyTable(localDb, remoteDb, table);
    const remoteCount = countRows(remoteDb, table);
    summary.push({
      table,
      localCount: result.copied,
      remoteCount,
    });
  }

  console.log(JSON.stringify({ syncedTables: summary.length, summary }, null, 2));
}

main();
