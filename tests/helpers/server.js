import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Set at module scope: test files import server modules immediately after this
// helper, and the DB path is read when server/db/schema.js first loads. Setting
// it inside startServer() would be too late. Keeps integration fixtures out of
// the committed server/data/stagecore.sqlite.
// Synthetic identities only: integration tests must not depend on dashboard env.
process.env.CORE_ADMIN_EMAILS = "admin@example.com,admin@example.test";
let tempDir;
if (!process.env.CORE_DB_PATH) {
  tempDir = mkdtempSync(join(tmpdir(), "stagecore-test-"));
  process.env.CORE_DB_PATH = join(tempDir, "stagecore.sqlite");
}

let httpServer;
let baseUrl;

export async function startServer() {
  process.env.NODE_ENV = "test";
  const mod = await import("../../server/index.js");
  httpServer = mod.httpServer;

  return new Promise((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(0, () => {
      httpServer.removeListener("error", reject);
      const { port } = httpServer.address();
      baseUrl = `http://localhost:${port}`;
      resolve(baseUrl);
    });
  });
}

export async function stopServer() {
  if (!httpServer) return;
  await new Promise((resolve) => {
    httpServer.closeAllConnections?.();
    httpServer.close(() => resolve());
  });
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
}

export function getBaseUrl() {
  return baseUrl;
}
