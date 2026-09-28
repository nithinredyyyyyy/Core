# Phase 3 - Stage Standings Reconstruction & Fixation

**Status:** read-only audit complete. No database writes performed.
**Audited:** committed `server/data/stagecore.sqlite` (md5 `85ab7f583faea808bff3e80ff4617120`)
**Tool:** `tools/liquipedia/audit-stage-standings.mjs` (read-only: `readOnly: true` + `PRAGMA query_only = ON`)
**Machine-readable output:** `tools/reports/phase3-stage-standings-audit.json`

---

## 1. Headline numbers

| Metric | Value |
|---|---|
| Tournaments | 19 |
| Stages | 111 |
| Stages with any standings | 40 |
| `stage_standings` rows | 709 |
| `stage_match_breakdown` rows | **0** |
| Tournaments with standings | 17 of 19 |

---

## 2. Reconstructability coverage matrix

Every stage is classified by what can legitimately rebuild its standings. The
discriminator is not "does the stage have results" but "are those results
per-match or a stage aggregate".

| Class | Stages | Meaning |
|---|---|---|
| **RECONSTRUCTABLE** | 5 | Published per-match results exist; standings can be derived |
| **AGGREGATE_ONLY** | 18 | Only a synthetic cumulative snapshot (`match_number` 0/NULL, `map='Other'`). A stage total, not per-match data |
| **SOURCE_ONLY** | 17 | Standings rows exist with no match results at all; require an authoritative published source |
| **EMPTY** | 71 | Neither standings nor results |

`AGGREGATE_ONLY` is deliberately **not** folded into `RECONSTRUCTABLE`. A synthetic
snapshot is the thing a real extraction replaces; treating it as a reconstruction
source would launder a placeholder into "published match data".

### RECONSTRUCTABLE stages (5)

| Tournament | Stage | Per-match result rows | Rows/match |
|---|---|---|---|
| Peacekeeper Elite League 2026 Summer | Grand Finals | 19 matches / 304 rows | 16 |
| PUBG Mobile Global Championship 2025 | Group Stage | 2 matches / 12 rows | 6 |
| PUBG Mobile Global Championship 2025 | Grand Finals | 1 match / 1 row | 1 |
| PUBG Mobile Global Championship 2025 | Last Chance | 1 match / 9 rows | 9 |
| PUBG Mobile Global Championship 2025 | The Gauntlet | 1 match / 3 rows | 3 |

Only **one** stage (PEL 2026 Grand Finals) is reconstructable at full board
fidelity (19 matches, 16 teams each). The four GPC 2025 stages have results but
partial boards - see `PARTIAL_RESULT_BOARD` below.

### AGGREGATE_ONLY stages (18)

All 8 BGMI Masters Series Season 5 stages, plus the Grand Finals of BMIS 2023/2024/2025/2026,
BMPS 2023/2024/2025, BMIC 2025, BMPS Showdown 2025, and India-Korea Invitational.
Each holds exactly one synthetic snapshot match with a full team board.

### SOURCE_ONLY stages (17)

Standings exist (e.g. BMPS 2026 Semi Finals 24 rows, BMIS 2026 Quarter Finals 40
rows, PMWC 2024/2025/2026 Group Stages) but there are no match results of any kind.
These cannot be reconstructed from CORE data; they need an authoritative published
standings source.

---

## 3. Dispute report

Disputes are **recorded, not resolved**. Nothing below was auto-corrected.

| Code | Count | Severity | Meaning |
|---|---|---|---|
| `ARITHMETIC_CONFLICT` | 161 | medium | `place_points + elim_points <> total_points` with non-zero components |
| `STANDING_WITHOUT_RESULTS` | 55 | high | A standing row on a result-backed stage has no matching result rows |
| `BREAKDOWN_NOT_RECORDED` | 34 | low | Components are zero while total > 0 - no breakdown recorded |
| `SYNTHETIC_COEXISTS_WITH_RESULTS` | 18 | high | Synthetic aggregate present alongside real result rows |
| `STORED_VS_DERIVED_MISMATCH` | 13 | high | Stored standings disagree with standings derived from results |
| `RESULT_ARITHMETIC_CONFLICT` | 12 | high | `placement_points + kill_points <> total_points` in `match_results` |
| `PLACEHOLDER_SHAPED_MATCH_HAS_RESULTS` | 7 | high | **Data-loss hazard** - see below |
| `PARTIAL_RESULT_BOARD` | 3 | medium | Results exist but are too sparse to substantiate a full board |
| `RANK_ORDER_CONFLICT` | 2 | medium | A worse rank carries more points than a better rank |
| `BREAKDOWN_TABLE_EMPTY` | 1 | medium | `stage_match_breakdown` is empty database-wide |

