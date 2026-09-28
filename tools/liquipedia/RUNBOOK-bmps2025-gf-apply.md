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

- The real production database path. It must resolve to the Render Persistent
  Disk mount: `/app/server/data/stagecore.sqlite`. Do **not** point `--db` at the
  committed `server/data/stagecore.sqlite`; that blob is not the runtime store and
  predates the provenance migrations.
- A byte-exact pre-apply copy of the live database, kept as the rollback and as
  the `--baseline` for the audit.
- `CORE_AUTH_SESSION_SECRET` and other production env present for the app, though
  the apply itself is a standalone script.

### Target guard (abort condition)

Both `emit-payload.mjs` and `post-apply-audit.mjs` refuse to run unless `--db`
resolves to `/app/server/data/stagecore.sqlite`, or unless an explicit
`--rehearsal` override is passed. A stale or exported `CORE_DB_PATH` — for example
a leftover `/tmp/tmp.*/f.sqlite` — is refused hard:

```
Refusing to operate on an unexpected database target: /tmp/tmp.I83UrALzaG/f.sqlite
  reason: target is in a throwaway location, never production; pass --rehearsal for an intentional copy
  expected: /app/server/data/stagecore.sqlite
  observed: CORE_DB_PATH=/tmp/tmp.I83UrALzaG/f.sqlite
```

Exit code `3` on refusal. This is intentional: an apply that silently lands in a
throwaway file reports success against the wrong database, which is worse than a
hard stop. On the production host, `--db /app/server/data/stagecore.sqlite` (or
`CORE_DB_PATH` already pointing there) is the expected invocation, with no
`--rehearsal`.

## Procedure

### 1. Back up the live database

```bash
cp /app/server/data/stagecore.sqlite <backup-dir>/stagecore.pre-apply.sqlite
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

On the production host (no `--rehearsal`):

```bash
node tools/liquipedia/emit-payload.mjs \
  --db /app/server/data/stagecore.sqlite \
  --out tools/reports/phase2-bmps2025-gf-payload.json
```

The emitter reads team identity and existing match rows read-only, reconciles the
source aggregate against the existing CORE snapshot, classifies map differences
against the approved decision record, and writes the payload in the exact shape
`enrich-stage.mjs` consumes. Expect:

```
Matches:     18
Results:     288
Player rows: 0 (SOURCE_NOT_AVAILABLE)
Consistent:  true
Disputes:    2 under PRESERVE_DISPUTE_V1

Map reconciliation (PRESERVE_SOURCE_V1): 3 approved correction(s)
  SOURCE_CORRECTION  m4 map: Erangel -> Sanhok  [PRESERVE_SOURCE_V1]
  SOURCE_CORRECTION  m10 map: Erangel -> Sanhok  [PRESERVE_SOURCE_V1]
  SOURCE_CORRECTION  m16 map: Erangel -> Sanhok  [PRESERVE_SOURCE_V1]
  (15 match maps unchanged)
```

**Review the map reconciliation before continuing.** If it reports
`UNAPPROVED source differences`, the emitter exits non-zero: a difference exists
that the decision record does not cover. Stop and get an explicit decision; do not
apply.

### 4. Dry run

```bash
node tools/enrich-stage.mjs \
  --file tools/reports/phase2-bmps2025-gf-payload.json
```

`CORE_DB_PATH` must already point at the persistent disk. Expect
`Dry run validated the payload; rolled back with no writes.` A non-zero exit or a
thrown error stops the procedure.

### 5. Apply

```bash
node tools/enrich-stage.mjs \
  --file tools/reports/phase2-bmps2025-gf-payload.json \
  --apply --replace-synthetic
```

`CORE_DB_PATH` must already point at the persistent disk (the guard applies here
too). Expect `removedSyntheticMatches: 1`, `matches: 18`, `results: 288`,
`playerStats: 0`. The replacement is one transaction: either all of it lands or
none of it does.

### 6. Post-apply audit

```bash
node tools/liquipedia/post-apply-audit.mjs \
  --db /app/server/data/stagecore.sqlite \
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
python3 tools/liquipedia/stage-signature.py /app/server/data/stagecore.sqlite   # before
node tools/enrich-stage.mjs ... --apply --replace-synthetic
python3 tools/liquipedia/stage-signature.py /app/server/data/stagecore.sqlite   # after: must match
```

If the signature changed, stop and roll back from the step 1 backup.

## Production gate

The approved order of operations. Each step must complete cleanly before the next:

```
source extraction
  -> map reconciliation approved   (emit-payload.mjs: 3 SOURCE_CORRECTION, 0 UNAPPROVED)
  -> dry run                       (enrich-stage.mjs, rolls back)
  -> backup                        (byte-identical copy, verified)
  -> production apply              (enrich-stage.mjs --apply --replace-synthetic, on the Render disk)
  -> post-apply audit              (exit 0)
