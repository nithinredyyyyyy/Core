# AGENTS.md

Repository-specific knowledge for the CORE BGMI esports platform.

## Commands

```bash
npm run lint        # eslint . --quiet
npm run typecheck   # tsc -p ./jsconfig.json
npm run build       # node tools/build.js
npm test            # node test runner; API integration tests
```

Dev servers used during verification: `node server/index.js` (API) and
`vite --port 5199` (frontend). The API enforces rate limits (public 120/min,
search 30/min, auth 20/min), so scripted browser sweeps must pace requests or
they will see 429s that look like real failures.

## Architecture

- `src/api/base44Client.js` — single API client. Entity lists, page payloads,
  and `home.view()` all go through it.
- `server/` — Express API. **Do not modify**: it owns HttpOnly session cookies,
  CSRF, CORS, CSP, SSRF/DNS-rebinding protection, admin authorization, rate
  limiting, and request/response limits.
- `src/services/*` — data access wrappers. Pages must not call `base44`
  entities directly; add a service function instead.
- `src/hooks/*` — TanStack Query hooks that compose services.
- `src/lib/status.js` — canonical status model (LIVE/UPCOMING/COMPLETED/
  CANCELLED/POSTPONED). Never communicate status through colour alone.
- `src/lib/formatting.js` — all date/time/number formatting.
- `src/lib/navigation.js` — the single nav config read by both the desktop
  header and the mobile bottom bar.

## Public API access rules

Some entity endpoints are admin-scoped and return **403 to anonymous users**:
`PlayerAlias`, `TeamAlias`, `PlayerTeamHistory`. The public
`/api/pages/teams` payload already bundles `teamAliases`, `teams`, `players`,
and `tournaments`, so public pages must read aliases from that payload rather
than from the raw entity endpoint. An anonymous `401` on `/api/auth/me` is
expected and is not a bug.

## Match result granularity

MatchResult rows are not uniform: multi-match tournaments publish one row per
match, while single-match tournaments publish cumulative rows. The shared view
model in `src/lib/matchViewModel.js` handles both and labels aggregated
standings honestly. Never present cumulative rows as single-match results.

## Design system

- `tailwind.config.js` holds the brand palette. Pages reference ~387 brand
  colour usages, so any palette edit must stay a strict superset of the
  existing keys.
- Dark-first, high contrast, minimal. No heavy effects, no oversized cards.
- Shared primitives live in `src/components/shared/` (StatusBadge, TeamLogo,
  PlayerAvatar, DataTable, FilterTabs, EmptyState, QueryError, PageSkeleton,
  MatchCard, NewsCard, SectionHeader, PageHeader, SearchInput).
- Grid containers must include `grid-cols-1` (or another explicit track).
  A bare `grid` creates an implicit `auto` track that sizes to min-content and
  causes horizontal overflow on narrow screens.

## Data integrity

Never fabricate teams, players, scores, rankings, tournaments, dates, prize
pools, or news. Render an empty state when the backend has no data.

### Tournament data repair (`server/services/tournamentDataRepair.js`)

Runs once at startup, after `seedIfEmpty()` / `ensureLegacyTournaments()`.
Repairs are idempotent — a second pass is a no-op, and each is individually
safe to run on an already-clean database.

The root cause it addresses: the import path re-inserts tournaments under fresh
UUIDs and deletes the prior row, so child rows keep a stale, now-unowned
`tournament_id`. Three distinct symptoms, all silent (no error, no orphan warning):

1. **Detached child rows** — `tournament_stages`, `stage_standings`, and
   `tournament_participants` pointing at a tournament id no live row owns.
   Re-pointed at the live tournament carrying the same name (seed ids) or the
   same stage signature (≥0.8 overlap). A stage snapshot nobody references
   afterwards is pruned.
2. **Missing canonical teams** — `tournament_participants` / `stage_standings`
   reference a team id with no `teams` row, so `JOIN teams` silently drops the
   row from every payload. The canonical `seed.json` team is restored (never
   invented) so the existing references resolve.