### 3.1 The stored-vs-derived disagreement is systematic, and it is not a sum bug

This is the most important finding. On PEL 2026 Grand Finals - the only stage with
a complete per-match board - stored standings and derived standings agree on
**every component** (`place_points`, `elim_points`) and on wins, but disagree on
`total_points` for 14 of 16 teams:

| Team | Stored place | Derived place | Stored elim | Derived elim | Stored total | Derived total | p+e | Gap |
|---|---|---|---|---|---|---|---|---|
| LGD Gaming | 70 | 70 | 98 | 98 | 172 | 168 | 168 | +4 |
| Weibo Gaming | 41 | 41 | 119 | 119 | 170 | 160 | 160 | +10 |
| Four Angry Men | 53 | 53 | 93 | 93 | 148 | 146 | 146 | +2 |
| Tianba | 49 | 49 | 84 | 84 | 140 | 133 | 133 | +7 |
| JD Gaming | 54 | 54 | 80 | 80 | 134 | 134 | 134 | 0 |

`components_match: true`, `totals_match: false`, gap always **>= 0**.

That pattern rules out the obvious explanations:

- **Not a stale/partial board.** Placement and elimination points would drift too.
- **Not a different match count.** Both sides cover 19 matches; wins agree.
- **Not a per-match arithmetic defect in the aggregate sense.** `placement + kills
  = total` holds inside the individual `match_results` rows (verified per match).

The consistent direction (stored >= derived, never less) and the fact that the
components reconcile exactly while only the total carries an increment suggests
the stored totals include a term that is **not** decomposed into the two stored
components. A per-placement or participation bonus that is folded into
`total_points` upstream would produce exactly this signature.

**This is not resolved and must not be guessed at.** Two candidate readings:

1. The stored `total_points` is authoritative and carries a real scoring
   component the schema has no column for (schema gap, not data error).
2. The stored `total_points` is inflated by a bad import and the derived value is
   correct.

Choosing between them requires the **official PEL 2026 scoring rules** and the
published final standings - not inference from CORE. Recorded as a dispute under
the same discipline as `PRESERVE_DISPUTE_V1`.

### 3.2 `PLACEHOLDER_SHAPED_MATCH_HAS_RESULTS` - an active data-loss hazard

`replaceSyntheticSnapshot` (in `server/services/enrichment.js`) identifies
synthetic matches as:

```sql
WHERE tournament_id = ? AND stage = ? AND (match_number = 0 OR match_number IS NULL)
```

Note this is **broader** than the true synthetic definition used elsewhere (which
also requires `map = 'Other'`). As written, it deletes **every** match with
`match_number = 0 OR NULL`, regardless of map.

Seven groups of matches are `match_number IS NULL` but carry real maps and real
results:

| Tournament | Stage | Map | Matches | Result rows |
|---|---|---|---|---|
| Peacekeeper Elite League 2026 Summer | Grand Finals | Erangel | 6 | 96 |
| Peacekeeper Elite League 2026 Summer | Grand Finals | Miramar | 7 | 112 |
| Peacekeeper Elite League 2026 Summer | Grand Finals | Rondo | 6 | 96 |
| PUBG Mobile Global Championship 2025 | Group Stage | Erangel | 2 | 12 |
| PUBG Mobile Global Championship 2025 | Last Chance | Erangel | 1 | 9 |
| PUBG Mobile Global Championship 2025 | The Gauntlet | Erangel | 1 | 3 |
| PUBG Mobile Global Championship 2025 | Grand Finals | Erangel | 1 | 1 |

