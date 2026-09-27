# BMPS 2025 Grand Finals — production apply runbook

Phase 2 single-stage pilot. This document is the operator procedure for applying
the extracted BMPS 2025 Grand Finals data to the production database, plus the
post-apply acceptance audit.

The apply has **not** been run against production from the development
environment. The real store is the Render Persistent Disk
(`/app/server/data/stagecore.sqlite`, per `render.yaml`), which is not reachable
here. Everything below was rehearsed against a fresh-bootstrapped, production-shaped
database — see "Rehearsal evidence".

## Scope

One stage: **Battlegrounds Mobile India Pro Series 2025 → Grand Finals**.

| | |
|---|---|
| Tournament id | `843e95ec-51ab-4cff-8b1d-ceb5ebfcce1c` |
| Stage | `Grand Finals` |
| Expected matches | 18 (`match_number` 1–18) |
| Expected teams per match | 16 |
| Expected result rows | 288 |
| Expected synthetic rows after apply | 0 |
| Player match stats | 0 — `SOURCE_NOT_AVAILABLE` |
| Dispute policy | `PRESERVE_DISPUTE_V1` |

## Prerequisites

- The real production database path. Do **not** point `--db` at the committed
  `server/data/stagecore.sqlite`; that blob is not the runtime store and predates
  the provenance migrations.
- A byte-exact pre-apply copy of the live database, kept as the rollback and as
  the `--baseline` for the audit.
- `CORE_AUTH_SESSION_SECRET` and other production env present for the app, though
  the apply itself is a standalone script.

## Procedure

### 1. Back up the live database

```bash
cp <live>/stagecore.sqlite <backup-dir>/stagecore.pre-apply.sqlite
sha256sum <backup-dir>/stagecore.pre-apply.sqlite
```

Confirm the backup is byte-identical to the source before proceeding. This copy is
both the rollback point and the audit baseline.

### 2. Confirm persistence/backup health

Check the off-box backup is current before mutating the primary store:

```bash
curl -H "Cookie: stagecore_auth_token=<admin>" https://<host>/api/admin/backup-status
```

`lastSuccessAt` should be recent and `consecutiveFailures` below the threshold. Do
not apply over a failing backup.

### 3. Emit the payload

```bash
node tools/liquipedia/emit-payload.mjs \
  --db <live>/stagecore.sqlite \
  --out tools/reports/phase2-bmps2025-gf-payload.json
```

The emitter reads team identity read-only, reconciles the source aggregate against
the existing CORE snapshot, and writes the payload in the exact shape
`enrich-stage.mjs` consumes. Expect:

```
Matches:     18
Results:     288
Player rows: 0 (SOURCE_NOT_AVAILABLE)
Consistent:  true
Disputes:    2 under PRESERVE_DISPUTE_V1
```

### 4. Dry run

```bash
CORE_DB_PATH=<live>/stagecore.sqlite \
  node tools/enrich-stage.mjs --file tools/reports/phase2-bmps2025-gf-payload.json
```

Expect `Dry run validated the payload; rolled back with no writes.` A non-zero exit
or a thrown error stops the procedure.

### 5. Apply

```bash
CORE_DB_PATH=<live>/stagecore.sqlite \
  node tools/enrich-stage.mjs \
    --file tools/reports/phase2-bmps2025-gf-payload.json \
    --apply --replace-synthetic
```

Expect `removedSyntheticMatches: 1`, `matches: 18`, `results: 288`,
`playerStats: 0`. The replacement is one transaction: either all of it lands or
none of it does.

### 6. Post-apply audit

```bash
node tools/liquipedia/post-apply-audit.mjs \
  --db <live>/stagecore.sqlite \
  --baseline <backup-dir>/stagecore.pre-apply.sqlite \
  --json tools/reports/phase2-bmps2025-gf-post-apply-audit.json
```

Read-only (`readonly: true` + `PRAGMA query_only = ON`). Exit 0 means every
acceptance criterion passed. The `--baseline` flag additionally proves the change
was confined to this stage.

### 7. Idempotency check

Re-run step 5 and confirm the second apply reports `removedSyntheticMatches: 0` and
that the stage signature is unchanged:

```bash
python3 tools/liquipedia/stage-signature.py <live>/stagecore.sqlite   # before
node tools/enrich-stage.mjs ... --apply --replace-synthetic
python3 tools/liquipedia/stage-signature.py <live>/stagecore.sqlite   # after — must match
```

If the signature changed, stop and roll back from the step 1 backup.

## Acceptance criteria

The audit implements each of these as a named check:

