# Phase 2 dry-run pilot — BMPS 2025 Grand Finals

Date: 2026-09-26
Scope: single stage, `BMPS 2025 / Grand Finals`, dry-run only.
Result: **dry-run extraction succeeded. Production enrichment was NOT applied.**
Machine-readable companion: `tools/reports/phase2-bmps2025-gf-dry-run.json`.

## Source

| Field | Value |
|---|---|
| Source name | Liquipedia (PUBG Mobile wiki) |
| Page | `Battlegrounds_Mobile_India_Pro_Series/2025` |
| Exact source URL | https://liquipedia.net/pubgmobile/Battlegrounds_Mobile_India_Pro_Series/2025 |
| Section | `===Grand Finals===` |
| Retrieval method | MediaWiki `action=parse&prop=wikitext` (gzip required); captured to a fixture |
| Retrieved | 2026-09-26 |
| Fixture | `tests/fixtures/bmps2025-grand-finals.wikitext` (8452 bytes) |
| Fixture checksum | `sha256:aab3c517a66af9ea5926932ae762a3d40f8db82b108aca6e5ca9a731a37034fb` |
| Parser | `tools/liquipedia/parser.mjs`, version `1.0.0` |
| License | CC BY-SA 3.0 (attribution retained in payload provenance) |

The fixture is committed so the pipeline is reproducible and the unit suite makes
**no live network requests**.

## Coverage

| Expected | Extracted |
|---|---|
| 18 matches | 18 |
| 16 teams per match | 16 (uniform across all 18 matches) |
| 288 match-result rows | 288 |
| player-match-stat rows | 0 (see below) |

- Match numbers: `1..18`, no gaps, no nulls.
- Parser issues: **0**. No missing fields, no malformed tokens, no team-name
  identity misses (16/16 source teams resolved to CORE team ids).
- `stage_match_breakdown`: not created.

## Validation

| Check | Result |
|---|---|
| Match sequence `1..18` | pass |
| Teams per match `16` | pass (unique cardinality set = `[16]`) |
| Row uniqueness `(match_number, team_match_key)` | pass |
| Arithmetic `kill_points = kills + startingpoints` | pass (0 errors) |
| Arithmetic `total_points = kills + placement_points + startingpoints` | pass (0 errors) |
| Provenance on every match (`source_slug`, `source_url`, `source_name`) | pass |
| Provenance on every result row (`source_ref`, `source_url`) | pass |
| Canonical payload consumable by `enrichStage` | pass (every row has a `team_id`) |
| Parser idempotency | pass (identical output across runs) |

Placement points are taken from the source's own published table
(`{{Match|p1=10 |p2=6 |p3=5 |p4=4 |p5=3 |p6=2 |p7=1 |p8=1}}`), not from a hardcoded
CORE convention. Placements beyond 8 correctly score 0, matching the source.

Error-scenario coverage (unit suite): malformed `{{MS}}`, missing match map/date,
missing team-match entry, absent points table, count mismatches — all reported as
issues and never fabricated into values.

## Completeness validation against a DB copy

The existing `tools/verify-stage-completeness.mjs` was run against throwaway
copies of production. Two materialisation modes were exercised:

**State A — plain `enrichStage` (synthetic snapshot retained)**

```
validator exit 1, classification=SYNTHETIC_PLUS_REAL_RESULTS
[V3] SYNTHETIC_PLUS_REAL_RESULTS: 1 synthetic snapshot(s) coexist with 18 real
     match(es) carrying 288 result row(s); standings computed over both sources
     would double-count
```

This confirms the existing guard: importing matches without removing the
synthetic snapshot produces a double-count. This state must never be applied.

**State B — `replaceSyntheticSnapshot` (intended end state)**

```
validator exit 0, classification=REAL_COMPLETE
real_match_count=18 synthetic_match_count=0 real_matches_with_results=18
real_result_rows=288 synthetic_result_rows=0
```

- 18 real matches, all with results
- 0 synthetic matches remaining
- 288 real result rows
- 1 `match_sources` provenance row
- **No real match has zero results**

**Idempotency**: a second identical replace on the same copy converged —
`removedSyntheticMatches` went `1 → 0`, and match/result/`match_sources` counts were
identical before and after the second pass.

### Dimensional completeness

The project's completeness definition has two dimensions, reported separately
rather than collapsed into one "complete" verdict:

