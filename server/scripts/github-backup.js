import Database from "better-sqlite3";
import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { recordBackupFailure, recordBackupSuccess } from "../services/backupState.js";

const localDbPath = path.resolve(process.cwd(), "server/data/stagecore.sqlite");
const dockerDbPath = "/app/server/data/stagecore.sqlite";
const dbPath = process.env.BACKUP_DB_PATH || (fs.existsSync(dockerDbPath) ? dockerDbPath : localDbPath);
const backupRepoPath =
  process.env.BACKUP_REPO_PATH ||
  (dbPath === dockerDbPath
    ? "/app/server/backup-repo"
    : path.resolve(process.cwd(), "server/backup-repo"));
const backupDbPath = path.join(backupRepoPath, "stagecore.sqlite");

if (!fs.existsSync(dbPath)) {
  console.log("[Backup] Database not found, skipping.");
  process.exit(0);
}

if (!fs.existsSync(backupRepoPath)) {
  fs.mkdirSync(backupRepoPath, { recursive: true });
}

const token = process.env.GITHUB_BACKUP_TOKEN;
const repo = process.env.GITHUB_BACKUP_REPO;
if (!token || !repo) {
  console.log("[Backup] Missing GitHub credentials, skipping.");
  process.exit(0);
}

console.log("[Backup] Starting safe database backup...");

// Authenticate git over HTTPS without ever placing the token in process argv or
// in an error message. A remote URL of the form https://oauth2:<token>@github.com
// would be visible in `ps`, and git echoes the full command line on failure, so
// any failed push would log the token. Instead pass an Authorization header to
// git through its config environment variables, which stay out of argv and out
// of git's error output.
const gitAuthEnv = {
  ...process.env,
  GIT_TERMINAL_PROMPT: "0",
  GIT_CONFIG_COUNT: "1",
  GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
  GIT_CONFIG_VALUE_0:
    "Authorization: Basic " + Buffer.from(`oauth2:${token}`).toString("base64"),
};

// 1. Safe SQLite backup to guarantee no corruption during file copy.
// The source is opened read-only, so this never mutates the live database.
try {
  const src = new Database(dbPath, { readonly: true });
  await src.backup(backupDbPath);
  src.close();
} catch (err) {
  console.error("[Backup] SQLite backup API failed:", err.message);
  recordBackupFailure({ repo, stage: "sqlite-backup", error: err.message });
  process.exit(1);
}

// 2. Snapshot retention.
//
// `git commit --amend` + force-push keeps repository history at a single commit
// so the repo never grows from commit history. On its own that means only the
// most recent backup is recoverable, so we additionally keep a bounded set of
// timestamped snapshots inside the working tree:
//
//   stagecore.sqlite                         latest snapshot (simple restore)
//   snapshots/stagecore-<ISO>.sqlite         point-in-time copies
//
// The newest BACKUP_RETENTION snapshots are kept (default 7) and older ones are
// pruned, so worst-case repo size is bounded at roughly
// BACKUP_RETENTION x database size, independent of how often backups run.
const RETENTION = Math.max(1, Number.parseInt(process.env.BACKUP_RETENTION || "7", 10));
const snapshotsDir = path.join(backupRepoPath, "snapshots");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const snapshotPath = path.join(snapshotsDir, `stagecore-${timestamp}.sqlite`);

try {
  fs.mkdirSync(snapshotsDir, { recursive: true });
  fs.copyFileSync(backupDbPath, snapshotPath);
} catch (err) {
  console.error("[Backup] Failed to write timestamped snapshot:", err.message);
  recordBackupFailure({ repo, stage: "snapshot", error: err.message });
  process.exit(1);
}

function pruneOldSnapshots() {
  try {
    const entries = fs
      .readdirSync(snapshotsDir)
      .filter((name) => /^stagecore-.*\.sqlite$/.test(name))
      .sort();
    const excess = entries.length - RETENTION;
    if (excess <= 0) return;
    for (const name of entries.slice(0, excess)) {
      fs.unlinkSync(path.join(snapshotsDir, name));
      console.log(`[Backup] Pruned old snapshot ${name} (retention=${RETENTION}).`);
    }
  } catch (err) {
    console.error("[Backup] Snapshot pruning failed:", err.message);
  }
}

pruneOldSnapshots();

// 3. Git commit and push (single-commit history; snapshots live in the tree).
try {
  // Initialize if not already a git repo
  if (!fs.existsSync(path.join(backupRepoPath, ".git"))) {
    execFileSync("git", ["init"], { cwd: backupRepoPath, stdio: "ignore" });
  }

  execFileSync("git", ["config", "user.name", "Backup Bot"], { cwd: backupRepoPath });
  execFileSync("git", ["config", "user.email", "backup@stagecore.local"], { cwd: backupRepoPath });
  execFileSync("git", ["add", "-A"], { cwd: backupRepoPath });

  let hasCommits = false;
  try {
    execFileSync("git", ["rev-parse", "HEAD"], { cwd: backupRepoPath, stdio: "ignore" });
    hasCommits = true;
  } catch (e) {
    hasCommits = false;
  }

  if (hasCommits) {
    execFileSync("git", ["commit", "--amend", "-m", "Automated DB Backup", "--no-edit"], {
      cwd: backupRepoPath,
      stdio: "ignore",
    });
  } else {
    execFileSync("git", ["commit", "-m", "Initial Backup"], { cwd: backupRepoPath, stdio: "ignore" });
  }

  // Ensure branch is main
  execFileSync("git", ["branch", "-M", "main"], { cwd: backupRepoPath, stdio: "ignore" });

  const remoteUrl = `https://github.com/${repo}.git`;
  // Force push to keep repository history at a single commit (bounded size).
  execFileSync("git", ["push", "--force", remoteUrl, "main"], {
    cwd: backupRepoPath,
    stdio: "ignore",
    env: gitAuthEnv,
  });

  // Only report durable success after the push actually succeeds.
  console.log(
    `[Backup] Successfully force-pushed to ${repo} at ${new Date().toISOString()} (retention=${RETENTION}).`,
  );
  recordBackupSuccess({ repo, retention: RETENTION });
} catch (err) {
  console.error("[Backup] Git push failed:", err.message);
  recordBackupFailure({ repo, stage: "git-push", error: err.message });
  process.exit(1);
}
