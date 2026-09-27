import Database from "better-sqlite3";
import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

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

// 1. Safe SQLite backup to guarantee no corruption during file copy
try {
  const src = new Database(dbPath, { readonly: true });
  await src.backup(backupDbPath);
  src.close();
} catch (err) {
  console.error("[Backup] SQLite backup API failed:", err);
  process.exit(1);
}

// 2. Git commit and push (Overwriting history to prevent repo bloat)
try {
  // Initialize if not already a git repo
  if (!fs.existsSync(path.join(backupRepoPath, ".git"))) {
    execFileSync("git", ["init"], { cwd: backupRepoPath, stdio: "ignore" });
  }

  execFileSync("git", ["config", "user.name", "Backup Bot"], { cwd: backupRepoPath });
  execFileSync("git", ["config", "user.email", "backup@stagecore.local"], { cwd: backupRepoPath });
  execFileSync("git", ["add", "stagecore.sqlite"], { cwd: backupRepoPath });

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
  // Force push to keep repository size minimal (only 1 commit history)
  execFileSync("git", ["push", "--force", remoteUrl, "main"], {
    cwd: backupRepoPath,
    stdio: "ignore",
    env: gitAuthEnv,
  });

  console.log(`[Backup] Successfully force-pushed to ${repo} at ${new Date().toISOString()}`);
} catch (err) {
  console.error("[Backup] Git push failed:", err.message);
  process.exit(1);
}