| Dimension | Status |
|---|---|
| Match-level | **COMPLETE** (18/18 matches, 288/288 result rows) |
| Player-stat | **INCOMPLETE / SOURCE NOT AVAILABLE** |

`REAL_COMPLETE` therefore means match-level complete, not globally complete.

## Cross-source reconciliation

This is a **cross-source** check: a third party's per-match matrix, independently
aggregated, compared against the aggregate already stored in CORE.

| Classification | Count |
|---|---|
| `FIELD_EXACT` | 14 |
| `DISPUTED_SPLIT_TOTAL_AGREES` | 2 |
| `TOTALS_ONLY_AGREE` | 0 |
| `IDENTITY_UNRESOLVED` | 0 |

Note: 14 field-exact rows is **internal consistency between the source and CORE**,
not independent historical verification of either. It shows the parser reproduces
CORE's numbers from the source's raw rows; it does not establish which side is
correct where they differ.

### Disputed rows — `DISPUTED_SPLIT_TOTAL_AGREES`

Total agrees; the kill/placement split differs. Both are `adjudication_status =
UNRESOLVED`. No value has been chosen.

**1. Los Hermanos Esports**

| | Kills | Placement pts | Total |
|---|---|---|---|
| Liquipedia | 77 | 49 | 126 |
| CORE (existing) | 78 | 48 | 126 |

**2. TEAM iNSANE**

| | Kills | Placement pts | Total |
|---|---|---|---|
| Liquipedia | 41 | 17 | 58 |
| CORE (existing) | 40 | 18 | 58 |

Both are aggregate-over-18-matches comparisons. The exact per-match source rows
behind each disputed aggregate are recorded in
`reconciliation.disputed_rows[].source_per_match` in the JSON report, so the
disagreement can be traced to specific matches at the decision gate.

The parser does not normalise, average, or otherwise reconcile these. They pass
through the pipeline as-is and are reported.

## Player statistics

```
player_match_stats = 0
```

Reason:

> Liquipedia source does not publish per-match player statistics for this stage.

Recorded explicitly as `player_match_stats_status = SOURCE_NOT_AVAILABLE`. This is
**not** an extraction failure: the match/result extraction is complete at its own
granularity. No player-level row was fabricated, and no match/result extraction was
blocked waiting for a player-level source.

## Production safety

| Assertion | Result |
|---|---|
| Production modified | **NO** |
| Production main-file hash unchanged | **yes** (`c0f73bc7…2ddf` before and after) |
| Production WAL content unchanged | **yes** |
| Production SHM unchanged | **yes** |
| Synthetic snapshot deleted | **NO** |
| Enrichment applied | **NO** |
| Historical extraction applied | **NO** |
| Production opened read-only only | **yes** |

Tracked DB hash (unchanged, verified after the run):
`md5 85ab7f583faea808bff3e80ff4617120`.

Production was opened read-only solely to resolve team identity (16 teams). All
mutation ran against throwaway copies under the system temp directory. The pilot
script asserts the production hash before/after and exits non-zero on any change.

Note: a read-only open can create a zero-length `-wal` and refresh `-shm` metadata;
this was observed and is reported separately. Main-database bytes — the
authoritative content — were byte-identical.

## Scope boundaries honoured

- Exactly one stage processed (`BMPS 2025 / Grand Finals`); no other stages.
- No bulk historical extraction.
- No `enrich-stage.mjs --apply`.
- No production apply of any kind.
- Disputed rows left unresolved; no VOD or second source consulted.

## Recommendation / next decision gate

The parser → canonical payload → validation path is proven end-to-end on a copy,
including the atomic synthetic replacement and its idempotency. The pipeline is
ready for an apply decision on this single stage.

Before any apply, decide the two disputed splits:

1. accept Liquipedia's split,
2. use a second source,
3. use VOD evidence, or
4. preserve the discrepancy (e.g. record CORE's value and log the source value as
   provenance).

Option 4 is the only one that does not require new evidence and is consistent with
"do not adjudicate without instruction"; options 1–3 need explicit direction.

Also outstanding independently of this pilot: the four stages whose source
coverage is still unresolved (BMIS 2023, BMPS 2023, BMPS 2024,
India-Korea Invitational) — see `tools/reports/phase2-source-recon.md`.
