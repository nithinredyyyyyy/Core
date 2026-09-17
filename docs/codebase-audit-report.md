# Complete Codebase Audit Report

Date: 2026-09-17

Scope: project-owned files in the current workspace, excluding generated/dependency/runtime artifacts such as `node_modules/`, `dist/`, Playwright reports, logs, screenshots, temporary backups, executable binaries, SQLite binaries in the file appendix, and the large seed JSON payload.

Verification baseline:

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `node tests/api.test.js`: passed, 11/11.
- `npm run build`: passed through the existing Windows fallback after Vite/esbuild hit `spawn EPERM`.
- `node tools/verify-post-import-transforms.mjs`: passed for PMWC 2024/2025/2026 and PMGC 2025.
- Render smoke check: 19 tournaments, 0 normalization/render failures.
- `node tools/audit-database.mjs`: completed but reports 327 existing database integrity violations.

## Executive Summary

The codebase is functional and the recent tournament override migration is structurally complete. The highest risks now are not syntax/build risks; they are operational and architectural risks: production auth configuration can silently fall back to a random secret, the GitHub backup command embeds the token in a shell command, the tracked SQLite database conflicts with ignore policy, and several huge UI/import modules are hard to safely change.

## High Priority Findings

### P1: Production Auth Secret Falls Back To Random Runtime Secret

- File: `server/services/auth.js:10`
- Evidence: production only logs a warning when `CORE_AUTH_SESSION_SECRET` is missing, then signs tokens with `randomBytes(32)` at `server/services/auth.js:16`.
- Impact: sessions are invalidated on restart and multi-instance production deployments will disagree on token validity. This is also easy to miss because the server still starts.
- Recommendation: fail startup in production when `CORE_AUTH_SESSION_SECRET` is absent.

### P1: Backup Push Embeds GitHub Token In Shell Command

- File: `server/scripts/github-backup.js:72`
- Evidence: `remoteUrl` includes `GITHUB_BACKUP_TOKEN`, then `execSync` runs a composed shell command at `server/scripts/github-backup.js:74`.
- Impact: the token can be exposed through process inspection, command logging, crash reports, or quoting mistakes. `GITHUB_BACKUP_REPO` is also interpolated into the command string path.
- Recommendation: use `execFileSync("git", ["push", "--force", remoteUrl, "main"])`, validate repo as `owner/name`, and consider passing credentials through a temporary credential helper or `GIT_ASKPASS`.

### P1: SQLite Database Is Tracked Despite Ignore Policy

- File: `server/data/stagecore.sqlite`
- Evidence: `git ls-files server/data/stagecore.sqlite` returns the DB, while `.gitignore:27` and `.gitignore:30` exclude SQLite/server data.
- Impact: binary DB churn bloats history and can accidentally publish sensitive or inconsistent state.
- Recommendation: decide if the DB is a required fixture. If not, remove it from git tracking with `git rm --cached server/data/stagecore.sqlite` and keep backups/releases outside normal source control.

### P2: Drifted Shared Logic Exists In Frontend And Backend Copies

- Files: `src/lib/bmps2026Progression.js`, `server/shared/bmps2026Progression.js`, `src/lib/teamLogos.js`, `server/shared/teamLogos.js`.
- Evidence: several shared modules are exact duplicates, but these two pairs have different SHA-256 hashes.
- Impact: frontend and backend can render or resolve tournament/team behavior differently.
- Recommendation: keep one canonical shared source, generate/copy the other during build, or add a hash/parity test that fails when intentionally shared files drift.

### P2: Very Large Modules Concentrate Change Risk

Largest files in scope:

- `server/scripts/data/pmwc2026Stats.js`: 2688 lines
- `bmps2026/survival_stage.json`: 2152 lines
- `src/components/admin/AdminTournaments.jsx`: 1700 lines
- `src/lib/bmps2026PlayerStats.js`: 1402 lines
- `src/components/admin/AdminInstaPosters.jsx`: 1303 lines
- `src/features/tournaments/components/StageStandingsBoard.jsx`: 1266 lines
- `src/features/tournaments/TournamentDetailPage.jsx`: 1227 lines
- `server/scripts/import-bmsd-2025.js`: 1216 lines
- `src/components/admin/AdminMatches.jsx`: 1124 lines
- `src/lib/teamLogos.js`: 1088 lines
- `server/shared/teamLogos.js`: 1087 lines
- `src/components/admin/AdminNews.jsx`: 1076 lines
- `src/pages/PlayerProfile.jsx`: 1027 lines
- `src/components/admin/posters/posterStyles.js`: 920 lines
- `src/components/admin/AdminResults.jsx`: 839 lines
- `server/scripts/import-bmps-2026.js`: 825 lines
- `src/pages/Rankings.jsx`: 764 lines
- `server/scripts/import-bgis-2024.js`: 694 lines

Impact: review and regression risk is high, especially for admin workflows and tournament boards.

Recommendation: do not refactor all at once. When touching these files, extract one concern at a time: data adapters, table renderers, form reducers, poster primitives, and tournament-specific constants.

### P2: Admin/API Auth Is Protected, But Tokens Live In localStorage

- File: `src/api/base44Client.js:95` and `src/api/base44Client.js:146`.
- Evidence: auth token is read/written from `window.localStorage` and sent as `X-StageCore-Auth-Token` at `src/api/base44Client.js:187`.
- Impact: XSS would expose admin tokens. Current CSP still allows `unsafe-inline` scripts in production at `server/index.js:57`.
- Recommendation: for a production admin panel, move to HttpOnly same-site cookies, remove `unsafe-inline` if feasible, and add stronger CSP nonce/hash handling.

### P2: Destructive Entity Deletes Are Hand-Rolled

- File: `server/services/entities.js:75`.
- Evidence: team/tournament/match deletes manually cascade related records at `server/services/entities.js:80` through `server/services/entities.js:102`.
- Impact: missed relationships can create orphans; the current DB audit already reports orphaned references.
- Recommendation: add foreign keys with explicit cascade rules where possible, enable SQLite foreign keys, and cover delete paths with integration tests.

### P3: Build Fallback Is Windows-Specific And Diverges From Vite Output

