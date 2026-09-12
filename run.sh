#!/bin/bash
set -e

DB_PATH="/app/server/data/stagecore.sqlite"
BACKUP_DIR="/app/server/backup-repo"

echo "[Run.sh] Initializing Git backup environment..."
mkdir -p "$BACKUP_DIR"

if [ -n "$GITHUB_BACKUP_TOKEN" ] && [ -n "$GITHUB_BACKUP_REPO" ]; then
  REMOTE_URL="https://oauth2:${GITHUB_BACKUP_TOKEN}@github.com/${GITHUB_BACKUP_REPO}.git"
  
  echo "[Run.sh] Attempting to restore database from GitHub..."
  # Clone with depth 1 to save space and time. Ignore errors if repo is empty.
  if git clone --depth 1 "$REMOTE_URL" "$BACKUP_DIR" 2>/dev/null; then
    if [ -f "$BACKUP_DIR/stagecore.sqlite" ]; then
      cp "$BACKUP_DIR/stagecore.sqlite" "$DB_PATH"
      echo "[Run.sh] Successfully restored database from GitHub."
    else
      echo "[Run.sh] Repo cloned, but stagecore.sqlite not found inside."
    fi
  else
    echo "[Run.sh] No existing backup found or clone failed. Starting fresh."
  fi

  # Start background backup loop (every 10 minutes = 600s)
  (
    while true; do
      sleep 600
      node server/scripts/github-backup.js || echo "[Backup Loop] Backup script failed, continuing..."
    done
  ) &
else
  echo "[Run.sh] Missing GITHUB_BACKUP_TOKEN or GITHUB_BACKUP_REPO. Backups disabled."
fi

echo "[Run.sh] Starting Node app..."
exec npm start