3. **Group-only standings** — `getNormalizedTournament` gated `by_group` on an
   overall board existing. Stages that only ever have group-scoped standings
   (group stages, semi-finals) returned nothing. Groups are now always exposed.

Verify after any import or seed change:

```bash
python3 - <<'PY'
import sqlite3
c = sqlite3.connect("server/data/stagecore.sqlite")
for t in ("tournament_stages", "stage_standings", "tournament_participants"):
    print(t, "orphans:", c.execute(
        f"SELECT COUNT(*) FROM {t} WHERE tournament_id NOT IN (SELECT id FROM tournaments)"
    ).fetchone()[0])
print("dangling team refs:", c.execute(
    "SELECT COUNT(*) FROM stage_standings WHERE team_id NOT IN (SELECT id FROM teams)"
).fetchone()[0])
PY
```

All four must be `0`. Expected live totals: 19 tournaments, 111 stages (a
correct edge dedupes), 709 standings, 469 participants, 287 teams.

Do not add a fourth parallel repair path — extend `repairTournamentDataIntegrity`.

## Frontend polish program (audit + plan)

Audit performed before changes; baseline was green (`lint`, `typecheck`,
`build`, 10 unit + 11 integration tests). Existing pages already used shared
primitives, so the program is a consolidation, not a rewrite.

Findings worth remembering:

- Navigation, status model, formatting, and the `shared/` primitives already
  existed and were reused. Do not add parallel versions of them.
- `/matches` (Match Center) already had LIVE/UPCOMING/RECENT tabs plus period
  and tournament filters. `/matches/:id` exists as the match detail route.
- `/rankings` had `trend` and `updatedAt` in the API payload but rendered
  neither. Trend values are currently all `0`, so movement renders as an
  em dash — never synthesise an arrow from nothing.
- `/teams` hardcoded `BMPS 2026` / `India` and had a filler "Search ready:
  Live" stat tile. Those were replaced with real values from the payload.
- `ProfilePanel` rendered its title as a `<p>`, leaving profile pages without
  section headings. It now renders a configurable heading (`h2` by default).
- The home hero used an `h2` and repeated the tournament name twice; it now
  carries the page `h1` and shows match number/map in the header strip.
- Search match results previously showed the tournament name as the label,
  making every row look identical. Labels are now `Match N · Map` with the
  tournament as the subtitle.

Planned phases (Phases 1-9 done; 10 in progress):

1. Design system + global shell + navigation
2. Home
3. Match Center + match detail
4. Tournaments + tournament detail
5. Teams + team detail
6. Players + player detail
7. Rankings + leaderboard
8. News + article
9. Search
10. Mobile/accessibility/performance/SEO polish

Phase 8-10 notes:

- Share functionality (§30) lives in `shared/ShareMenu.jsx` and is wired into
  match, tournament, team, player, and news-article detail pages. It prefers
  `navigator.share`, with WhatsApp / X / copy-link fallbacks.
- `/news` category filters now use the shared `FilterTabs` primitive instead
  of a bespoke button row.
- Tap targets raised to `min-h-11` in `SectionHeader`, `/news` tag chips,
  `/teams` card name + roster chips.
- Global search already supports `Ctrl+K` / `Cmd+K` via
  `useGlobalSearchShortcut` in `AppLayout`. `/rankings` already documents its
  methodology in `RankingRules` plus a "Last updated" timestamp.
- Palette audit: every `brand-*` Tailwind key used in `src/` resolves in
  `src/index.css`. The only unmatched `brand-*` strings are CSS class-name
  fragments in admin posters (`ig-brand-logo`, `poster-*-brand-text`, etc.),
  not palette keys.
- News articles render a `SourceCard` from `source_name` / `source_url` and
  label `ai_summary` blocks as AI-generated. Only 7 of 27 articles carry a
  source, so the card is conditional — never invent a source.

