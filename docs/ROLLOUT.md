# Staging and production rollout

Operator-run checklist. This branch does not push, deploy, modify provider settings,
or run historical `tools/` data scripts. Record timestamps, commit IDs and outcomes
in the release ticket. Do not paste cookies, OAuth credentials, backup tokens or
session secrets into tickets/logs. Commands below run from `/app` in a Render
maintenance shell unless marked local. Use a separate staging service and disk.

## 1. Pre-deploy — mandatory gates

- [ ] Record `git rev-parse HEAD` for the candidate and the **currently deployed**
  commit as `PREVIOUS_COMMIT` in the release ticket. Do not assume the audit baseline
  is deployed. Record the image/build identifier too.
- [ ] Locally run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  `npm audit --audit-level=high`. Expected: exit 0; lint has zero warnings.
- [ ] Run the asset proof and seeded browser crawl described in
  `scripts/rollout/README.md`. Expected: all unique seeded URLs visited (duplicate player IGNs share a route), zero asset 404s,
  zero broken images, zero unexpected API errors.
- [ ] Revoke the historical **Turso authentication token** exposed in commit
  `dde2329d5a7d154ef4bf737c8971200062df3cc3`, `render.yaml:13`. Current SQLite code
  no longer uses it; deletion from HEAD does not revoke it. Review the historical
  browser profiles from `2f84eef7d48354c0c7d584be7f137bdb36bef309` for personal data.
  Their three scanner matches are OS-encrypted browser keys, not plaintext provider
  API keys. Coordinate history cleanup separately if needed; never force-push as
  part of this rollout.
- [ ] Verify the production topology in [DEPLOYMENT.md](DEPLOYMENT.md): one Render
  instance, disk mounted at `/app/server/data`, Node reachable only through Render
  ingress, no extra unaccounted proxy. Verify ingress replaces/appends the actual
  socket peer in XFF. Repo configuration alone cannot prove the live boundary.
- [ ] Verify disk ownership permits the container's `appuser` to write. Confirm
  the disk backup/snapshot is restorable, and keep an off-box copy. A file on the
  same disk alone is not disaster recovery.

### Environment inventory (names only)

Set/verify these in Render or build configuration; record presence and intended
policy, **never values**. Do not dump `env` or `printenv` into logs.

| Purpose | Names |
|---|---|
| Runtime and storage | `NODE_ENV`, `PORT`, `CORE_DB_PATH` |
| Sessions/admin | `CORE_AUTH_SESSION_SECRET`, `CORE_ADMIN_EMAILS`, `CORE_AUTH_COOKIE_SAMESITE` |
| Google sign-in | `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID` |
| Origins/API build target | `FRONTEND_ORIGIN`, `CORS_ORIGIN`, `VITE_API_BASE_URL` |
| Backup/recovery | `GITHUB_BACKUP_TOKEN`, `GITHUB_BACKUP_REPO`, `CORE_ALLOW_GITHUB_RESTORE`, `BACKUP_RETENTION`, `BACKUP_INTERVAL_SECONDS`, `BACKUP_REPO_PATH`, `BACKUP_DB_PATH`, `BACKUP_STATUS_PATH` |
| Optional startup behavior — preserve intentional settings | `CORE_SEED_PATH`, `CORE_BACKFILL_NEWS_ON_STARTUP`, `CORE_BACKFILL_NORMALIZED_ON_STARTUP`, `CORE_REPAIR_PLAYER_REFS`, `CORE_REPAIR_TOURNAMENT_DATA` |
| Build behavior | `DISABLE_PWA`, `PUPPETEER_SKIP_DOWNLOAD`, `CACHE_BUST` |
| Test-only; must not be configured in production | `CORE_MIGRATION_DIR` |

- [ ] Rotate `CORE_AUTH_SESSION_SECRET` once for this release using a cryptographically
  random secret of at least 32 bytes, stored directly in the Render secret setting.
  Everyone must sign in again. Never reuse the prior secret during rollback.
- [ ] Confirm your Google email appears in `CORE_ADMIN_EMAILS`: **comma-separated**,
  whitespace trimmed, case-insensitive exact email matching. No JSON, wildcard,
  domain match or newline-only list. Restart is required after changes. Nonmembers
  can sign in but receive the member role and cannot write/administer.
- [ ] Verify exact HTTPS origins and Google authorized JavaScript origins for each
  frontend. Do not use wildcard origins. Match frontend and backend Google client
  IDs. Same-origin cookies can use lax; cross-site cookies require none and Secure.
- [ ] Keep automatic GitHub restore disabled for ordinary deploys. Keep PWA enabled
  in the production build so `/sw.js` and `/sw-cleanup.js` are shipped. Docker now
  follows this rule. Verify both frontend build and runtime environments.

### Consistent database backup before any deployment

This uses SQLite's online backup API, including committed WAL contents. Do **not**
copy only a live `.sqlite` file while writes continue. Pause admin edits during the
backup and rollout to make rollback's recovery point explicit.

