# Deployment

StageCore runs as a single Render web service with the SQLite database on a
persistent disk. A private GitHub repository holds a secondary, off-box backup,
and a canonical export provides a reproducible first-boot baseline.

## Architecture

```
Render single instance
        |
        v
Persistent Disk  (/app/server/data)
        |
        v
SQLite primary database  (/app/server/data/stagecore.sqlite)
        |
        v
GitHub private repository   <-- secondary backup, not primary
```

- One Render instance. A persistent disk attaches to a single instance and
  SQLite allows a single writer, so horizontal scaling is intentionally off.
- The Persistent Disk is mounted at `/app/server/data` and is the primary runtime
  database location.
- `CORE_DB_PATH=/app/server/data/stagecore.sqlite`.
- SQLite is the single runtime writer. Nothing else may open the file for writing.
- The GitHub repository is secondary backup only. It is never read at startup
  except during an explicit, deliberate disaster recovery.
- `server/seed/canonical.export.json` is the reproducible bootstrap baseline. An
  empty disk is bootstrapped from it; a populated disk is never overwritten by it.

## Environment variables

Names only — never commit values.

| Variable | Required | Notes |
|---|---|---|
| `CORE_DB_PATH` | required in production | `/app/server/data/stagecore.sqlite` |
| `CORE_AUTH_SESSION_SECRET` | required in production | Boot fails if missing; changing it invalidates all sessions |
| `CORE_AUTH_COOKIE_SAMESITE` | optional | `lax` same-origin, `none` cross-site frontend; defaults to `none` in production |
| `CORE_ADMIN_EMAILS` | required for admin access | Comma-separated; dashboard secret, not in Git |
| `FRONTEND_ORIGIN` | required when a frontend is cross-origin | Comma-separated exact origins for credentialed CORS |
| `GITHUB_BACKUP_TOKEN` | optional | Enables backup; minimal scope (`contents:write` on the backup repo) |
| `GITHUB_BACKUP_REPO` | optional | `owner/name` of the private backup repo |
| `CORE_ALLOW_GITHUB_RESTORE` | recovery-only | Keep `0`. Set to `1` only for a deliberate restore into an empty disk |
| `GOOGLE_CLIENT_ID` | required for sign-in | Public OAuth client id |
| `BACKUP_RETENTION` | optional | Timestamped snapshots kept in the backup repo (default 7) |

Categories:

- Required: `CORE_DB_PATH`, `CORE_AUTH_SESSION_SECRET`, `CORE_ADMIN_EMAILS`,
  `GOOGLE_CLIENT_ID`.
- Optional: `CORE_AUTH_COOKIE_SAMESITE`, `FRONTEND_ORIGIN`, `GITHUB_BACKUP_TOKEN`,
  `GITHUB_BACKUP_REPO`, `BACKUP_RETENTION`.
- Recovery-only: `CORE_ALLOW_GITHUB_RESTORE`.

`CORE_AUTH_SESSION_SECRET` is generated via Render's `generateValue: true` in
`render.yaml` at service creation. Because session tokens are HMAC-signed with
it, regenerating it invalidates every logged-in session. Once the service exists,
keep the value stable (Render persists the generated value); do not regenerate it
as part of routine deploys.

## Recovery

Restore is deliberately manual. It only writes into an empty database.

> Never enable GitHub restore against a populated production database.

1. Stop / scale down the application so nothing is writing the database.
2. Verify disk state — confirm the database file is absent or zero bytes.
3. Make a safe backup/copy of the disk first (snapshot or manual copy).
4. Enable explicit restore: set `CORE_ALLOW_GITHUB_RESTORE=1`.
5. Confirm the backup repo and token are configured correctly.
6. Restore only into an empty database.
7. Verify integrity: `integrity_check` returns `ok`, `foreign_key_check` returns
   zero rows.
8. Start the application.
9. Disable the flag again — set `CORE_ALLOW_GITHUB_RESTORE` back to `0`.
10. Verify application data (counts, a known record, a login).

