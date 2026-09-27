import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.CORE_AUTH_SESSION_SECRET = "test-session-secret-for-backup-status";

// A private status file for this test file, so it never reads or writes the one a
// running deployment would use.
const statusDir = mkdtempSync(join(tmpdir(), "stagecore-backup-status-"));
process.env.BACKUP_STATUS_PATH = join(statusDir, "backup-status.json");

const { startServer, stopServer, getBaseUrl } = await import("./helpers/server.js");
const { createAuthSession } = await import("../server/services/auth.js");
const { recordBackupSuccess, recordBackupFailure } = await import(
  "../server/services/backupState.js"
);

function cookieHeader(token) {
  return `stagecore_auth_token=${token}`;
}
function adminToken() {
  return createAuthSession({
    id: "user-admin",
    email: "admin@example.com",
    full_name: "Admin",
    role: "admin",
    auth_method: "google",
  }).token;
}
function memberToken() {
  return createAuthSession({
    id: "user-member",
    email: "member@example.com",
    full_name: "Member",
    role: "member",
    auth_method: "google",
  }).token;
}

function resetStatusFile() {
  try {
    rmSync(process.env.BACKUP_STATUS_PATH, { force: true });
  } catch {
    /* nothing to remove */
  }
}

async function getStatus(cookie) {
  return fetch(`${getBaseUrl()}/api/admin/backup-status`, {
    headers: cookie ? { Cookie: cookieHeader(cookie) } : {},
  });
}

describe("backup status endpoint", () => {
  before(async () => {
    await startServer();
  });
  after(async () => {
    await stopServer();
    rmSync(statusDir, { recursive: true, force: true });
  });
  beforeEach(() => {
    resetStatusFile();
  });

  test("requires authentication", async () => {
    const res = await getStatus(null);
    assert.equal(res.status, 401);
  });

  test("a non-admin member is forbidden", async () => {
    const res = await getStatus(memberToken());
    assert.equal(res.status, 403);
  });

  test("reports disabled when backup is not configured", async () => {
    process.env.GITHUB_BACKUP_TOKEN = "";
    process.env.GITHUB_BACKUP_REPO = "";

    const res = await getStatus(adminToken());
    assert.equal(res.status, 200);
    const { backup } = await res.json();
    assert.equal(backup.enabled, false);
    assert.equal(backup.status, "disabled");
  });

  test("reports unknown/pending before the first successful backup", async () => {
    process.env.GITHUB_BACKUP_TOKEN = "token";
    process.env.GITHUB_BACKUP_REPO = "example/private-backup-repo";

    const res = await getStatus(adminToken());
    const { backup } = await res.json();
    assert.equal(backup.enabled, true);
    assert.equal(backup.status, "pending");
    assert.equal(backup.lastSuccessAt, null);
  });

  test("reports ok after a successful backup", async () => {
    process.env.GITHUB_BACKUP_TOKEN = "token";
    process.env.GITHUB_BACKUP_REPO = "example/private-backup-repo";
    recordBackupSuccess({ repo: "example/private-backup-repo", retention: 7 });

    const res = await getStatus(adminToken());
    const { backup } = await res.json();
    assert.equal(backup.status, "ok");
    assert.ok(backup.lastSuccessAt, "reports the last success time");
    assert.equal(backup.consecutiveFailures, 0);
  });

  test("reports degraded after a failure following a success", async () => {
    process.env.GITHUB_BACKUP_TOKEN = "token";
    process.env.GITHUB_BACKUP_REPO = "example/private-backup-repo";
    recordBackupSuccess({ repo: "example/private-backup-repo" });
    recordBackupFailure({ repo: "example/private-backup-repo", stage: "git-push", error: "boom" });

    const res = await getStatus(adminToken());
    const { backup } = await res.json();
    assert.equal(backup.status, "degraded");
    assert.equal(backup.consecutiveFailures, 1);
    assert.equal(backup.lastError.stage, "git-push");
  });

  test("reports failing after sustained consecutive failures", async () => {
    process.env.GITHUB_BACKUP_TOKEN = "token";
    process.env.GITHUB_BACKUP_REPO = "example/private-backup-repo";
    for (let i = 0; i < 3; i += 1) {
      recordBackupFailure({ repo: "example/private-backup-repo", stage: "git-push", error: `e${i}` });
    }

    const res = await getStatus(adminToken());
    const { backup } = await res.json();
    assert.equal(backup.status, "failing");
    assert.equal(backup.consecutiveFailures, 3);
  });

  test("never exposes the token or absolute paths", async () => {
    const secret = "backup-token-fixture-not-a-real-credential-0002";
    process.env.GITHUB_BACKUP_TOKEN = secret;
    process.env.GITHUB_BACKUP_REPO = "example/private-backup-repo";
    recordBackupSuccess({ repo: "example/private-backup-repo" });

    const res = await getStatus(adminToken());
    const body = JSON.stringify(await res.json());
    assert.ok(!body.includes(secret), "token must never be serialized");
    assert.ok(!body.includes(statusDir), "filesystem paths must never be serialized");
    assert.ok(!body.includes("token"), "no token field should be present");
  });

  test("a corrupt status file degrades safely instead of erroring", async () => {
    process.env.GITHUB_BACKUP_TOKEN = "token";
    process.env.GITHUB_BACKUP_REPO = "example/private-backup-repo";
    writeFileSync(process.env.BACKUP_STATUS_PATH, "{ not valid json", "utf8");

    const res = await getStatus(adminToken());
    assert.equal(res.status, 200, "a bad status file must not break the endpoint");
    const { backup } = await res.json();
    assert.equal(backup.status, "pending");
  });
});