```sh
cd /app
umask 077
mkdir -p /app/server/data/rollout-backups
node --input-type=module <<'JS'
import Database from 'better-sqlite3';
import { writeFileSync } from 'node:fs';
const source = process.env.CORE_DB_PATH;
if (!source) throw new Error('CORE_DB_PATH required');
const destination = '/app/server/data/rollout-backups/pre-deploy-' + new Date().toISOString().replaceAll(':', '-') + '.sqlite';
const db = new Database(source, { readonly: true, fileMustExist: true });
await db.backup(destination);
db.close();
const backup = new Database(destination, { readonly: true });
if (backup.pragma('integrity_check', { simple: true }) !== 'ok') throw new Error('Backup integrity failed');
const foreignKeys = backup.pragma('foreign_key_check');
if (foreignKeys.length) throw new Error('Backup foreign-key drift requires investigation');
backup.close();
writeFileSync('/app/server/data/rollout-backups/LATEST', destination + '\n', { mode: 0o600 });
console.log('Verified backup:', destination);
JS
sha256sum "$(cat /app/server/data/rollout-backups/LATEST)"
```

Expected: verified path, integrity success, no FK exception; record the SHA-256.
Download the backup to approved encrypted off-box storage and verify the same
checksum. Also capture the Render persistent-disk snapshot through the provider's
supported backup workflow. Do not proceed until you have a usable recovery copy.

## 2. Staging smoke tests

- [ ] Deploy the candidate manually to staging with its own disk. Observe successful
  migration/startup; no configuration warnings, corrupt DB, unresolved repair or
  migration errors. `/api/health` returns 200. Restart once and verify persistence.
- [ ] Google sign-in: use the allowlisted account, check `/api/auth/me` reports admin,
  reload and retain the session. Use a separate nonallowlisted account: member,
  admin locked, API admin access 403. This is a real Google/browser test; the local
  rotation regression mocks Google's identity verification only.
- [ ] In browser DevTools, privately copy a valid session cookie into a local
  mode-600 cookie jar (never into a ticket). Sign out. `/api/auth/me` with that old
  jar must return 401. Append a third token segment in the private jar: still 401.
  Restart staging and replay the original revoked cookie: still 401. Delete the jar.
- [ ] Sign in again, rotate the staging session secret and restart. Old cookie must
  return 401; a fresh Google sign-in must return 201 and a usable session.
- [ ] Create a clearly labeled disposable staging tournament and match, edit dates/
  map/status, enter and edit a result, then reload the public views. Verify standings
  agree with the edit. Attempt the same writes as member/anonymous and without CSRF:
  denied. Remove the staging fixtures through the UI. Do not edit production data
  just to smoke-test authorization.
- [ ] Visit every public directory and each tournament/team/player/match/news detail
  recorded by the seeded crawl; repeat the crawler locally for the full seed. On
  staging, include live records absent from that seed and check DevTools for 404s.
- [ ] Check `/landing`, `/`, tournament directory/detail, standings, schedule, prizes,
  results and match center at **375×812, 768×1024, 1440×900**. Expected: no horizontal
  scrolling, readable headings, one main landmark, visible focus, usable errors.
- [ ] Touch device/emulation: dock links navigate; carousel swipe and previous/next
  controls work without trapping page scroll; empty featured set renders safely.
  Enable reduced motion and confirm no magnification/auto-animation dependency.
- [ ] Service-worker upgrade on an existing installation: retain its old worker/cache,
  deploy the candidate, then reload/close and reopen tabs. DevTools → Application →
  Service Workers must show the new worker activated. In console:
  `await caches.keys()` must not include `api-cache`. An offline API request must
  fail rather than returning stale authenticated data. `/sw.js` and `/sw-cleanup.js`
  must return 200; do not unregister first, which would bypass the upgrade test.
- [ ] Run axe/Lighthouse on `/landing` and the responsive routes; investigate every
  violation and manually review gradient contrast and keyboard/touch interaction.

## 3. Production deployment and first hour

- [ ] Freeze admin writes, take and verify the backup, record current row counts and
  a few known records, and verify the previous commit/image is redeployable.
- [ ] Apply the verified environment configuration and secret rotation manually.
  Deploy exactly the staging-tested commit. Keep one instance and the same disk.
- [ ] Confirm startup sees the existing database and skips bootstrap/restore. Existing
  product rows must remain. Migration 010 only adds `session_revocations` and its
  expiry index plus a ledger entry. Its copy-only regression compares all table hashes.
- [ ] Check health, read-only public pages, admin sign-in, old session rejection and
  headers below. Reopen admin writes only after these pass.
- [ ] For **60 minutes**, check every **5 minutes**: health, 5xx/error rate, request IDs,
  sign-in failures, unexpected 401/403/429, CPU/memory, disk utilization and backup
  health (`/api/admin/backup-status` in an authenticated session). Watch specifically
  for FATAL recovery messages, migration failures, integrity/FK errors, startup
  warnings and nonzero unresolved repairs. Never log session tokens/cookies.
- [ ] Roll back immediately for missing/changed existing data, integrity failure,
  authorization bypass or old sessions accepted after rotation. Roll back if health
  fails on three checks 10 seconds apart, or 5xx exceeds **1% for 5 minutes**, or two
  verified admin sign-ins fail, or a critical page/chunk returns 404 after a reload.
  Investigate rising disk use or a failed backup before allowing more writes.