Verification for every phase: `npm run lint`, `npm run typecheck`,
`npm run build`, `npm test`, then a paced Playwright pass (mobile widths
320-430px) checking horizontal overflow, single `h1`, tap-target height, page
title, and `lang`.

The 401 on `/api/auth/me` for anonymous visitors is expected. A 429 during
scripted sweeps means the rate limiter is working, not that the page is broken
— pace the requests and re-check.


## Auth model (important)

- Sessions are a self-contained HMAC-signed token (`server/services/auth.js`), signed with `CORE_AUTH_SESSION_SECRET`.
- The token travels in an **HttpOnly cookie** (`stagecore_auth_token`), never in JS-readable storage or a custom header.
- State-changing requests require a **double-submit CSRF token**: the server sets a readable `stagecore_csrf` cookie and also returns `csrfToken` from `POST /api/auth/google` (cross-origin frontends cannot read the API-domain cookie). The client echoes it in `X-StageCore-CSRF`.
- `POST /api/auth/logout` revokes the token server-side (`revokeToken`) and clears cookies. Revocation is in-memory, so it does not survive a restart or span instances.
- Cookie `SameSite` is `lax` by default and `none` in production (cross-site Vercel frontend). Override with `CORE_AUTH_COOKIE_SAMESITE`.
- Production **fails fast** if `CORE_AUTH_SESSION_SECRET` is missing.
- CORS uses an explicit origin allowlist with `credentials: true`; never replace the allowlist with a wildcard.

## Security invariants to preserve

- All SQL is parameterized; table names come from the hardcoded `entityConfigs` map and column identifiers from per-entity allowlists.
- Every create/update payload is validated with Zod (`server/services/schemas.js`).
- Admin-only routes call `requireAdminAccess` / `ensureEntityWriteAccess`.
- Outbound fetches of admin-supplied URLs must go through `server/services/outboundUrl.js`. `fetchPublicText` resolves the hostname **once**, rejects private/loopback/link-local/ULA/metadata addresses and non-http(s) schemes, then pins the validated IP for the actual socket via a custom `lookup` (defeating DNS rebinding). Every redirect hop is re-validated and re-pinned. A 15s timeout and response size cap apply. Never pass a raw user URL to `fetch`, `http.request`, or `https.request` — that would re-resolve the hostname and reopen the rebinding gap.
- The CSP `script-src` uses a per-request nonce plus a SHA-256 hash for the inline bootstrap script in `index.html`. Inline scripts added to `index.html` must be hashed (the server hashes every `<script>...</script>` block automatically) and never re-enable `'unsafe-inline'` for scripts.
- Secrets and admin identity live in env vars/dashboard secrets, not in committed config (`render.yaml` uses `sync: false` for `CORE_ADMIN_EMAILS`).
- Rate limiters in `server/index.js` are mounted on their **own path prefix** (`/api/auth`, `/api/admin`, ...) separately from the routers. Do not mount them on the shared `/api` path — that runs every limiter for every API request and makes the strictest one (auth, 20/min) the effective cap for the whole API.
- Any redirect target derived from untrusted input (query params, API responses) must pass through `safeInternalPath` (`src/lib/safeRedirect.js`) before `navigate()`/`<Navigate>`. A leading `\` is treated as `/` by browsers, so `/\evil.com` is an off-origin open redirect even though it passes a naive `startsWith("/")` check.

## Production persistence (Render + SQLite + GitHub backup)

Approved architecture: a Render **Persistent Disk** is the PRIMARY runtime store,
a single Render instance is both a disk requirement and a SQLite requirement, a
private GitHub repo is the SECONDARY off-box backup, and
`server/seed/canonical.export.json` is the reproducible bootstrap baseline.

- `render.yaml` sets `plan: starter` (Free does not support disks), a 1 GB disk
  named `core-data` mounted at `/app/server/data`, and `CORE_DB_PATH`. A Render
  disk attaches to exactly one instance and blocks scaling out.
- The disk mount **shadows** the `stagecore.sqlite` baked into the image by
  `COPY --from=build /app/server ./server`. On first boot the disk is empty, the
  app boots from the canonical export, and the baked copy becomes irrelevant.
- `run.sh` never overwrites a populated database from the backup repo. Restore
  only runs when the DB is absent/empty AND `CORE_ALLOW_GITHUB_RESTORE=1`
  (explicit disaster recovery, `1`/`true`/`yes` only — `0` is off). Otherwise an
  empty disk bootstraps from canonical. If a requested restore fails, `run.sh`
  exits non-zero rather than falling back to canonical seed, so a failed recovery
  is never mistaken for a successful one.
- `run.sh` passes `GITHUB_BACKUP_TOKEN` through git's environment-based
  `http.extraheader`, never a URL, argv, or log line. Do not reintroduce
  `https://oauth2:${TOKEN}@...`.