- Files: `tools/build.js`, `tools/build-fallback.ps1`.
- Evidence: `tools/build.js:30` invokes PowerShell fallback on Windows; `tools/build-fallback.ps1:53` writes its own HTML template.
- Impact: fallback builds can drift from Vite/index.html behavior.
- Recommendation: keep fallback only as an emergency compatibility path, and add a snapshot/check that generated fallback HTML keeps critical tags aligned with `index.html`.

## Database Audit Snapshot

`tools/audit-database.mjs` currently reports 327 violations:

- 10 non-ISO created/updated dates.
- 8 duplicate team-name buckets.
- 252 duplicate player IGN buckets.
- 9 orphan-reference groups.
- 11 unresolved/placeholder participant teams.
- 16 derived mismatch reports across tournaments.
- 19 match result placement out-of-range rows.
- 2 duplicate placement groups in a match.

These are data integrity issues, not code compile failures. They should be handled in a dedicated data cleanup pass.

## Per-Directory Notes

- `server/`: generally clear layering after the override cleanup. Main risks are auth hardening, manual SQL mutation/cascade logic, and many historical import scripts.
- `server/scripts/data/`: good direction for tournament static data. PMWC 2026 stats remains very large and should be treated as data, not business logic.
- `src/features/tournaments/`: feature-complete but high complexity. `TournamentDetailPage.jsx` and `StageStandingsBoard.jsx` need careful slice-by-slice extraction.
- `src/components/admin/`: largest frontend risk area. Components mix forms, persistence, export logic, and UI state.
- `tools/`: valuable but messy operational toolbox. Many scripts mutate DB state directly and should be labeled as one-shot, verified, or supported.
- `android/`: thin Android client exists, but `StageCoreApi.kt` points at emulator-local backend by default; production/mobile deployment needs environment-driven base URL.
- `tests/`: useful API and unit coverage exists. Windows `node --test tests/unit/*.test.js` may still fail with `spawn EPERM` in this environment before executing files.

## File Appendix

Every project-owned file included in this audit pass is listed below.