| Criterion | Check id |
|---|---|
| synthetic aggregate: 0 | `synthetic_aggregate_zero` |
| real matches: 18 | `real_match_count_18` |
| match numbers 1–18 | `match_numbers_1_to_18` |
| result rows: 288 | `result_rows_288` |
| 16 teams per match | `teams_per_match_16` |
| zero real matches without results | `no_real_match_without_results` |
| zero duplicate (match_id, team_id) | `no_duplicate_match_team` |
| zero canonical arithmetic violations | `canonical_arithmetic_ok` |
| provenance present | `provenance_present`, `match_sources_recorded` |
| player_match_stats = 0 / `SOURCE_NOT_AVAILABLE` | `player_match_stats_zero` |
| no unrelated stage/tournament changes | `no_other_match_touched`, `stage_match_delta_expected`, `stage_result_delta_expected` |
| DB health | `integrity_check_ok`, `no_foreign_key_violations` |

**Do not proceed on any FAIL.** Roll back from the step 1 backup.

## Rehearsal evidence

Rehearsed against a fresh database built from
`server/seed/canonical.export.json` (the reproducible bootstrap baseline), which
carries the same tournament id and the same pre-apply shape as production.

| Check | Result |
|---|---|
| Dry run (no writes) | pass |
| Apply summary | `removedSyntheticMatches: 1`, 18 matches, 288 results, 0 player stats |
| Post-apply audit, no baseline | 17/17 |
| Post-apply audit with baseline | 21/21 |
| Second apply | `removedSyntheticMatches: 0`, signature unchanged |
| Matches outside the stage | 221 → 221 (untouched) |
| `integrity_check` / FK | `ok` / 0 violations |

Stage signature before second apply = after second apply
(`7b477b813ba2d4d459ed486556b8a38add759da57c42191b284939d27c64577c`).

## Things the operator must know before applying

These surfaced during rehearsal and are not obvious from the acceptance criteria.

### 1. Production is not "synthetic only" — it already has 18 real match rows

The pre-apply stage is **19 matches**: one synthetic aggregate (`match_number = 0`)
**and** 18 real placeholder rows (`match_number` 1–18) that carry **zero result
rows**. `replaceSyntheticSnapshot` removes only the synthetic aggregate. The 18
real rows are matched by `(tournament_id, stage, match_number)` and **updated in
place**, then given their 288 result rows.

Net match-count movement is therefore `-1`, not `-19`. The audit expects exactly
that (`stage_match_delta_expected`). The 18 placeholder rows are pre-existing
CORE data, not something this import creates.

### 2. The apply changes three map values on existing rows

| Match | CORE placeholder | Source (Liquipedia) |
|---|---|---|
| 4 | Erangel | **Sanhok** |
| 10 | Erangel | **Sanhok** |
| 16 | Erangel | **Sanhok** |

The source explicitly publishes Sanhok for these three
(`|map4={{Map|...|map=Sanhok}}` etc. in the fixture), so the source values are the
better-evidenced ones. But this is an **overwrite of existing CORE values that the
dispute policy does not cover**: `PRESERVE_DISPUTE_V1` classifies team-aggregate
kill/placement splits, not per-match map identity. Decide explicitly whether the
apply should correct maps before running it. If maps must be preserved, do not
apply — the enrichment service has no per-field "source wins except maps" mode.

### 3. Dispute metadata is an artifact, not a database column

`enrichStage`/`replaceSyntheticSnapshot` persist matches, results, and
`match_sources` provenance. They do **not** persist `dispute_policy`,
`team_aggregates`, or the reconciliation rows — those exist only in the emitted
payload JSON, because `matches` and `match_results` have no columns for them.

So "team-level `PRESERVE_DISPUTE_V1` metadata retained" cannot be satisfied as a
database property today. It is satisfied as **retained in the committed payload
artifact** (`tools/reports/phase2-bmps2025-gf-payload.json`, `_metadata.dispute_policy`).
If it must live in the database, that needs a schema migration and an enrichment
change — out of scope for this pilot and not something to fake.

### 4. `player_match_stats` absence is implicit, not recorded

The source does not publish per-match player data, so the apply writes zero rows.
Nothing in the database records "absent" versus "not yet imported" — the
distinction lives only in the payload metadata
(`player_match_stats_status: SOURCE_NOT_AVAILABLE`). The audit checks the count is
zero; it cannot check provenance of the absence.

## Rollback

```bash
cp <backup-dir>/stagecore.pre-apply.sqlite <live>/stagecore.sqlite
```

Remove any `-wal`/`-shm` sidecars for the target first, then restore. Verify with
`PRAGMA integrity_check` and re-run the audit to confirm the pre-apply shape.
There is no automatic rollback; this is manual by design.

## Out of scope

The four stages with unresolved source coverage — BMIS 2023, BMPS 2023, BMPS 2024,
India-Korea Invitational — are tracked separately in
`tools/reports/phase2-source-recon.md` and must not be pulled into this apply.

The parser's non-zero `startingpoints` carry-over branch is unit-tested but not
exercised by real BMPS 2025 data (the stage publishes no `startingpoints`). The
first future stage that publishes them needs explicit arithmetic validation before
being trusted at scale.
