import Database from "better-sqlite3";
import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const dbPath = "/app/server/data/stagecore.sqlite";
const backupRepoPath = "/app/server/backup-repo";
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
    execSync("git init", { cwd: backupRepoPath, stdio: "ignore" });
  }
  
  execSync("git config user.name 'Backup Bot'", { cwd: backupRepoPath });
  execSync("git config user.email 'backup@stagecore.local'", { cwd: backupRepoPath });
  execSync("git add stagecore.sqlite", { cwd: backupRepoPath });
  
  let hasCommits = false;
  try {
    execSync("git rev-parse HEAD", { cwd: backupRepoPath, stdio: "ignore" });
    hasCommits = true;
  } catch (e) {
    hasCommits = false;
  }

  if (hasCommits) {
    execSync("git commit --amend -m 'Automated DB Backup' --no-edit", { cwd: backupRepoPath, stdio: "ignore" });
  } else {
    execSync("git commit -m 'Initial Backup'", { cwd: backupRepoPath, stdio: "ignore" });
  }

  // Ensure branch is main
  execSync("git branch -M main", { cwd: backupRepoPath, stdio: "ignore" });

  const remoteUrl = `https://oauth2:${token}@github.com/${repo}.git`;
  // Force push to keep repository size minimal (only 1 commit history)
  execSync(`git push --force "${remoteUrl}" main`, { cwd: backupRepoPath, stdio: "ignore" });
  
  console.log(`[Backup] Successfully force-pushed to ${repo} at ${new Date().toISOString()}`);
} catch (err) {
  console.error("[Backup] Git push failed:", err.message);
  process.exit(1);
}
