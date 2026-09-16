# Phase 4: Data Architecture Cleanup — Updated Plan

## What Changed in Phase 3

Phase 3 delivered more than originally scoped:

| Original Phase 4 Proposal | What Actually Exists Now |
|---|---|
| "Per-tournament data files + shared core logic" | **Done.** `importTournament.js` (433 lines) IS the shared core. Each `import-*.js` is a config file — tournament metadata, teams, standings, alias map, match schedule. |
| "Single alias source" | **Done.** `src/lib/organizationIdentity.js` is the canonical source. `server/db/teamAliases.js` consumes it. No more duplicate alias maps. |
| "Rating tables" | **Done.** `team_season_ratings` + `player_season_ratings` seeded and verified. `recomputeGlobalLeaderboard()` updates `team_season_ratings`. |
| "Consolidate duplicated import logic" | **Done for 6/15 scripts.** BMIC, IN-KR, BMPS 2025, BMSD 2025, BGIS 2023, BGIS 2024 all use `importTournament()`. |

**Remaining work:** 9 unconverted import scripts + `tournamentOverrides.js` (661 lines of per-tournament display logic that should migrate into the import system).

## Current State Audit

### Import Scripts (server/scripts/)

| Script | Lines | Status | Notes |
|--------|-------|--------|-------|
| `importTournament.js` | 433 | Core | Shared function, 3-tier upsert, participants fallback |
| `import-bmic-2025.js` | ~190 | ✓ Converted | |
| `import-in-kr-2023.js` | ~230 | ✓ Converted | |
| `import-bmps-2025.js` | ~320 | ✓ Converted | |
| `import-bmsd-2025.js` | ~490 | ✓ Converted | |
| `import-bgis-2023.js` | ~340 | ✓ Converted | |
| `import-bgis-2024.js` | ~360 | ✓ Converted | |
| `import-pubg-mobile-world-cup-2024.js` | 343 | **Not converted** | Simple — no multi-stage |
| `import-pubg-mobile-world-cup-2025.js` | 333 | **Not converted** | Simple — no multi-stage |
| `import-pubg-mobile-world-cup-2026.js` | 176 | **Not converted** | Simplest — skeleton only |
| `import-bmps-2023.js` | 808 | **Not converted** | Multi-stage |
| `import-bmps-2024.js` | 860 | **Not converted** | Multi-stage |
| `import-bmps-2026.js` | 869 | **Not converted** | Multi-stage, uses `normalizeOrganizationName` |
| `import-bgis-2025.js` | 1238 | **Not converted** | Multi-stage |
| `import-bgis-2026.js` | 2996 | **Not converted** | Largest — complex multi-stage |
| `import-bgms-2026.js` | 1142 | **Not converted** | Multi-stage |

### Other Tournament Logic

| File | Lines | Purpose | Phase 4 Action |
|------|-------|---------|----------------|
| `server/tournamentOverrides.js` | 661 | Per-tournament display overrides (standings, rankings, formats, group names, stages) | Migrate into import data |
| `server/services/globalLeaderboard.js` | ~80 | `recomputeGlobalLeaderboard()` | Keep — runs after imports |
| `server/services/tournaments.js` | 414 | `deriveStandingsFromMatchResults()`, `getNormalizedTournament()` | Keep — DB query layer |
| `src/lib/tournamentProgression.js` | ~150 | Stage progression logic for frontend | Keep — frontend concern |
| `src/lib/tournamentResults.js` | ~100 | Results display logic | Keep — frontend concern |
| `server/pmw*Stats.js` | ~100 each | Hardcoded PMWC/PMGC rankings | Migrate into tournaments.rankings |

### Database Tables (tournament-related)

```
tournaments          — 19 rows, JSON columns: stages, participants, rankings,
                       calendar, prize_breakdown, awards
teams                — ~280 rows
players              — ~840 rows
match_results        — standings per team per stage (the "results" table)
matches              — scheduled matches (map, time, stream)
team_season_ratings  — 30 rows (Phase B seed)
player_season_ratings — 60 rows (Phase B seed)
```

## Open Question: Database-Backed vs File-Based

**Recommendation: Stay database-backed.** The files become config/seed data that import into the DB. Here's why:

1. **The DB is now trustworthy.** Phase 3 fixed the FK constraints, added `team_season_ratings`/`player_season_ratings`, built a backup system, and proved transaction safety. Throwing that away loses real value.

2. **Complex queries need SQL.** `deriveStandingsFromMatchResults()` does stage→group→team aggregation with joins. `getNormalizedTournament()` assembles the full payload. These are hard to replicate with flat files.

3. **Concurrent access is handled.** WAL mode, transactions, connection pooling — the DB handles multiple request threads. File-based would need manual locking.

4. **The import scripts are the ingestion layer.** They already validate, normalize, and transactionally insert. Adding file-based serving would be a second parallel system for the same data.

5. **The real problem isn't the DB — it's scattered config.** `tournamentOverrides.js` (661 lines), `pmwc2026Stats.js`, `pmgc2025Stats.js`, and per-script rosters are duplicated config that should live in one place. The fix is consolidation, not replacement.