- `run.sh` fails fast if the disk mount is not writable by the container user
  (`appuser`). A root-owned Render disk mount cannot be fixed from inside the
  container; it must be resolved in the Render dashboard.
- `server/services/dbIntegrity.js` runs before any write on boot: a corrupt,
  non-empty database exits non-zero and is left byte-identical. It is never
  silently reset to seed. Foreign-key drift is reported, then repaired by the
  existing repair routines.
- `server/scripts/github-backup.js` snapshots via the SQLite backup API (source
  opened read-only), keeps `stagecore.sqlite` plus the newest
  `BACKUP_RETENTION` (default 7) timestamped copies under `snapshots/`, and
  force-pushes a single commit so repository history cannot grow. Worst-case
  repo size is bounded at ~`BACKUP_RETENTION x DB size`.
- `tests/unit/authCookie.test.js` spawns probes that import `server/db.js`. It
  must set `CORE_DB_PATH` to a temp file; without it the probes run migrations
  against the committed `server/data/stagecore.sqlite` and mutate it.
- SQL migrations run through `server/db/migrate.js` and are FATAL: a failure
  throws, `server/index.js` exits non-zero, and the database is never reseeded.
  Each migration commits with its ledger row in one transaction, so a failure
  leaves neither partial schema nor a ledger entry. Never reintroduce a
  swallow-and-continue `catch` around migrations.
- `schema.js` reads `CORE_MIGRATION_DIR` only when `NODE_ENV=test`, so tests can
  exercise a broken migration set without touching the committed one.
- Restore gate in `run.sh`: `CORE_ALLOW_GITHUB_RESTORE` accepts only
  `1`/`true`/`yes` (a bare `-n` check treats `0` as enabled). A requested restore
  that fails exits non-zero instead of falling back to canonical seed.
- `server/services/backupState.js` is the shared health surface: the backup
  script writes `backup-status.json` (token/URL/path-free) and
  `GET /api/admin/backup-status` (admin only) reads it. Backup failure never
  takes the app down.
- `server/services/corsOrigins.js` builds the credentialed CORS allowlist from
  `FRONTEND_ORIGIN`/`CORS_ORIGIN` plus loopback origins outside production.
  Production origins are configuration, not hardcoded.
- Startup repairs (`playerReferenceRepair`, `tournamentDataRepair`) always log a
  structured summary including explicit zero counts and `durationMs`, so a
  healthy no-op startup is distinguishable from a repair that never ran.
- The committed `server/data/stagecore.sqlite` is NOT a runtime or bootstrap
  dependency: `server/seed/canonical.export.json` is the baseline, and a fresh
  disk is built by `schema.js` plus the committed migrations. The committed DB's
  `schema_migrations` ledger still names historical migrations (`005`, `006`,
  `008`, `20260524`) whose files were removed and lacks `009`; that is expected
  and harmless because the blob is shadowed by the disk mount and never used to
  seed. Treat the migrations directory, not the committed DB, as the schema
  source of truth (a fresh DB is verified to have all tables and zero FK issues).

