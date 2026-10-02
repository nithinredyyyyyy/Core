#!/bin/bash
set -e

# Persistent database lives on the mounted Render disk at /app/server/data.
DB_PATH="${CORE_DB_PATH:-/app/server/data/stagecore.sqlite}"
# Keep the backup working tree on the persistent disk so it survives restarts
# and never occupies the ephemeral container filesystem.
BACKUP_DIR="${BACKUP_REPO_PATH:-/app/server/data/backup-repo}"

echo "[Run.sh] Initializing Git backup environment..."
mkdir -p "$(dirname "$DB_PATH")"

# The persistent disk is the primary data location. If it is not writable the
# process runs as a non-root user (appuser) against a root-owned mount; fail with
# an actionable message instead of a confusing SQLite error later.
DB_DIR="$(dirname "$DB_PATH")"
if ! touch "$DB_DIR/.write-test" 2>/dev/null; then
  echo "[Run.sh] FATAL: ${DB_DIR} is not writable by user $(id -un) ($(id -u))." >&2
  echo "[Run.sh] The persistent disk must be writable by the container user. Verify the disk mount ownership." >&2
  exit 1
fi
rm -f "$DB_DIR/.write-test"

mkdir -p "$BACKUP_DIR"

# GitHub backup is SECONDARY storage only. Restore semantics:
#   CORE_ALLOW_GITHUB_RESTORE unset/0  -> never restore (normal bootstrap)
#   =1 + populated database            -> never overwrite existing data
#   =1 + absent/empty database         -> attempt recovery from the backup repo
#
# A failed *requested* restore is fatal. If an operator asked for disaster recovery
# and it does not succeed, starting from canonical.export.json would leave them
# believing production data was recovered when it was not, so we stop instead.
restore_requested() {
  case "$(printf '%s' "${CORE_ALLOW_GITHUB_RESTORE:-}" | tr '[:upper:]' '[:lower:]')" in
    1|true|yes) return 0 ;;
    *) return 1 ;;
  esac
}

maybe_restore_from_backup() {
  if [ -s "$DB_PATH" ]; then
    echo "[Run.sh] Persistent database present; skipping restore from GitHub backup."
    return 0
  fi

  if ! restore_requested; then
    echo "[Run.sh] Database empty; GitHub restore not enabled (set CORE_ALLOW_GITHUB_RESTORE=1 to enable). Bootstrapping from canonical seed instead."
    return 0
  fi

  if [ -z "$GITHUB_BACKUP_TOKEN" ] || [ -z "$GITHUB_BACKUP_REPO" ]; then
    echo "[Run.sh] FATAL: explicit GitHub restore requires GITHUB_BACKUP_TOKEN and GITHUB_BACKUP_REPO. Refusing to bootstrap seed data during recovery." >&2
    exit 1
  fi

  echo "[Run.sh] Explicit GitHub restore requested for an empty database. Attempting recovery..."
  # Depth-1 clone into a temporary location. Auth is supplied exclusively through
  # git's environment-based HTTP extra-header so the token never appears in a
  # remote URL, argv (ps), logs, or error output.
  local tmp_dir
  tmp_dir="$(mktemp -d)"
  local restored=0
  if GIT_TERMINAL_PROMPT=0 \
    GIT_CONFIG_COUNT=1 \
    GIT_CONFIG_KEY_0="http.https://github.com/.extraheader" \
    GIT_CONFIG_VALUE_0="Authorization: Basic $(printf 'oauth2:%s' "$GITHUB_BACKUP_TOKEN" | base64)" \
    git clone --depth 1 "https://github.com/${GITHUB_BACKUP_REPO}.git" "$tmp_dir" 2>&1; then
    if [ -f "$tmp_dir/stagecore.sqlite" ]; then
      cp "$tmp_dir/stagecore.sqlite" "$DB_PATH"
      echo "[Run.sh] Restored database from GitHub backup (explicit recovery)."
      restored=1
    else
      echo "[Run.sh] Backup repository cloned, but no stagecore.sqlite found inside." >&2
    fi
  else
    echo "[Run.sh] GitHub restore failed: could not clone the backup repository." >&2
  fi
  rm -rf "$tmp_dir"

  if [ "$restored" -ne 1 ]; then
    echo "[Run.sh] FATAL: explicit GitHub restore was requested but did not succeed." >&2
    echo "[Run.sh] Refusing to start so the missing recovery is not mistaken for success." >&2
    echo "[Run.sh] Fix the backup repository/credentials, or unset CORE_ALLOW_GITHUB_RESTORE to bootstrap from canonical seed." >&2
    exit 1
  fi
}

if [ -n "$GITHUB_BACKUP_TOKEN" ] && [ -n "$GITHUB_BACKUP_REPO" ]; then
  maybe_restore_from_backup

  # Give the backup script the exact paths to use, so it never guesses.
  export BACKUP_DB_PATH="$DB_PATH"
  export BACKUP_REPO_PATH="$BACKUP_DIR"

  # A single instance is expected to run backups; each run snapshots via SQLite's
  # backup API and only reports success after a successful push.
  (
    while true; do
      sleep "${BACKUP_INTERVAL_SECONDS:-600}"
      node server/scripts/github-backup.js || echo "[Backup Loop] Backup script failed; continuing."
    done
  ) &
else
  # Restore may still be requested even when the period backup loop is not
  # configured; handle that case explicitly before declaring backups disabled.
  maybe_restore_from_backup
  echo "[Run.sh] Missing GITHUB_BACKUP_TOKEN or GITHUB_BACKUP_REPO. Backups disabled."
fi

echo "[Run.sh] Starting Node app..."
exec npm start
