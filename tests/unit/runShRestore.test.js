import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

// Exercises run.sh's restore gate against a local bare "GitHub" repository. Every
// path is a throwaway temp directory; the committed database is never touched.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const runSh = path.join(repoRoot, "run.sh");

const temps = [];
function tempDir(prefix) {
  const dir = mkdtempSync(path.join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
}

let staging; // { bin, home, remotes, seedRepo }

function git(args, opts = {}) {
  return execFileSync("git", args, { stdio: "pipe", ...opts });
}

before(() => {
  const root = tempDir("stagecore-runsh-");
  const bin = path.join(root, "bin");
  const home = path.join(root, "home");
  const remotes = path.join(root, "remotes");
  fs.mkdirSync(bin, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  fs.mkdirSync(remotes, { recursive: true });

  // Stub `npm start` so run.sh reaches its hand-off without booting the server.
  fs.writeFileSync(
    path.join(bin, "npm"),
    `#!/bin/bash\necho "[stub npm] start invoked"\nexit 0\n`,
    "utf8",
  );
  fs.chmodSync(path.join(bin, "npm"), 0o755);

  // Point git's https://github.com/ at the local remotes directory so run.sh's
  // token-authenticated clone resolves offline. Never in Git: a temp HOME config.
  const backupRepo = "example/private-backup-repo";
  fs.writeFileSync(
    path.join(home, ".gitconfig"),
    `[url "${remotes}/"]\n\tinsteadOf = https://github.com/\n`,
    "utf8",
  );

  // Build a bare repo that looks like the backup repo, containing stagecore.sqlite.
  const seedRepo = path.join(remotes, "example", "private-backup-repo.git");
  fs.mkdirSync(path.dirname(seedRepo), { recursive: true });
  git(["init", "--bare", "--initial-branch=main", seedRepo]);
  const work = path.join(root, "seed-work");
  fs.mkdirSync(work);
  git(["init"], { cwd: work });
  // A small but valid SQLite-looking file; run.sh only checks existence and copies.
  fs.writeFileSync(path.join(work, "stagecore.sqlite"), "RESTORED_BACKUP_BYTES");
  git(["add", "-A"], { cwd: work });
  git(
    ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-m", "seed backup"],
    { cwd: work },
  );
  git(["branch", "-M", "main"], { cwd: work });
  git(["remote", "add", "origin", seedRepo], { cwd: work });
  git(["push", "origin", "main"], { cwd: work });

  staging = { bin, home, remotes, backupRepo, seedRepo, root };
});

after(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

// Run run.sh in its own process group so the background backup loop cannot leak:
// the whole group is killed once the assertion is done.
function runRunSh({ dbPath, backupDir, env = {} }) {
  return new Promise((resolve) => {
    const child = spawn("bash", [runSh], {
      cwd: repoRoot,
      detached: true,
      env: {
        ...process.env,
        PATH: `${staging.bin}:${process.env.PATH}`,
        HOME: staging.home,
        CORE_DB_PATH: dbPath,
        BACKUP_REPO_PATH: backupDir,
        // Long interval: the loop sleeps and never runs a real backup in this test.
        BACKUP_INTERVAL_SECONDS: "100000",
        // Keep credentials out of the process table; run.sh reads them from env.
        GITHUB_BACKUP_TOKEN: env.GITHUB_BACKUP_TOKEN ?? "test-token",
        GITHUB_BACKUP_REPO: env.GITHUB_BACKUP_REPO ?? staging.backupRepo,
        ...env,
      },
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));

    const finish = (code) => {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        /* already gone */
      }
      resolve({ code: code ?? 0, stdout, stderr });
    };

    child.on("exit", (code) => finish(code));
    child.on("error", () => finish(-1));
    // Safety net if the process hangs.
    setTimeout(() => finish(-1), 20000).unref();
  });
}

function newDbPath() {
  return path.join(tempDir("stagecore-dbdir-"), "stagecore.sqlite");
}

function newBackupDir() {
  return path.join(tempDir("stagecore-bkdir-"), "backup-repo");
}

describe("run.sh restore gate", () => {
  test("populated database + restore flag: existing data is untouched", async () => {
    const dbPath = newDbPath();
    fs.writeFileSync(dbPath, "POPULATED_PRODUCTION_BYTES");

    const result = await runRunSh({
      dbPath,
      backupDir: newBackupDir(),
      env: { CORE_ALLOW_GITHUB_RESTORE: "1" },
    });

    assert.equal(result.code, 0);
    assert.match(result.stdout, /Persistent database present; skipping restore/);
    assert.equal(
      fs.readFileSync(dbPath, "utf8"),
      "POPULATED_PRODUCTION_BYTES",
      "a populated DB is never overwritten, even with restore enabled",
    );
  });

  test("empty database + restore flag + successful backup: restored", async () => {
    const dbPath = newDbPath();

    const result = await runRunSh({
      dbPath,
      backupDir: newBackupDir(),
      env: { CORE_ALLOW_GITHUB_RESTORE: "1" },
    });

    assert.equal(result.code, 0);
    assert.match(result.stdout, /Restored database from GitHub backup/);
    assert.equal(fs.readFileSync(dbPath, "utf8"), "RESTORED_BACKUP_BYTES");
  });

  test("empty database + restore flag + failed backup: exits non-zero, no fallback", async () => {
    const dbPath = newDbPath();

    const result = await runRunSh({
      dbPath,
      backupDir: newBackupDir(),
      // A repo that does not exist under the rewritten prefix -> clone fails.
      env: { CORE_ALLOW_GITHUB_RESTORE: "1", GITHUB_BACKUP_REPO: "example/does-not-exist" },
    });

    assert.notEqual(result.code, 0, "a requested-but-failed restore must fail the boot");
    assert.match(result.stderr, /FATAL: explicit GitHub restore was requested but did not succeed/);
    assert.equal(fs.existsSync(dbPath), false, "no seed/bootstrap data was written in its place");
  });

  test("restore flag set to 0: never restores (treated as disabled)", async () => {
    const dbPath = newDbPath();

    const result = await runRunSh({
      dbPath,
      backupDir: newBackupDir(),
      env: { CORE_ALLOW_GITHUB_RESTORE: "0" },
    });

    assert.equal(result.code, 0);
    assert.match(result.stdout, /GitHub restore not enabled/);
    assert.equal(fs.existsSync(dbPath), false, "nothing restored and nothing seeded by run.sh");
  });

  test("restore flag unset: normal bootstrap path", async () => {
    const dbPath = newDbPath();

    const result = await runRunSh({
      dbPath,
      backupDir: newBackupDir(),
      env: { CORE_ALLOW_GITHUB_RESTORE: "" },
    });

    assert.equal(result.code, 0);
    assert.match(result.stdout, /GitHub restore not enabled/);
    assert.equal(fs.existsSync(dbPath), false);
  });

  test("no backup configured: safe normal behavior", async () => {
    const dbPath = newDbPath();

    const result = await runRunSh({
      dbPath,
      backupDir: newBackupDir(),
      env: { GITHUB_BACKUP_TOKEN: "", GITHUB_BACKUP_REPO: "" },
    });

    assert.equal(result.code, 0);
    assert.match(result.stdout, /Backups disabled/);
  });

  test("restore requested but no backup configured: bootstraps, does not fail", async () => {
    const dbPath = newDbPath();

    const result = await runRunSh({
      dbPath,
      backupDir: newBackupDir(),
      env: {
        CORE_ALLOW_GITHUB_RESTORE: "1",
        GITHUB_BACKUP_TOKEN: "",
        GITHUB_BACKUP_REPO: "",
      },
    });

    assert.equal(result.code, 0);
    assert.match(
      result.stderr,
      /no backup to restore from. Bootstrapping from canonical seed/,
    );
  });

  test("the backup token never appears in run.sh output", async () => {
    const secret = "backup-token-fixture-not-a-real-credential-0001";
    const dbPath = newDbPath();

    const result = await runRunSh({
      dbPath,
      backupDir: newBackupDir(),
      env: { CORE_ALLOW_GITHUB_RESTORE: "1", GITHUB_BACKUP_TOKEN: secret },
    });

    const combined = `${result.stdout}\n${result.stderr}`;
    assert.ok(!combined.includes(secret), "raw token must not leak to logs");
    assert.ok(
      !combined.includes(Buffer.from(`oauth2:${secret}`).toString("base64")),
      "base64 token must not leak to logs",
    );
  });
});