**Total at risk: 19 PEL matches (304 result rows) and 5 GPC 2025 matches (25 rows).**

If anyone runs `enrich-stage.mjs --apply --replace-synthetic` against PEL 2026
Grand Finals, it will delete all 19 real matches and their 304 result rows before
inserting the payload. That is silent, transactionally-committed data loss of the
only complete per-match board in the database.

This does not affect the frozen BMPS 2025 GF operation (that stage's 18 real rows
are `match_number >= 1` and its single snapshot is `0`/`Other`). It is a latent
hazard for any future stage apply. **Recommendation: before any future apply,
tighten the delete predicate to include `map = 'Other'`** so the two definitions
of "synthetic" agree. That change is out of scope for this read-only audit and is
not made here.

### 3.3 Arithmetic conflicts

161 stored rows have `place + elim <> total` with non-zero components, and 12
`match_results` rows have `placement + kill <> total`. The 12 result-level rows
concentrate in BGMI Masters Series Season 5 Grand Finals (10) and BMIS 2025 Grand
Finals (2). Note that BGMI Masters S5 is `AGGREGATE_ONLY`, so its "match_results"
rows are aggregate board rows, not per-match data.

34 further rows have both components zero with a non-zero total - consistent with
the empty `stage_match_breakdown` table. Nothing has been adjusted.

### 3.4 Rank order conflicts (2)

| Tournament | Stage | Conflict |
|---|---|---|
| PUBG Mobile Global Championship 2025 | Group Stage | rank 3 = 133 pts, rank 4 = 136 pts |
| PUBG Mobile World Cup 2026 | Group Stage | rank 1 = 107 pts, rank 2 = 108 pts |

A worse rank holds more points in both cases. Could be a tiebreak rule applied
upstream, or a ranking error. Not resolved.

---

## 4. Validation results

| Check | Result |
|---|---|
| Team identity (standings -> teams) | ✅ 0 broken |
| Stage identity (standings -> stages) | ✅ 0 broken |
| Tournament cross-wiring (stage.tournament_id = standing.tournament_id) | ✅ 0 |
| Duplicate team in same board | ✅ 0 |
| Duplicate rank in same board | ✅ 0 |
| Null rank | ✅ 0 |
| `rank < 1` | ✅ 0 |
| `wins > matches_played` | ✅ 0 |
| Rank order monotonicity | ❌ 2 stages |
| Stored component arithmetic | ❌ 161 rows |
| `match_results` arithmetic | ❌ 12 rows |
| Full-board fidelity on reconstructable stages | ⚠️ 1 of 5 |

Identity and uniqueness are clean. The defects are all in **values**, not in
referential structure.

---

## 5. What Phase 3 can and cannot do from CORE alone

- **Can** reconstruct: PEL 2026 Grand Finals (full board), and partially the four
  GPC 2025 stages (thin boards).
- **Can** compare: the 18 `AGGREGATE_ONLY` stages have a stored aggregate board
  that can be checked against a stored snapshot total.
- **Cannot** reconstruct: the 17 `SOURCE_ONLY` stages. No CORE data can produce
  them; they require authoritative published standings.
- **Cannot** adjudicate: the 161 + 13 + 12 value conflicts without external
  scoring rules and published standings.

Fixation (writing corrected standings) is therefore **not** a single mechanical
pass. It splits into: (a) reconstruct from results where a full board exists,
(b) import authoritative standings where it does not, (c) leave disputes
unresolved and recorded.

---

## 6. Next steps (not performed)

1. **Operator decision** on the stored-vs-derived total_points dispute (3.1).
   Requires PEL 2026 official scoring rules. Do not infer.
2. **Operator decision** on the `replaceSyntheticSnapshot` predicate (3.2).
   Recommended before any future stage apply; not part of the BMPS 2025 GF gate.
3. **Source acquisition** for the 17 `SOURCE_ONLY` stages, if they are to be filled.
4. **Dry-run fixation process** - to be built only once 1 and 2 are decided, and
   only against a database copy.

No production database writes were performed. The frozen BMPS 2025 GF gate
(`PR #3` draft, production DB untouched at md5
`85ab7f583faea808bff3e80ff4617120`) is unaffected by this audit.