If the restore is requested (`=1`) and it fails, the application exits non-zero.
It will not fall back to the canonical seed, so a failed recovery is never
mistaken for a successful one.

### Backup health

`GET /api/admin/backup-status` (admin only) reports whether backups are enabled,
the last success, the last failure, consecutive failure count, and a roll-up
`status` (`ok`, `degraded`, `pending`, `failing`, `disabled`, `unknown`). It never
returns the token, the remote URL, or filesystem paths.

## Rollback

- Rolling back application code does **not** roll back database contents. The
  Persistent Disk remains the source of truth.
- Schema migrations must be backward-compatible where a rollback may be needed:
  dropping or renaming a column can break the previous code revision.
- Data rollback requires an explicit backup/recovery procedure (the Recovery
  steps above, or a disk snapshot). There is no automatic data rollback.

## Production readiness checklist

### Pre-deploy

- [ ] CI green
- [ ] `audit:high` green
- [ ] typecheck green
- [ ] lint green
- [ ] build green
- [ ] tests green
- [ ] secret scan green
- [ ] `CORE_AUTH_SESSION_SECRET` configured
- [ ] `CORE_ADMIN_EMAILS` configured
- [ ] Persistent Disk configured
- [ ] `CORE_DB_PATH` configured
- [ ] disk writable
- [ ] backup repo configured if backups enabled
- [ ] restore disabled (`CORE_ALLOW_GITHUB_RESTORE=0`)

### Post-deploy

- [ ] application starts
- [ ] database integrity OK
- [ ] foreign-key check OK
- [ ] login works
- [ ] admin works
- [ ] CSRF works
- [ ] frontend API access works
- [ ] write test succeeds
- [ ] restart preserves write
- [ ] redeploy preserves write
- [ ] backup succeeds
- [ ] backup contains expected snapshot
- [ ] restore drill tested separately

## Client IP and session revocation assertions

The committed Render Docker path is **Render ingress → Node/Express**:
`render.yaml` selects `Dockerfile`, whose runtime executes `run.sh` → `npm start`.
It does not install or start the optional `deploy.nginx.conf`. Production uses
`trust proxy = 1`; development trusts no proxy. Express therefore takes the
rightmost `X-Forwarded-For` address (one hop from Node) for `req.ip`, which is the
rate limiter's default key source. It does not trust a caller-supplied leftmost
prefix. The test in `tests/unit/trustProxy.test.js` asserts that two clients get
separate rate-limit buckets and changing a spoofed prefix cannot reset a bucket.

This is correct **provided Render ingress appends/overwrites the actual client
address as the rightmost forwarded address and Node is reachable only through
that ingress**. This task cannot remotely inspect the deployed service's headers.
Verify that assertion when deploying, and re-evaluate the trust boundary if adding
NGINX, another CDN, or a directly reachable application port; never replace it with
`trust proxy = true` to hide a rate-limit warning.

References: [Render web-service TLS forwarding](https://render.com/docs/web-services#port-binding)
and [Express proxy trust semantics](https://expressjs.com/en/guide/behind-proxies.html).

Migration `010_session_revocations.sql` adds a table and expiry index only; it does
not update existing application records. Revocation stores only the SHA-256 token
digest and original expiry, survives process restarts on the configured persistent
disk, and prunes expired rows on initialization and at most once a minute during
requests. No active revocation is evicted due to an entry-count limit. A backup
restore can roll back revocations along with the DB: rotate the session secret
after restoring an older backup. Previously in-memory revocations cannot be
recovered by this migration; the planned rollout secret rotation remains necessary.

### Removing administrator access

After updating CORE_ADMIN_EMAILS and restarting the deployment, each authenticated
request derives its role from the current allowlist. A previously issued signed
admin role cannot preserve access after removal. The session remains a member
session until logout, expiry or session-secret rotation.