| File | Lines | Status | Notes |
| --- | ---: | --- | --- |
| `.github/workflows/ci.yml` | 21 | OK | No file-specific issue found in this audit pass. |
| `android/app/build.gradle.kts` | 84 | Review | Android client surface; mostly thin wrapper/API client. |
| `android/app/src/main/AndroidManifest.xml` | 28 | Review | Android client surface; mostly thin wrapper/API client. |
| `android/app/src/main/java/com/stagecore/app/data/model/Models.kt` | 48 | Review | Android client surface; mostly thin wrapper/API client. |
| `android/app/src/main/java/com/stagecore/app/data/remote/StageCoreApi.kt` | 34 | Review | Android client surface; mostly thin wrapper/API client. |
| `android/app/src/main/java/com/stagecore/app/MainActivity.kt` | 68 | Review | Android client surface; mostly thin wrapper/API client. |
| `android/app/src/main/java/com/stagecore/app/ui/components/FloatingNavBar.kt` | 55 | Review | Android client surface; mostly thin wrapper/API client. |
| `android/app/src/main/java/com/stagecore/app/ui/components/StageCoreCard.kt` | 32 | Review | Android client surface; mostly thin wrapper/API client. |
| `android/app/src/main/java/com/stagecore/app/ui/components/StageCoreWebView.kt` | 62 | Review | Android client surface; mostly thin wrapper/API client. |
| `android/app/src/main/java/com/stagecore/app/ui/screens/home/HomeScreen.kt` | 118 | Review | Android client surface; mostly thin wrapper/API client. |
| `android/app/src/main/java/com/stagecore/app/ui/screens/tournaments/TournamentListScreen.kt` | 73 | Review | Android client surface; mostly thin wrapper/API client. |
| `android/app/src/main/java/com/stagecore/app/ui/theme/Theme.kt` | 33 | Review | Android client surface; mostly thin wrapper/API client. |
| `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` | 18 | Review | Android client surface; mostly thin wrapper/API client. |
| `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` | 18 | Review | Android client surface; mostly thin wrapper/API client. |
| `android/app/src/main/res/values/strings.xml` | 4 | Review | Android client surface; mostly thin wrapper/API client. |
| `android/app/src/main/res/values/themes.xml` | 10 | Review | Android client surface; mostly thin wrapper/API client. |
| `android/build.gradle.kts` | 7 | Review | Android client surface; mostly thin wrapper/API client. |
| `android/settings.gradle.kts` | 18 | Review | Android client surface; mostly thin wrapper/API client. |
| `bmps2026/format.json` | 63 | OK | No file-specific issue found in this audit pass. |
| `bmps2026/grand_finals.json` | 26 | OK | No file-specific issue found in this audit pass. |
| `bmps2026/index.json` | 33 | OK | No file-specific issue found in this audit pass. |
| `bmps2026/last_chance.json` | 25 | OK | No file-specific issue found in this audit pass. |
| `bmps2026/qualifiers_round1.json` | 76 | OK | No file-specific issue found in this audit pass. |
| `bmps2026/qualifiers_round2.json` | 76 | OK | No file-specific issue found in this audit pass. |
| `bmps2026/qualifiers_round3.json` | 76 | OK | No file-specific issue found in this audit pass. |
| `bmps2026/qualifiers_round4.json` | 76 | OK | No file-specific issue found in this audit pass. |
| `bmps2026/semi_finals.json` | 38 | OK | No file-specific issue found in this audit pass. |
| `bmps2026/survival_stage.json` | 2152 | Review | Large module; high change risk and hard to review. |
| `build_stats.cjs` | 64 | OK | No file-specific issue found in this audit pass. |
| `check-api-raw.cjs` | 24 | OK | No file-specific issue found in this audit pass. |
| `check-groups.cjs` | 23 | OK | No file-specific issue found in this audit pass. |
| `check-keys.cjs` | 21 | OK | No file-specific issue found in this audit pass. |
| `check-names.cjs` | 20 | OK | No file-specific issue found in this audit pass. |
| `check-rounds.cjs` | 36 | OK | No file-specific issue found in this audit pass. |
| `check-zero.cjs` | 25 | OK | No file-specific issue found in this audit pass. |
| `click-tournaments.js` | 1 | OK | No file-specific issue found in this audit pass. |
| `components.json` | 22 | OK | No file-specific issue found in this audit pass. |
| `deploy.nginx.conf` | 18 | OK | No file-specific issue found in this audit pass. |
| `docs/codebase-audit-report.md` | 643 | Review | Medium-large module; consider extraction when touched. |
| `docs/phase-4-deferred-data-decisions.md` | 31 | OK | Documentation. |
| `ecosystem.config.cjs` | 18 | OK | No file-specific issue found in this audit pass. |
| `eslint.config.js` | 51 | OK | No file-specific issue found in this audit pass. |
| `extract_stats.cjs` | 28 | OK | No file-specific issue found in this audit pass. |
| `FILE-STRUCTURE.md` | 351 | OK | Documentation. |
| `find_block.cjs` | 61 | OK | No file-specific issue found in this audit pass. |
| `implementation_plan.md` | 183 | OK | Documentation. |
| `index.html` | 50 | OK | No file-specific issue found in this audit pass. |
| `jsconfig.json` | 22 | OK | No file-specific issue found in this audit pass. |
| `MVP-PLAN.md` | 355 | OK | Documentation. |
| `package.json` | 113 | OK | No file-specific issue found in this audit pass. |
| `playwright.config.js` | 35 | OK | No file-specific issue found in this audit pass. |
| `postcss.config.js` | 7 | OK | No file-specific issue found in this audit pass. |
| `public/images/core-grid.svg` | 13 | OK | No file-specific issue found in this audit pass. |
| `public/images/core-logo.svg` | 2 | OK | No file-specific issue found in this audit pass. |
| `public/images/core-pulse.svg` | 13 | OK | No file-specific issue found in this audit pass. |
| `public/images/core-ring.svg` | 13 | OK | No file-specific issue found in this audit pass. |
| `public/manifest.webmanifest` | 26 | OK | No file-specific issue found in this audit pass. |
| `public/sw.js` | 96 | OK | No file-specific issue found in this audit pass. |
| `quick-check.cjs` | 39 | OK | No file-specific issue found in this audit pass. |
| `README.md` | 132 | OK | Documentation. |
| `render.yaml` | 20 | OK | No file-specific issue found in this audit pass. |
| `run.sh` | 41 | OK | No file-specific issue found in this audit pass. |
| `server/db.js` | 8 | OK | No file-specific issue found in this audit pass. |
| `server/db/migrations/001_normalized_tournament_tables.sql` | 65 | OK | Database migration; immutable once applied. |
| `server/db/migrations/002_alias_and_history_tables.sql` | 31 | OK | Database migration; immutable once applied. |
| `server/db/migrations/003_stage_standings_tables.sql` | 28 | OK | Database migration; immutable once applied. |
| `server/db/migrations/004_backend_indexes.sql` | 53 | OK | Database migration; immutable once applied. |
| `server/db/migrations/005_drop_fan_zone_tables.sql` | 9 | OK | Database migration; immutable once applied. |
| `server/db/migrations/006_webp_image_paths.sql` | 32 | OK | Database migration; immutable once applied. |
| `server/db/migrations/007_performance_indexes.sql` | 7 | OK | Database migration; immutable once applied. |
| `server/db/migrations/008_unique_constraints.sql` | 6 | OK | Database migration; immutable once applied. |
| `server/db/migrations/20260524_stream_extraction.sql` | 89 | OK | Database migration; immutable once applied. |
| `server/db/normalize.js` | 639 | Review | Medium-large module; consider extraction when touched. |
| `server/db/schema.js` | 496 | OK | No file-specific issue found in this audit pass. |
| `server/db/teamAliases.js` | 184 | OK | No file-specific issue found in this audit pass. |
| `server/homeView.js` | 433 | OK | No file-specific issue found in this audit pass. |
| `server/index.js` | 213 | OK | No file-specific issue found in this audit pass. |
| `server/newsIngest.js` | 493 | OK | No file-specific issue found in this audit pass. |
| `server/newsModel.js` | 190 | OK | No file-specific issue found in this audit pass. |
| `server/newsSources.js` | 56 | OK | No file-specific issue found in this audit pass. |
| `server/rankingsView.js` | 154 | OK | No file-specific issue found in this audit pass. |
| `server/routes/admin.js` | 210 | OK | Express route module; auth/rate-limit behavior reviewed by category. |
| `server/routes/auth.js` | 97 | OK | Express route module; auth/rate-limit behavior reviewed by category. |
| `server/routes/entities.js` | 171 | OK | Express route module; auth/rate-limit behavior reviewed by category. |
| `server/routes/health.js` | 12 | OK | Express route module; auth/rate-limit behavior reviewed by category. |
| `server/routes/home.js` | 31 | OK | Express route module; auth/rate-limit behavior reviewed by category. |
| `server/routes/news.js` | 25 | OK | Express route module; auth/rate-limit behavior reviewed by category. |
| `server/routes/pages.js` | 85 | OK | Express route module; auth/rate-limit behavior reviewed by category. |
| `server/routes/rankings.js` | 13 | OK | Express route module; auth/rate-limit behavior reviewed by category. |
| `server/routes/search.js` | 13 | OK | Express route module; auth/rate-limit behavior reviewed by category. |
| `server/routes/site.js` | 12 | OK | Express route module; auth/rate-limit behavior reviewed by category. |
| `server/routes/tournaments.js` | 17 | OK | Express route module; auth/rate-limit behavior reviewed by category. |
| `server/scripts/bmps-2026-rosters.js` | 73 | OK | No file-specific issue found in this audit pass. |
| `server/scripts/data/bgms2026.js` | 29 | OK | Static tournament data module. |
| `server/scripts/data/bmps2026.js` | 40 | OK | Static tournament data module. |
| `server/scripts/data/pmgc2025.js` | 98 | OK | Static tournament data module. |
| `server/scripts/data/pmgc2025Stats.js` | 84 | OK | Static tournament data module. |
| `server/scripts/data/pmwc2026.js` | 90 | OK | Static tournament data module. |
| `server/scripts/data/pmwc2026Stats.js` | 2688 | OK | Static tournament data module. |
| `server/scripts/github-backup.js` | 81 | OK | No file-specific issue found in this audit pass. |
| `server/scripts/import-bgis-2023.js` | 503 | Review | Tournament import script; mutates SQLite and should stay idempotent. |
| `server/scripts/import-bgis-2024.js` | 694 | Review | Tournament import script; mutates SQLite and should stay idempotent. |
| `server/scripts/import-bgis-2025.js` | 291 | Review | Tournament import script; mutates SQLite and should stay idempotent. |
| `server/scripts/import-bgis-2026.js` | 504 | Review | Tournament import script; mutates SQLite and should stay idempotent. |
| `server/scripts/import-bgms-2026.js` | 490 | Review | Tournament import script; mutates SQLite and should stay idempotent. |
| `server/scripts/import-bmic-2025.js` | 203 | Review | Tournament import script; mutates SQLite and should stay idempotent. |
| `server/scripts/import-bmps-2023.js` | 205 | Review | Tournament import script; mutates SQLite and should stay idempotent. |
| `server/scripts/import-bmps-2024.js` | 239 | Review | Tournament import script; mutates SQLite and should stay idempotent. |
| `server/scripts/import-bmps-2025.js` | 284 | Review | Tournament import script; mutates SQLite and should stay idempotent. |
| `server/scripts/import-bmps-2026.js` | 825 | Review | Tournament import script; mutates SQLite and should stay idempotent. |
| `server/scripts/import-bmsd-2025.js` | 1216 | Review | Tournament import script; mutates SQLite and should stay idempotent. |
| `server/scripts/import-in-kr-2023.js` | 196 | Review | Tournament import script; mutates SQLite and should stay idempotent. |
| `server/scripts/import-pubg-mobile-global-championship-2025.js` | 34 | Review | Tournament import script; mutates SQLite and should stay idempotent. |
| `server/scripts/import-pubg-mobile-world-cup-2024.js` | 228 | Review | Tournament import script; mutates SQLite and should stay idempotent. |
| `server/scripts/import-pubg-mobile-world-cup-2025.js` | 222 | Review | Tournament import script; mutates SQLite and should stay idempotent. |
| `server/scripts/import-pubg-mobile-world-cup-2026.js` | 154 | Review | Tournament import script; mutates SQLite and should stay idempotent. |
| `server/scripts/importTournament.js` | 443 | OK | No file-specific issue found in this audit pass. |
| `server/scripts/postImportTransforms.js` | 331 | OK | No file-specific issue found in this audit pass. |
| `server/services/auth.js` | 194 | OK | Backend service module. |
| `server/services/bmps2026.js` | 1 | OK | Backend service module. |
| `server/services/entities.js` | 115 | OK | Backend service module. |
| `server/services/globalLeaderboard.js` | 82 | OK | Backend service module. |
| `server/services/listQuery.js` | 251 | OK | Backend service module. |
| `server/services/logger.js` | 23 | OK | Backend service module. |
| `server/services/pageCache.js` | 31 | OK | Backend service module. |
| `server/services/pagePayloads.js` | 199 | OK | Backend service module. |
| `server/services/records.js` | 80 | OK | Backend service module. |
| `server/services/schemas.js` | 216 | OK | Backend service module. |
| `server/services/search.js` | 307 | OK | Backend service module. |
| `server/services/seed.js` | 94 | OK | Backend service module. |
| `server/services/settings.js` | 43 | OK | Backend service module. |
| `server/services/tournaments.js` | 414 | OK | Backend service module. |
| `server/shared/bmps2026Progression.js` | 360 | OK | No file-specific issue found in this audit pass. |
| `server/shared/currentCircuit.js` | 8 | OK | No file-specific issue found in this audit pass. |
| `server/shared/globalLeaderboard.js` | 21 | OK | No file-specific issue found in this audit pass. |
| `server/shared/globalLeaderboardHardcoded.js` | 57 | OK | No file-specific issue found in this audit pass. |
| `server/shared/homeContent.js` | 123 | OK | No file-specific issue found in this audit pass. |
| `server/shared/liveCalendar.js` | 121 | OK | No file-specific issue found in this audit pass. |
| `server/shared/matchResultPublication.js` | 33 | OK | No file-specific issue found in this audit pass. |
| `server/shared/organizationIdentity.js` | 1 | OK | No file-specific issue found in this audit pass. |
| `server/shared/pmwc2026Progression.js` | 12 | OK | No file-specific issue found in this audit pass. |
| `server/shared/stageBoard.js` | 546 | Review | Medium-large module; consider extraction when touched. |
| `server/shared/teamLogos.js` | 1087 | Review | Large module; high change risk and hard to review. |
| `server/shared/tournamentBranding.js` | 27 | OK | No file-specific issue found in this audit pass. |
| `server/shared/tournamentLiveState.js` | 116 | OK | No file-specific issue found in this audit pass. |
| `server/shared/tournamentParticipants.js` | 45 | OK | No file-specific issue found in this audit pass. |
| `server/shared/tournamentProgression.js` | 6 | OK | No file-specific issue found in this audit pass. |
| `spot-check.cjs` | 41 | OK | No file-specific issue found in this audit pass. |
| `src/api/base44Client.js` | 399 | OK | No file-specific issue found in this audit pass. |
| `src/App.jsx` | 131 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/AdminInspector.jsx` | 497 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/AdminInstaPosters.jsx` | 1303 | Review | Large module; high change risk and hard to review. |
| `src/components/admin/AdminMatches.jsx` | 1124 | Review | Large module; high change risk and hard to review. |
| `src/components/admin/AdminNews.jsx` | 1076 | Review | Large module; high change risk and hard to review. |
| `src/components/admin/AdminOperations.jsx` | 194 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/AdminPlayerStats.jsx` | 306 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/AdminResults.jsx` | 839 | Review | Medium-large module; consider extraction when touched. |
| `src/components/admin/AdminStagePosters.jsx` | 466 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/AdminTeams.jsx` | 689 | Review | Medium-large module; consider extraction when touched. |
| `src/components/admin/AdminTournaments.jsx` | 1700 | Review | Large module; high change risk and hard to review. |
| `src/components/admin/AdminTransfers.jsx` | 431 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/formState.js` | 19 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/AwardIcon.jsx` | 83 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/CustomTemplate.jsx` | 232 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/FmvpCardPoster.jsx` | 33 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/GroupGridPoster.jsx` | 56 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/IgLCardPoster.jsx` | 33 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/MvpCardPoster.jsx` | 40 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/NewsPoster.jsx` | 114 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/NftCardPoster.jsx` | 156 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/PodiumPoster.jsx` | 231 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/PosterControls.jsx` | 477 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/posterDefaultConfig.js` | 21 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/PosterLogo.jsx` | 26 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/posterMvpHelpers.js` | 376 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/posterStageUtils.js` | 56 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/posterStandingsHelpers.js` | 119 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/posterStyles.js` | 920 | Review | Medium-large module; consider extraction when touched. |
| `src/components/admin/posters/RookieCardPoster.jsx` | 30 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/SpecialAwardCardPoster.jsx` | 33 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/StandingsPoster.jsx` | 231 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/SupportCardPoster.jsx` | 30 | OK | No file-specific issue found in this audit pass. |
| `src/components/admin/posters/Top5MvpPoster.jsx` | 180 | OK | No file-specific issue found in this audit pass. |
| `src/components/ErrorBoundary.jsx` | 47 | OK | No file-specific issue found in this audit pass. |
| `src/components/home/HomeDesktop.jsx` | 6 | OK | No file-specific issue found in this audit pass. |
| `src/components/home/HomeDesktopContent.jsx` | 601 | Review | Medium-large module; consider extraction when touched. |
| `src/components/layout/AppLayout.jsx` | 19 | OK | No file-specific issue found in this audit pass. |
| `src/components/layout/BottomNav.jsx` | 46 | OK | No file-specific issue found in this audit pass. |
| `src/components/layout/TopBar.jsx` | 32 | OK | No file-specific issue found in this audit pass. |
| `src/components/layout/topbar/DesktopTopBar.jsx` | 193 | OK | No file-specific issue found in this audit pass. |
| `src/components/rankings/PerformanceChart.jsx` | 46 | OK | No file-specific issue found in this audit pass. |
| `src/components/rankings/PlayerCard3D.jsx` | 253 | OK | No file-specific issue found in this audit pass. |
| `src/components/search/GlobalSearch.jsx` | 181 | OK | No file-specific issue found in this audit pass. |
| `src/components/shared/brand-concepts.js` | 18 | OK | No file-specific issue found in this audit pass. |
| `src/components/shared/BrandMark.jsx` | 156 | OK | No file-specific issue found in this audit pass. |
| `src/components/shared/Calendar.jsx` | 118 | OK | No file-specific issue found in this audit pass. |
| `src/components/shared/EmptyState.jsx` | 19 | OK | No file-specific issue found in this audit pass. |
| `src/components/shared/LogoBlock.jsx` | 56 | OK | No file-specific issue found in this audit pass. |
| `src/components/shared/PageLoader.jsx` | 30 | OK | No file-specific issue found in this audit pass. |
| `src/components/shared/ProfilePanel.jsx` | 21 | OK | No file-specific issue found in this audit pass. |
| `src/components/shared/ProfileStatGrid.jsx` | 78 | OK | No file-specific issue found in this audit pass. |
| `src/components/shared/QueryError.jsx` | 29 | OK | No file-specific issue found in this audit pass. |
| `src/components/shared/ResultsByYearTable.jsx` | 80 | OK | No file-specific issue found in this audit pass. |
| `src/components/shared/StatCard.jsx` | 43 | OK | No file-specific issue found in this audit pass. |
| `src/components/shared/StatusBadge.jsx` | 23 | OK | No file-specific issue found in this audit pass. |
| `src/components/shared/TeamIdentity.jsx` | 122 | OK | No file-specific issue found in this audit pass. |
| `src/components/teams/TeamDetail.jsx` | 607 | Review | Medium-large module; consider extraction when touched. |
| `src/components/tournaments/detail/Header.jsx` | 19 | OK | No file-specific issue found in this audit pass. |
| `src/components/tournaments/detail/Header.module.css` | 41 | OK | No file-specific issue found in this audit pass. |
| `src/components/tournaments/detail/NavTabs.jsx` | 31 | OK | No file-specific issue found in this audit pass. |
| `src/components/tournaments/detail/NavTabs.module.css` | 27 | OK | No file-specific issue found in this audit pass. |
| `src/components/tournaments/FactCard.jsx` | 40 | OK | No file-specific issue found in this audit pass. |
| `src/components/tournaments/SortableColumnHeader.jsx` | 40 | OK | No file-specific issue found in this audit pass. |
| `src/components/tournaments/TournamentDetail.jsx` | 2 | OK | No file-specific issue found in this audit pass. |
| `src/components/ui/accordion-content.jsx` | 20 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/accordion-item.jsx` | 16 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/accordion-trigger.jsx` | 27 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/accordion.jsx` | 10 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/alert-description.jsx` | 15 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/alert-dialog.jsx` | 118 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/alert-title.jsx` | 15 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/alert.jsx` | 35 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/aspect-ratio.jsx` | 6 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/avatar-fallback.jsx` | 21 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/avatar-image.jsx` | 18 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/avatar.jsx` | 23 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/badge-variants.js` | 22 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/badge.jsx` | 13 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/breadcrumb.jsx` | 93 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/button-variants.js` | 32 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/button.jsx` | 22 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/calendar.jsx` | 67 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/card.jsx` | 67 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/Card.module.css` | 15 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/carousel.jsx` | 243 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/chart.jsx` | 373 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/checkbox.jsx` | 26 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/collapsible.jsx` | 12 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/command.jsx` | 127 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/context-menu.jsx` | 180 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/dialog.jsx` | 107 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/drawer.jsx` | 100 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/dropdown-menu.jsx` | 183 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/form.jsx` | 140 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/hover-card.jsx` | 29 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/input-otp-group.jsx` | 11 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/input-otp-separator.jsx` | 12 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/input-otp-slot.jsx` | 32 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/input-otp.jsx` | 25 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/input.jsx` | 21 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/label.jsx` | 21 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/menubar.jsx` | 214 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/navigation-menu-variants.js` | 6 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/navigation-menu.jsx` | 116 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/pagination.jsx` | 94 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/popover.jsx` | 31 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/progress.jsx` | 26 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/radio-group.jsx` | 37 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/resizable.jsx` | 37 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/scroll-area.jsx` | 45 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/select.jsx` | 149 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/separator.jsx` | 27 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/sheet.jsx` | 120 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/sidebar.jsx` | 682 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/skeleton.jsx` | 13 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/slider.jsx` | 24 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/switch.jsx` | 25 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/table.jsx` | 97 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/tabs-content.jsx` | 19 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/tabs-list.jsx` | 19 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/tabs-trigger.jsx` | 19 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/tabs.jsx` | 11 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/textarea.jsx` | 20 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/toast.jsx` | 101 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/toaster.jsx` | 37 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/toggle-group.jsx` | 58 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/toggle-variants.js` | 24 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/toggle.jsx` | 20 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/tooltip.jsx` | 32 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/components/ui/use-toast.jsx` | 187 | OK | Generated-style UI primitive; keep changes minimal. |
| `src/features/leaderboard/components/FeaturedStandingsSection.jsx` | 257 | OK | Feature module. |
| `src/features/leaderboard/components/leaderboardBits.jsx` | 78 | OK | Feature module. |
| `src/features/leaderboard/components/LeaderboardPageHeader.jsx` | 26 | OK | Feature module. |
| `src/features/leaderboard/components/OverallStatsSection.jsx` | 156 | OK | Feature module. |
| `src/features/leaderboard/data/buildTeamMapStats.js` | 268 | OK | Feature module. |
| `src/features/leaderboard/hooks/useLeaderboardData.js` | 172 | OK | Feature module. |
| `src/features/leaderboard/index.js` | 2 | OK | Feature module. |
| `src/features/leaderboard/LeaderboardPage.jsx` | 52 | OK | Feature module. |
| `src/features/leaderboard/utils/leaderboardHelpers.js` | 34 | OK | Feature module. |
| `src/features/README.md` | 14 | OK | Documentation. |
| `src/features/tournaments/components/BmpsSemiFinalsPendingPanel.jsx` | 142 | OK | Feature module. |
| `src/features/tournaments/components/MobileStageBoard.jsx` | 336 | OK | Feature module. |
| `src/features/tournaments/components/ParticipantRosterCard.jsx` | 43 | OK | Feature module. |
| `src/features/tournaments/components/RankingTable.jsx` | 113 | OK | Feature module. |
| `src/features/tournaments/components/StageStandingsBoard.jsx` | 1266 | Review | Large module; high change risk and hard to review. |
| `src/features/tournaments/components/StatisticsPanel.jsx` | 385 | OK | Feature module. |
| `src/features/tournaments/constants.js` | 40 | OK | Feature module. |
| `src/features/tournaments/hooks/stageBoardUiReducer.js` | 76 | OK | Feature module. |
| `src/features/tournaments/hooks/useBmps2026Statistics.js` | 275 | OK | Feature module. |
| `src/features/tournaments/index.js` | 3 | OK | Feature module. |
| `src/features/tournaments/TournamentDetailPage.jsx` | 1227 | Review | Large module; high change risk and hard to review. |
| `src/features/tournaments/utils/participantHelpers.js` | 549 | Review | Medium-large module; consider extraction when touched. |
| `src/features/tournaments/utils/stageHelpers.js` | 173 | OK | Feature module. |
| `src/features/tournaments/utils/tableSort.js` | 37 | OK | Feature module. |
| `src/features/tournaments/utils/tournamentAllocations.js` | 74 | OK | Feature module. |
| `src/features/tournaments/utils/tournamentBranding.js` | 32 | OK | Feature module. |
| `src/hooks/use-install-prompt.jsx` | 79 | OK | No file-specific issue found in this audit pass. |
| `src/hooks/use-mobile.jsx` | 22 | OK | No file-specific issue found in this audit pass. |
| `src/images/core-logo.svg` | 2 | OK | No file-specific issue found in this audit pass. |
| `src/index.css` | 645 | Review | Medium-large module; consider extraction when touched. |
| `src/lib/adminAccess.js` | 22 | OK | Frontend/shared helper module. |
| `src/lib/awardTypes.js` | 165 | OK | Frontend/shared helper module. |
| `src/lib/bmps2026PlayerStats.js` | 1402 | Review | Large module; high change risk and hard to review. |
| `src/lib/bmps2026Progression.js` | 596 | Review | Medium-large module; consider extraction when touched. |
| `src/lib/bmps2026Rosters.js` | 73 | OK | Frontend/shared helper module. |
| `src/lib/currentRosterOverrides.js` | 66 | OK | Frontend/shared helper module. |
| `src/lib/dateUtils.js` | 11 | OK | Frontend/shared helper module. |
| `src/lib/homeContent.js` | 123 | OK | Frontend/shared helper module. |
| `src/lib/liveCalendar.js` | 121 | OK | Frontend/shared helper module. |
| `src/lib/matchResultPublication.js` | 33 | OK | Frontend/shared helper module. |
| `src/lib/newsCategories.js` | 18 | OK | Frontend/shared helper module. |
| `src/lib/newsEditorial.js` | 201 | OK | Frontend/shared helper module. |
| `src/lib/normalizedIdentity.js` | 198 | OK | Frontend/shared helper module. |
| `src/lib/organizationIdentity.js` | 293 | OK | Frontend/shared helper module. |
| `src/lib/PageNotFound.jsx` | 88 | OK | Frontend/shared helper module. |
| `src/lib/playerDisplayName.js` | 20 | OK | Frontend/shared helper module. |
| `src/lib/playerPhotos.js` | 147 | OK | Frontend/shared helper module. |
| `src/lib/pmwc2026Progression.js` | 270 | OK | Frontend/shared helper module. |
| `src/lib/pwa.js` | 28 | OK | Frontend/shared helper module. |
| `src/lib/query-client.js` | 11 | OK | Frontend/shared helper module. |
| `src/lib/rosterUtils.js` | 155 | OK | Frontend/shared helper module. |
| `src/lib/SearchContext.jsx` | 23 | OK | Frontend/shared helper module. |
| `src/lib/stageBoard.js` | 546 | Review | Medium-large module; consider extraction when touched. |
| `src/lib/teamLogos.js` | 1088 | Review | Large module; high change risk and hard to review. |
| `src/lib/teamScope.js` | 238 | OK | Frontend/shared helper module. |
| `src/lib/ThemeContext.jsx` | 35 | OK | Frontend/shared helper module. |
| `src/lib/tournamentBranding.js` | 27 | OK | Frontend/shared helper module. |
| `src/lib/tournamentLiveState.js` | 116 | OK | Frontend/shared helper module. |
| `src/lib/tournamentParticipants.js` | 45 | OK | Frontend/shared helper module. |
| `src/lib/tournamentProgression.js` | 74 | OK | Frontend/shared helper module. |
| `src/lib/tournamentResults.js` | 261 | OK | Frontend/shared helper module. |
| `src/lib/utils.js` | 7 | OK | Frontend/shared helper module. |
| `src/main.jsx` | 15 | OK | No file-specific issue found in this audit pass. |
| `src/pages/Admin.jsx` | 261 | OK | Top-level React page. |
| `src/pages/Home.jsx` | 117 | OK | Top-level React page. |
| `src/pages/LandingPage.jsx` | 672 | Review | Medium-large module; consider extraction when touched. |
| `src/pages/Leaderboard.jsx` | 2 | OK | Top-level React page. |
| `src/pages/News.jsx` | 449 | OK | Top-level React page. |
| `src/pages/NewsArticle.jsx` | 221 | OK | Top-level React page. |
| `src/pages/PlayerProfile.jsx` | 1027 | Review | Large module; high change risk and hard to review. |
| `src/pages/Rankings.jsx` | 764 | Review | Medium-large module; consider extraction when touched. |
| `src/pages/SignIn.jsx` | 180 | OK | Top-level React page. |
| `src/pages/Teams.jsx` | 501 | Review | Medium-large module; consider extraction when touched. |
| `src/pages/Tournaments.jsx` | 478 | OK | Top-level React page. |
| `src/styles/design-tokens.css` | 108 | OK | No file-specific issue found in this audit pass. |
| `src/styles/poster-export.css` | 319 | OK | No file-specific issue found in this audit pass. |
| `stagecore-dump.sql` | 1 | OK | No file-specific issue found in this audit pass. |
| `start-both.cjs` | 10 | OK | No file-specific issue found in this audit pass. |
| `start-servers.cjs` | 22 | OK | No file-specific issue found in this audit pass. |
| `tailwind.config.js` | 317 | OK | No file-specific issue found in this audit pass. |
| `test-api.cjs` | 23 | OK | No file-specific issue found in this audit pass. |
| `test-api2.cjs` | 27 | OK | No file-specific issue found in this audit pass. |
| `test-crash.mjs` | 35 | OK | No file-specific issue found in this audit pass. |
| `test-pup.cjs` | 35 | OK | No file-specific issue found in this audit pass. |
| `test-trace-2.mjs` | 17 | OK | No file-specific issue found in this audit pass. |
| `test-trace.mjs` | 18 | OK | No file-specific issue found in this audit pass. |
| `tests/api.test.js` | 107 | OK | Test/spec coverage. |
| `tests/deepcheck.spec.js` | 136 | OK | Test/spec coverage. |
| `tests/feature-pages.spec.js` | 27 | OK | Test/spec coverage. |
| `tests/helpers/server.js` | 31 | OK | Test/spec coverage. |
| `tests/home.spec.js` | 9 | OK | Test/spec coverage. |
| `tests/public-pages.spec.js` | 57 | OK | Test/spec coverage. |
| `tests/unit/base44Client.test.js` | 51 | OK | Test/spec coverage. |
| `tests/unit/teamScope.test.js` | 175 | OK | Test/spec coverage. |
| `TODO-CODEX.md` | 8 | OK | Documentation. |
| `tools/_check-g15.cjs` | 20 | Review | Operational/debug script; validate before running against production data. |
| `tools/audit-database.mjs` | 242 | Review | Operational/debug script; validate before running against production data. |
| `tools/audit-format.mjs` | 96 | Review | Operational/debug script; validate before running against production data. |
| `tools/backfill-normalized.mjs` | 41 | Review | Operational/debug script; validate before running against production data. |
| `tools/backup-db.js` | 39 | Review | Operational/debug script; validate before running against production data. |
| `tools/build-fallback.ps1` | 95 | Review | Operational/debug script; validate before running against production data. |
| `tools/build-tournament-detail-page.cjs` | 87 | Review | Operational/debug script; validate before running against production data. |
| `tools/build.js` | 38 | Review | Operational/debug script; validate before running against production data. |
| `tools/check-json.mjs` | 4 | Review | Operational/debug script; validate before running against production data. |
| `tools/check-logo-resolve.mjs` | 5 | Review | Operational/debug script; validate before running against production data. |
| `tools/check-match-results.mjs` | 13 | Review | Operational/debug script; validate before running against production data. |
| `tools/check-pel-cols.mjs` | 13 | Review | Operational/debug script; validate before running against production data. |
| `tools/check-pel-name.mjs` | 4 | Review | Operational/debug script; validate before running against production data. |
| `tools/check-pel.mjs` | 4 | Review | Operational/debug script; validate before running against production data. |
| `tools/check-pmwc-groups.mjs` | 23 | Review | Operational/debug script; validate before running against production data. |
| `tools/check-prizes.mjs` | 10 | Review | Operational/debug script; validate before running against production data. |
| `tools/check-t-logos.mjs` | 4 | Review | Operational/debug script; validate before running against production data. |
| `tools/check-team-logos.mjs` | 28 | Review | Operational/debug script; validate before running against production data. |
| `tools/check-teams.mjs` | 9 | Review | Operational/debug script; validate before running against production data. |
| `tools/check-tournaments.mjs` | 5 | Review | Operational/debug script; validate before running against production data. |
| `tools/count-normalized.mjs` | 17 | Review | Operational/debug script; validate before running against production data. |
| `tools/create-pmgc-2025-teams.mjs` | 159 | Review | Operational/debug script; validate before running against production data. |
| `tools/create-pmgc-2025.mjs` | 92 | Review | Operational/debug script; validate before running against production data. |
| `tools/db-stats.cjs` | 9 | Review | Operational/debug script; validate before running against production data. |
| `tools/download-pel-logos.mjs` | 38 | Review | Operational/debug script; validate before running against production data. |
| `tools/dump-headings.mjs` | 33 | Review | Operational/debug script; validate before running against production data. |
| `tools/dump-pmwc.mjs` | 44 | Review | Operational/debug script; validate before running against production data. |
| `tools/dump-pmwc2.mjs` | 55 | Review | Operational/debug script; validate before running against production data. |
| `tools/dump-tabs.mjs` | 37 | Review | Operational/debug script; validate before running against production data. |
| `tools/extract-tournament-hook.cjs` | 63 | Review | Operational/debug script; validate before running against production data. |
| `tools/extract-tournament-panels.cjs` | 161 | Review | Operational/debug script; validate before running against production data. |
| `tools/fix-pel-game17.mjs` | 85 | Review | Operational/debug script; validate before running against production data. |
| `tools/fix-pel-headstart.mjs` | 55 | Review | Operational/debug script; validate before running against production data. |
| `tools/fix-pel-standings.mjs` | 24 | Review | Operational/debug script; validate before running against production data. |
| `tools/fix-pmwc2026-groups.mjs` | 75 | Review | Operational/debug script; validate before running against production data. |
| `tools/generate-codebase-audit.mjs` | 244 | Review | Operational/debug script; validate before running against production data. |
| `tools/inspect-pmwc.mjs` | 29 | Review | Operational/debug script; validate before running against production data. |
| `tools/investigate-issues.mjs` | 117 | Review | Operational/debug script; validate before running against production data. |
| `tools/launch-local.cjs` | 194 | Review | Operational/debug script; validate before running against production data. |
| `tools/optimize-images.mjs` | 46 | Review | Operational/debug script; validate before running against production data. |
| `tools/per-tournament-stages.mjs` | 16 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-4000.mjs` | 29 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-drawer.mjs` | 32 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-drawer2.mjs` | 30 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-home-hero.mjs` | 42 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-mobile-app.mjs` | 97 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-mobile-chain.mjs` | 53 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-mobile-detail.mjs` | 52 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-mobile-layout.mjs` | 61 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-mobile.mjs` | 39 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-mobile2.mjs` | 35 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-pages.mjs` | 35 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-pmwc-board.mjs` | 48 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-prizes-expand.mjs` | 37 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-prizes-row.mjs` | 34 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-prizes-row2.mjs` | 30 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-prizes.mjs` | 44 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-rankings-mobile.mjs` | 44 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-rankings-tabs.mjs` | 39 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-search-overlay.mjs` | 15 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-tunnel-tournaments.mjs` | 38 | Review | Operational/debug script; validate before running against production data. |
| `tools/probe-tunnel.mjs` | 29 | Review | Operational/debug script; validate before running against production data. |
| `tools/rebuild-pmgc2025.mjs` | 369 | Review | Operational/debug script; validate before running against production data. |
| `tools/render-core-logo.ps1` | 79 | Review | Operational/debug script; validate before running against production data. |
| `tools/schema.mjs` | 4 | Review | Operational/debug script; validate before running against production data. |
| `tools/seed-pel-details.mjs` | 83 | Review | Operational/debug script; validate before running against production data. |
| `tools/seed-pel.mjs` | 34 | Review | Operational/debug script; validate before running against production data. |
| `tools/seed-pmwc2026-teams.mjs` | 110 | Review | Operational/debug script; validate before running against production data. |
| `tools/serve-dist.cjs` | 95 | Review | Operational/debug script; validate before running against production data. |
| `tools/shot-pmwc.mjs` | 19 | Review | Operational/debug script; validate before running against production data. |
| `tools/shot-tabs.mjs` | 19 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pel-brief-only.mjs` | 21 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pel-brief.mjs` | 37 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pel-data.mjs` | 55 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pel-finals.mjs` | 77 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pel-format-plaintext.mjs` | 40 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pel-full.mjs` | 219 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pel-game17.mjs` | 78 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pel-game8.mjs` | 98 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pel-keys.mjs` | 27 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pel-m-columns.mjs` | 72 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pel-matches-fixed.mjs` | 98 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pel-matches.mjs` | 122 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pel-roster-keys.mjs` | 19 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pel-stages-final.mjs` | 163 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pel-stages.mjs` | 124 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pel-standings.mjs` | 77 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pmgc-details.mjs` | 170 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pmgc-groups.mjs` | 16 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pmwc-participants.mjs` | 41 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-pmwc-prizes.mjs` | 31 | Review | Operational/debug script; validate before running against production data. |
| `tools/update-team-logos.mjs` | 53 | Review | Operational/debug script; validate before running against production data. |
| `tools/verify-api-scope.mjs` | 38 | Review | Operational/debug script; validate before running against production data. |
| `tools/verify-pmwc.mjs` | 30 | Review | Operational/debug script; validate before running against production data. |
| `tools/verify-post-import-transforms.mjs` | 53 | Review | Operational/debug script; validate before running against production data. |
| `tools/view-rankings.mjs` | 5 | Review | Operational/debug script; validate before running against production data. |
| `tools/view-stages.mjs` | 5 | Review | Operational/debug script; validate before running against production data. |
| `vercel.json` | 9 | OK | No file-specific issue found in this audit pass. |
| `verify-all.cjs` | 84 | OK | No file-specific issue found in this audit pass. |
| `verify-correct.cjs` | 40 | OK | No file-specific issue found in this audit pass. |
| `verify-final.cjs` | 25 | OK | No file-specific issue found in this audit pass. |
| `vite.config.js` | 107 | OK | No file-specific issue found in this audit pass. |