## 4. Post-deploy HTTP evidence

Run from your own terminal. Set `TARGET_URL` to the HTTPS staging or production
origin locally; do not include credentials. These are read-only except invalid auth
requests, which cannot create sessions. Run the limiter probe only once per target
and wait one minute before a real sign-in from the same public IP.

```sh
curl --fail --silent --show-error --dump-header /tmp/core-health.headers \
  --output /tmp/core-health.json "$TARGET_URL/api/health"
cat /tmp/core-health.headers
cat /tmp/core-health.json
curl --fail --silent --show-error --dump-header /tmp/core-page.headers \
  --output /dev/null "$TARGET_URL/landing"
rg -i '^(content-security-policy|strict-transport-security|x-frame-options|referrer-policy):' /tmp/core-page.headers
rg -i '^x-request-id:' /tmp/core-health.headers
curl --fail --silent --show-error --output /dev/null "$TARGET_URL/sw.js"
curl --fail --silent --show-error --output /dev/null "$TARGET_URL/sw-cleanup.js"
for attempt in $(seq 1 21); do
  curl --silent --show-error --output /tmp/core-limit.json \
    --dump-header /tmp/core-limit.headers --write-out '%{http_code}\n' \
    -H 'Content-Type: application/json' --data '{' "$TARGET_URL/api/auth/google"
done
cat /tmp/core-limit.headers
cat /tmp/core-limit.json
```

Expected: health 200; a server-generated UUID `X-Request-Id`; CSP with `default-src
'self'` and nonce/hash script policy; HSTS `max-age=31536000; includeSubDomains`;
`X-Frame-Options: SAMEORIGIN`; `Referrer-Policy: no-referrer`. Malformed auth requests
return 400 until the **21st** returns **429**, including `Retry-After`, `RateLimit-*`
and request ID. Earlier 429 is expected if the IP already used its auth bucket.
Bodies must contain a generic error plus request ID, never a stack trace.

To check spoof resistance against the real ingress, repeat the 21-request probe
once with a different `-H "X-Forwarded-For: 198.51.100.$attempt"` on each request.
It must still reach 429. If changing that header resets the bucket, stop rollout
and fix the ingress trust boundary. Do not infer safety solely from unit tests.

## 5. Rollback: code and database

**Code-only rollback:** choose the recorded `PREVIOUS_COMMIT` in Render's deploy
history and redeploy it onto the same disk. Migration 010 is additive; previous
code can ignore its table. Keep the rotated secret. Do not delete the revocation
table. If the previous code does not consult durable revocations, rotate again
before serving traffic so restored/old signed sessions cannot revive.

**Data rollback:** loses writes after the backup recovery point. Confirm that tradeoff
in the incident ticket. Stop traffic, the app process and the backup loop using a
provider-supported maintenance procedure that retains the persistent disk. A normal
live Render shell is not sufficient to guarantee that all writers are stopped. If
that maintenance access is unavailable, use Render's disk restore workflow/support;
never replace a database under a running writer.

Once every writer is stopped, in the maintenance container with the disk mounted:

```sh
cd /app
umask 077
# BACKUP_FILE identifies the checksum-verified pre-deploy snapshot restored to disk.
# CORE_DB_PATH identifies the production database; neither may be empty.
: "${BACKUP_FILE:?Select verified backup}" "${CORE_DB_PATH:?Select database}"
export BACKUP_FILE CORE_DB_PATH
node --input-type=module <<'JS'
import Database from 'better-sqlite3';
const db = new Database(process.env.BACKUP_FILE, { readonly: true, fileMustExist: true });
if (db.pragma('integrity_check', { simple: true }) !== 'ok') throw new Error('Invalid backup');
if (db.pragma('foreign_key_check').length) throw new Error('Backup FK drift');
db.close();
JS
incident_dir="/app/server/data/rollout-backups/incident-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$incident_dir"
for file in "$CORE_DB_PATH" "$CORE_DB_PATH-wal" "$CORE_DB_PATH-shm"; do
  if [ -e "$file" ]; then mv "$file" "$incident_dir/"; fi
done
cp "$BACKUP_FILE" "$CORE_DB_PATH"
chmod 600 "$CORE_DB_PATH"
sha256sum "$BACKUP_FILE" "$CORE_DB_PATH"
```

Expected: matching checksums, no stale WAL/SHM beside the restored file, correct
`appuser` ownership (restore as that user or have the maintenance operator correct
ownership). Keep incident copies for investigation. Redeploy `PREVIOUS_COMMIT`,
rotate the session secret again, keep automatic restore disabled, verify integrity,
row counts, known records and sign-in before restoring traffic.

Restoring a pre-010 snapshot removes `session_revocations` and the 010 ledger entry
because neither existed in that backup. New code recreates both on its next boot;
old code ignores their absence. Restoring a newer backup rolls revocations back to
that snapshot. **Always rotate the secret after data restore** so missing/reverted
revocations cannot resurrect sessions. Do not try to merge revocation rows by hand.