**What changes:** The import scripts become the single source of truth for tournament data. `tournamentOverrides.js` display logic migrates into the import data (stages, rankings, formats go into `tournament.stages`/`tournament.rankings`). The DB stores the canonical state. The frontend reads from the DB via existing API routes.

## Proposed Folder Structure

```
server/
├── scripts/
│   ├── importTournament.js          # Core (no changes)
│   ├── import/
│   │   ├── bgmi/
│   │   │   ├── bgis-2023.js         # Converted config
│   │   │   ├── bgis-2024.js         # Converted config
│   │   │   ├── bgis-2025.js         # To convert
│   │   │   ├── bgis-2026.js         # To convert
│   │   │   ├── bgms-2026.js         # To convert
│   │   │   ├── bgms-season5.js      # (current import-bgms-2026.js rename?)
│   │   │   └── ...
│   │   ├── pmwc/
│   │   │   ├── pmwc-2024.js
│   │   │   ├── pmwc-2025.js
│   │   │   └── pmwc-2026.js
│   │   ├── bmps/
│   │   │   ├── bmps-2023.js
│   │   │   ├── bmps-2024.js
│   │   │   ├── bmps-2025.js
│   │   │   └── bmps-2026.js
│   │   └── misc/
│   │       ├── bmsd-2025.js
│   │       └── in-kr-2023.js
│   ├── github-backup.js
│   └── bmps-2026-rosters.js
├── shared/
│   └── organizationIdentity.js      # Re-export (no changes)
├── tournamentOverrides.js           # Gradually gutted as logic moves into imports
├── pmwc2026Stats.js                 # Migrate rankings into import-pmw-2026.js
├── pmgc2025Stats.js                 # Migrate rankings into import-pmgc-2025.js
├── db/
│   ├── schema.js
│   ├── migrations/
│   ├── normalize.js
│   └── teamAliases.js
├── services/
│   ├── tournaments.js               # Keep — DB query layer
│   ├── globalLeaderboard.js         # Keep — recompute after imports
│   └── ...
└── ...
```

**Note:** This is a gradual reorganization, not a big-bang rewrite. Scripts move into subdirectories one at a time as they're converted. The flat `server/scripts/` structure works fine until there are enough warranting subdirs.

## Phase 4 Breakdown

### Phase 4.1 — Convert remaining 9 import scripts to importTournament()
Each conversion follows the Phase 3 pattern: snapshot before, convert, verify field-by-field.

**Priority order (simplest first):**
1. `import-pubg-mobile-world-cup-2024.js` (343 lines) — simplest, no multi-stage
2. `import-pubg-mobile-world-cup-2025.js` (333 lines) — same structure
3. `import-pubg-mobile-world-cup-2026.js` (176 lines) — skeleton
4. `import-bmps-2023.js` (808 lines) — multi-stage
5. `import-bmps-2024.js` (860 lines) — multi-stage
6. `import-bmps-2026.js` (869 lines) — multi-stage, uses `normalizeOrganizationName`
7. `import-bgis-2025.js` (1238 lines) — multi-stage
8. `import-bgms-2026.js` (1142 lines) — multi-stage
9. `import-bgis-2026.js` (2996 lines) — largest, most complex

**Estimated total reduction:** ~9,700 → ~3,500 lines (~64% reduction)

### Phase 4.2 — Migrate tournamentOverrides.js into import data
The 661-line `tournamentOverrides.js` contains:
- Display overrides (format strings, group names, stage names)
- PMWC/PMGC standings format overrides
- BGIS 2023 override
- Prize breakdowns
- Custom stage definitions

**Action:** Move this data into each tournament's `tournament` object in the import scripts (stages, rankings, format_overview). Delete `tournamentOverrides.js` once all tournaments are migrated.

### Phase 4.3 — Migrate pmwc2026Stats.js / pmgc2025Stats.js
Move hardcoded rankings arrays into the respective import scripts' `tournament.rankings`.

### Phase 4.4 — Remove recomputeTeamStats() from import scripts
Currently called inside `importTournament()`. After all imports are converted, ensure `recomputeGlobalLeaderboard()` is the single post-import step and remove per-import `recomputeTeamStats()` calls.

## First Slice: PUBG Mobile World Cup 2024

**Why this one:**
- Smallest unconverted script (343 lines)
- Single-stage tournament (no League/Semi/Grand Finals complexity)
- No multi-group format
- Good test of the basic conversion pattern before tackling multi-stage scripts

**Steps:**
1. Snapshot: record all match_results, teams, players, tournament data for PMWC 2024
2. Convert `import-pubg-mobile-world-cup-2024.js` to use `importTournament()`
3. Run the converted script
4. Verify field-by-field: same teams, same placements, same kill/PP/total points
5. Verify no regressions: 60 ratings intact, 0 duplicates, 0 orphans
6. Commit + push + backup SQLite

**Verification command template:**
```bash
node -e "import Database from 'better-sqlite3'; ..."
# Check: team count, match_results per team, placements, kills, PP, totals
# Check: player_season_ratings = 60, orphans = 0, dupes = 0
```