```

The production operation happens against the actual Render Persistent Disk, never
the repository DB, and never a `/tmp` copy except under an explicit `--rehearsal`.

Structural result: **19 pre-apply matches -> 18 real matches + 1 synthetic
aggregate -> remove only the synthetic aggregate -> 18 populated real matches /
288 results.** Net match-count change is `-1`, not `-19`.

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
| Emit + map reconciliation | 3 `SOURCE_CORRECTION`, 0 `UNAPPROVED` |
| Dry run (no writes) | pass |
| Apply summary | `removedSyntheticMatches: 1`, 18 matches, 288 results, 0 player stats |
| Post-apply audit with baseline | 21/21 |
| Second apply | `removedSyntheticMatches: 0`, signature unchanged |
| m4/m10/m16 after apply | Sanhok (source correction applied) |
| Matches outside the stage | 221 → 221 (untouched) |
| `integrity_check` / FK | `ok` / 0 violations |

Stage signature before second apply = after second apply
(`7b477b813ba2d4d459ed486556b8a38add759da57c42191b284939d27c64577c`).

The unapproved-difference tripwire was also exercised: tampering a non-approved
match map in the copy caused the emitter to print `UNAPPROVED_SOURCE_DIFFERS` and
exit `3`, refusing to produce a safe payload.

### Guard verified against the CI environment, not only the dev container

The guard tests initially passed locally but failed in CI (5 tests, exit 1) because
they created temp dirs under `/workspace`, which exists in the dev container but not
on the GitHub runner. That is a real finding: a guard tested only where it happens
to be convenient is not tested. The fix moved the tests onto `/tmp` and added an
explicit forbidden-prefix seam, and the default `/tmp` rule is still exercised
directly by the stale-path and override tests. CI is now green on the guard:

```
secret-scan -> success
build       -> success
```

The guard was additionally confirmed to refuse a production attempt from an
environment where `/app/server/data/stagecore.sqlite` does not exist:

```
Refusing to operate on an unexpected database target: /app/server/data/stagecore.sqlite
  reason: database file does not exist
  expected: /app/server/data/stagecore.sqlite
```

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

### 2. The apply changes three map values on existing rows (decided)

| Match | CORE placeholder | Source (Liquipedia) | Decision |
|---|---|---|---|
| 4 | Erangel | **Sanhok** | accept source |
| 10 | Erangel | **Sanhok** | accept source |
| 16 | Erangel | **Sanhok** | accept source |

**Decision (operator, 2026-09-26): preserve the source correction.** The CORE rows
are pre-extraction placeholders carrying Erangel; the source explicitly publishes
Sanhok for these matches; the extraction replaces the placeholder representation
with source-backed match data, so the source-backed value belongs in the canonical
record.

This is **not a general "Liquipedia always wins" rule.** It is a per-pilot decision
record in `tools/liquipedia/source-correction-policy.mjs`
(`PRESERVE_SOURCE_V1`), naming exactly `m4:map`, `m10:map`, `m16:map`. Anything
not on that list is surfaced as `UNAPPROVED_SOURCE_DIFFERS` and refuses the apply.
The three changes are printed by the emitter before any apply
(`SOURCE_CORRECTION m4 map: Erangel -> Sanhok [PRESERVE_SOURCE_V1]`, etc.), so they
are auditable rather than silent.

### 3. Dispute metadata stays an artifact for this pilot (decided)

`enrichStage`/`replaceSyntheticSnapshot` persist matches, results, and
`match_sources` provenance. They do **not** persist `dispute_policy`,
`team_aggregates`, or the reconciliation rows — those exist only in the emitted
payload JSON, because `matches` and `match_results` have no columns for them.

So "team-level `PRESERVE_DISPUTE_V1` metadata retained" cannot be satisfied as a
database property today. It is satisfied as **retained in the committed payload
artifact** (`tools/reports/phase2-bmps2025-gf-payload.json`, `_metadata.dispute_policy`).

**Decision (operator, 2026-09-26): keep it as an artifact for this pilot.** Do not
add a migration solely to persist dispute metadata. The existing schema is not
designed to hold `team_aggregates`/policy metadata, and a migration now would
expand the pilot's scope. The committed artifact retains the canonical source
values in `match_results` (the DB), plus `DISPUTED_SPLIT_TOTAL_AGREES`,
`PRESERVE_DISPUTE_V1`, the existing CORE values, and the adjudication state (the
artifact). The database itself holds the canonical imported match/result data and
normal provenance fields, not an improvised metadata structure.

If reconciliation history later needs to be queryable from CORE, design a
dedicated provenance/reconciliation schema separately rather than squeezing it
into the current tables.

### 4. `player_match_stats` absence is implicit, not recorded

The source does not publish per-match player data, so the apply writes zero rows.
Nothing in the database records "absent" versus "not yet imported" — the
distinction lives only in the payload metadata
(`player_match_stats_status: SOURCE_NOT_AVAILABLE`). The audit checks the count is
zero; it cannot check provenance of the absence.

## Do not do these things

- Do not manually delete the synthetic row. `replaceSyntheticSnapshot` removes it
  atomically as part of the apply; deleting it by hand leaves the stage in a state
  the completeness gate (V3) flags.
- Do not apply against the committed `server/data/stagecore.sqlite`. It is not the
  runtime store and predates the provenance migrations.
- Do not bypass the target guard.
- Do not use `--rehearsal` as a way around the production-target check. It exists
  only for an intentional copy, never for the real disk.
- Do not add player statistics from inference. The source publishes none; the
  absence is recorded, not filled.
- Do not resolve the disputed kill/placement splits (los hermanos esports, team
  insane) without new evidence. `PRESERVE_DISPUTE_V1` leaves them unresolved by
  design.
- Do not process the four unresolved stages (BMIS 2023, BMPS 2023, BMPS 2024,
  India-Korea Invitational) as part of this operation.
- Do not merge PR #3 before the production result has been reviewed.


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