Verification after any persistence change: fresh-disk bootstrap, restart (skips
seed), write persists across redeploy, restore gate (populated DB untouched,
failure fatal, `0` treated as off), corrupt DB fails fast, backup retention +
restore, token-leak E2E, and a check that the committed
`server/data/stagecore.sqlite` hash is unchanged. Run `npm run verify` for the
full gate.

- `tools/verify-stage-completeness.mjs` is a read-only gate (`query_only = ON`)
  over stage/result/stat integrity. Point it at a database copy, not the
  committed blob: `--db <path>` (or `CORE_DB_PATH`). A fresh DB built from
  `schema.js` plus the migrations carries provenance columns; the committed
  `server/data/stagecore.sqlite` predates them, so V6 provenance is reported as
  a note there instead of a failure. Hard failures are V1 (a stage with no
  matches and no synthetic placeholder), V2 (per-match result cardinality
  disagrees across matches of one stage), V3 (a synthetic aggregate snapshot
  still coexists with real per-match rows - this double-counts in standings),
  V5 (stats pointing at a missing player/match), and V7 (duplicate stage slug,
  match identity, or source_slug).
- `tools/enrich-stage.mjs` is the only supported way to run enrichment. It is a
  dry run unless `--apply` is passed, and `--replace-synthetic` requires
  `--apply`. Enrichment is never invoked at server startup; importing data is
  always an explicit operator action.
- Pre-extraction stages legitimately have synthetic aggregate snapshots
  (`match_number` `0`/`NULL`). The extraction step must replace them via
  `enrichStage`/`replaceSyntheticSnapshot` in one transaction, not append beside
  them.


## Phase 2 pilot operator tooling (`tools/liquipedia/`)

The BMPS 2025 Grand Finals enrichment is a single-stage pilot. Operator tooling
lives under `tools/liquipedia/`; the procedure is
`tools/liquipedia/RUNBOOK-bmps2025-gf-apply.md`.

- The production store is the Render Persistent Disk at
  `/app/server/data/stagecore.sqlite` (see `render.yaml`). The tracked
  `server/data/stagecore.sqlite` is NOT the runtime store and predates the
  provenance migrations; never point an apply at it.
- `emit-payload.mjs` produces the payload `enrich-stage.mjs --file` consumes and
  is the only supported way to build it. It is read-only against the source DB.
- `post-apply-audit.mjs` is read-only (`readonly: true` + `PRAGMA query_only =
  ON`) and implements the acceptance criteria as named checks; `--baseline`
  additionally proves the change was confined to the stage.
- `production-target-guard.mjs` (wired into both tools above) refuses any target
  that does not resolve to the expected Render disk unless `--rehearsal` is
  passed explicitly. A stale/exported `CORE_DB_PATH` (e.g. `/tmp/tmp.*/f.sqlite`)
  exits `3`. Never bypass this without an explicit `--rehearsal`.
- Two policies govern this pilot. `PRESERVE_DISPUTE_V1`
  (`dispute-policy.mjs`): team-aggregate splits that disagree are represented
  (canonical row carries source values; existing CORE value retained in
  metadata), never adjudicated. `PRESERVE_SOURCE_V1`
  (`source-correction-policy.mjs`): a per-pilot decision record naming exact
  field corrections (currently `m4/m10/m16` map `Erangel -> Sanhok`). It is NOT a
  general "source wins" rule; any unapproved difference refuses the apply.
- Dispute metadata and map-reconciliation metadata live in the committed payload
  artifact, not the database. There are no columns for them and no migration is
  planned for this pilot; do not fake them into existing tables.
- Pre-apply the stage has 19 matches: one synthetic aggregate plus 18 real
  placeholder rows with zero results. `replaceSyntheticSnapshot` removes only the
  aggregate and updates the 18 real rows in place, so net match delta is `-1`,
  not `-19`.
- `player_match_stats` has no published source data for this stage; the absence
  is recorded explicitly (`SOURCE_NOT_AVAILABLE`) in the payload, and zero rows
  are written.

