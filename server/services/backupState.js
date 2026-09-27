import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Operational status for the secondary (GitHub) backup.
//
// The periodic backup runs in a separate process from the API server, so its
// health is shared through a small JSON file on the persistent disk rather than
// in-memory state. The file never contains the token, the Authorization header,
// the full remote URL, or absolute filesystem paths: only timestamps, counters,
// and the repository slug, and it is only ever served through an admin-gated
// endpoint.
//
// A backup failure must not take the application down (the primary database is
// unaffected by a failed off-box copy), so this module is deliberately
// best-effort: read/write errors are swallowed and reported as "unknown" health
// instead of throwing into a request path.

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function defaultStatusPath() {
  const dbPath = process.env.BACKUP_DB_PATH || process.env.CORE_DB_PATH;
  if (dbPath) return path.join(path.dirname(dbPath), "backup-status.json");
  return path.join(__dirname, "..", "data", "backup-status.json");
}

export function backupStatusPath() {
  return process.env.BACKUP_STATUS_PATH || defaultStatusPath();
}

// Consecutive failures at or above this threshold are reported as "failing" so an
// operator sees a sustained problem rather than one transient push error.
export const BACKUP_FAILURE_THRESHOLD = 3;

export function readBackupState() {
  try {
    const raw = fs.readFileSync(backupStatusPath(), "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writeBackupState(state) {
  try {
    const target = backupStatusPath();
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    return true;
  } catch {
    return false;
  }
}

// repo is the "owner/name" slug only — never a URL and never the token.
function baseState(previous, repo) {
  return {
    repo: repo || previous?.repo || null,
    lastSuccessAt: previous?.lastSuccessAt ?? null,
    lastFailureAt: previous?.lastFailureAt ?? null,
    lastError: previous?.lastError ?? null,
    consecutiveFailures: previous?.consecutiveFailures ?? 0,
    successCount: previous?.successCount ?? 0,
    failureCount: previous?.failureCount ?? 0,
  };
}

export function recordBackupSuccess({ repo, retention } = {}) {
  const previous = readBackupState();
  const state = {
    ...baseState(previous, repo),
    lastSuccessAt: new Date().toISOString(),
    lastError: null,
    consecutiveFailures: 0,
    successCount: (previous?.successCount ?? 0) + 1,
    retention: retention ?? previous?.retention ?? null,
  };
  writeBackupState(state);
  return state;
}

export function recordBackupFailure({ repo, stage, error } = {}) {
  const previous = readBackupState();
  const state = {
    ...baseState(previous, repo),
    lastFailureAt: new Date().toISOString(),
    // Trim to a short message so a stack trace cannot leak paths or URLs into the
    // status file. Stage names are a fixed, non-sensitive vocabulary.
    lastError: { stage: stage || "unknown", message: String(error || "unknown error").slice(0, 200) },
    consecutiveFailures: (previous?.consecutiveFailures ?? 0) + 1,
    failureCount: (previous?.failureCount ?? 0) + 1,
  };
  writeBackupState(state);
  return state;
}

/**
 * Health summary for the admin endpoint.
 *
 * "enabled" reflects whether backup configuration is present, so a deployment
 * with backups deliberately off is not reported as broken. "status" is the
 * roll-up an operator scans first.
 */
export function getBackupHealth(env = process.env) {
  const configured = Boolean(env.GITHUB_BACKUP_TOKEN && env.GITHUB_BACKUP_REPO);
  const state = readBackupState();

  if (!configured) {
    return {
      enabled: false,
      status: "disabled",
      threshold: BACKUP_FAILURE_THRESHOLD,
      lastSuccessAt: state?.lastSuccessAt ?? null,
      lastFailureAt: state?.lastFailureAt ?? null,
      consecutiveFailures: state?.consecutiveFailures ?? 0,
      successCount: state?.successCount ?? 0,
      failureCount: state?.failureCount ?? 0,
      lastError: state?.lastError ?? null,
    };
  }

  const consecutiveFailures = state?.consecutiveFailures ?? 0;
  let status = "unknown";
  if (consecutiveFailures >= BACKUP_FAILURE_THRESHOLD) status = "failing";
  else if (!state?.lastSuccessAt) status = "pending";
  else if (consecutiveFailures > 0) status = "degraded";
  else status = "ok";

  return {
    enabled: true,
    status,
    threshold: BACKUP_FAILURE_THRESHOLD,
    lastSuccessAt: state?.lastSuccessAt ?? null,
    lastFailureAt: state?.lastFailureAt ?? null,
    consecutiveFailures,
    successCount: state?.successCount ?? 0,
    failureCount: state?.failureCount ?? 0,
    lastError: state?.lastError ?? null,
  };
}
