# V3 Reconciliation — Synthetic Snapshots vs Real Match Shells

Date: 2026-09-26
Scope: the 9 stages classified `SYNTHETIC_PLUS_EMPTY_SHELLS`
Database: read-only copy of `server/data/stagecore.sqlite`
Method: three-source comparison (DB aggregate / tournament JSON / real match shells)
Primary sources: repository + production DB snapshot only. No external sources.

## What this document does and does not establish

This reconciliation establishes **aggregate-standings-level** agreement between
the synthetic snapshot in `match_results` and the tournament JSON standings, and
it establishes the **structural** consistency of the real match shells.

It does **not** reconstruct any individual match. There is no per-match result
data in the database or the repository for these stages:

- `real_result_rows = 0` for all 9 stages
- `player_match_stats = 0` for all 9 stages

Every stage below is therefore simultaneously:

- `MATCHED` at the aggregate standings level, and
- `NOT MATCH-LEVEL COMPLETE`

These are independent claims. Aggregate agreement must not be read as evidence
that the historical match-by-match data has been verified — it has not, because
it does not exist in the repository.

## How the 9 were identified

The list is derived from the database, not hardcoded. The selection predicate is
the same one the validator uses:

```sql
SELECT m.tournament_id, m.stage
FROM matches m
GROUP BY m.tournament_id, m.stage
HAVING SUM(CASE WHEN m.match_number = 0 OR m.match_number IS NULL THEN 1 ELSE 0 END) > 0
   AND COUNT(DISTINCT CASE WHEN m.match_number >= 1 THEN m.id END) > 0
```

This returns exactly 9 stages, all named `Grand Finals`.

## Field mapping applied

The tournament JSON uses a different vocabulary from the `match_results` schema.
Comparisons use this mapping; a difference in *field name* is not a conflict when
the numeric values correspond:

| Tournament JSON | `match_results` |
|---|---|
| `points` | `total_points` |
| `pos` (position points) | `placement_points` |
| `elimins` (eliminations) | `kill_points` |
| `matches` | `matches_count` |
| `wwcd` | `wins_count` |
| `placement` | `placement` |
| `fullTeam` | `teams.name` (display name) |

## Summary

| Classification | Count |
|---|---|
| MATCHED (aggregate level) | 9 |
| CONFLICTING | 0 |
| UNVERIFIABLE (match level) | 9 |

Every one of the 9 is `MATCHED` at the aggregate level and `UNVERIFIABLE` at the
match level. No stage is `CONFLICTING`.

## Per-stage findings

For all 9 stages the following holds identically:

- `syn = 1` synthetic snapshot match, carrying 16 aggregate result rows
- `real_match_shells = 18`, numbered `match_number` 1..18, no gaps
- `real_matches_with_results = 0`
- `real_result_rows = 0`
- `player_match_stats = 0`

The table below records the distinguishing evidence.

| # | Tournament | Stage | Aggregate recon | Shell consistency | Expected match count | Evidence for expected count |
|---|---|---|---|---|---|---|
| 1 | Battlegrounds Mobile India Series 2025 | Grand Finals | MATCHED (16/16 rows) | CONSISTENT | 18 | JSON summary "18 matches"; 6 matches x 3 days |
| 2 | Battlegrounds Mobile India Series 2026 | Grand Finals | MATCHED (16/16 rows) | CONSISTENT | 18 | JSON summary "18 matches with 6 each day" |
| 3 | India - Korea Invitational | Grand Finals | MATCHED (16/16 rows) | CONSISTENT | 18 | JSON summary "18 matches" |
| 4 | Battlegrounds Mobile India Pro Series 2024 | Grand Finals | MATCHED (16/16 rows) | CONSISTENT | 18 | JSON summary "18 matches" |
| 5 | Battlegrounds Mobile India Pro Series 2025 | Grand Finals | MATCHED (16/16 rows) | CONSISTENT | 18 | JSON summary "18 matches" |
| 6 | Battlegrounds Mobile India Series 2023 | Grand Finals | MATCHED (16/16 rows) | CONSISTENT | 18 | JSON summary "18 matches across 3 matchdays" |
| 7 | Battlegrounds Mobile India Series 2024 | Grand Finals | MATCHED (16/16 rows) | CONSISTENT | 18 | JSON summary "18 matches across 3 matchdays" |
| 8 | Battlegrounds Mobile India Pro Series 2023 | Grand Finals | MATCHED (16/16 rows) | CONSISTENT | 18 | JSON summary "18 matches" |
| 9 | Battlegrounds Mobile India Showdown 2025 | Grand Finals | MATCHED (16/16 rows) | CONSISTENT | 18 | JSON summary "18 matches" |

"16/16 rows" means every one of the 16 teams' aggregate values matched on all five
mapped fields (`total_points`, `placement_points`, `kill_points`, `matches_count`,
`wins_count`), aligned by `placement`. The only naming difference observed is
display-name variance (for example DB `Dplus` vs JSON `Dplus KIA`, DB `Orangutan`
vs JSON `iQOO ORANGUTAN`); these are the same team identity and are not value
conflicts.

### Detailed reconciliation table

| Tournament | Stage | Classification | Syn matches | Syn result rows | Real shells | Real matches w/ results | Real result rows | Player-match rows | JSON standings rows | DB aggregate rows | Aggregate recon | Shell consistency | Known limitations |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Battlegrounds Mobile India Series 2025 | Grand Finals | MATCHED / UNVERIFIABLE at match level | 1 | 16 | 18 | 0 | 0 | 0 | 16 | 16 | MATCHED | CONSISTENT | No per-match data; expected count from JSON only |
| Battlegrounds Mobile India Series 2026 | Grand Finals | MATCHED / UNVERIFIABLE at match level | 1 | 16 | 18 | 0 | 0 | 0 | 16 | 16 | MATCHED | CONSISTENT | No per-match data; expected count from JSON only |
| India - Korea Invitational | Grand Finals | MATCHED / UNVERIFIABLE at match level | 1 | 16 | 18 | 0 | 0 | 0 | 16 | 16 | MATCHED | CONSISTENT | No per-match data; expected count from JSON only |
| Battlegrounds Mobile India Pro Series 2024 | Grand Finals | MATCHED / UNVERIFIABLE at match level | 1 | 16 | 18 | 0 | 0 | 0 | 16 | 16 | MATCHED | CONSISTENT | No per-match data; expected count from JSON only |
| Battlegrounds Mobile India Pro Series 2025 | Grand Finals | MATCHED / UNVERIFIABLE at match level | 1 | 16 | 18 | 0 | 0 | 0 | 16 | 16 | MATCHED | CONSISTENT | No per-match data; expected count from JSON only |
| Battlegrounds Mobile India Series 2023 | Grand Finals | MATCHED / UNVERIFIABLE at match level | 1 | 16 | 18 | 0 | 0 | 0 | 16 | 16 | MATCHED | CONSISTENT | No per-match data; expected count from JSON only |
| Battlegrounds Mobile India Series 2024 | Grand Finals | MATCHED / UNVERIFIABLE at match level | 1 | 16 | 18 | 0 | 0 | 0 | 16 | 16 | MATCHED | CONSISTENT | No per-match data; expected count from JSON only |
| Battlegrounds Mobile India Pro Series 2023 | Grand Finals | MATCHED / UNVERIFIABLE at match level | 1 | 16 | 18 | 0 | 0 | 0 | 16 | 16 | MATCHED | CONSISTENT | No per-match data; expected count from JSON only |
| Battlegrounds Mobile India Showdown 2025 | Grand Finals | MATCHED / UNVERIFIABLE at match level | 1 | 16 | 18 | 0 | 0 | 0 | 16 | 16 | MATCHED | CONSISTENT | No per-match data; expected count from JSON only |

## Match shell analysis

All 9 stages share an identical shell shape:

- `status = completed` on every shell
- `day` populated as 1, 2, 3 — six matches per day
- `group_name = NULL` on every shell (Grand Finals is ungrouped; consistent with
  `stage_type = grand_finals`, which suppresses group derivation)
- `scheduled_time` values cluster on three calendar days
- no shell carries `match_results` or `player_match_stats`

Map distribution per stage (every shell has a non-null `map`):

| Tournament | Map distribution |
|---|---|
| BMIS 2025 | Erangel 9, Miramar 6, Sanhok 3 |
| BMIS 2026 | Erangel 9, Miramar 6, Rondo 3 |
| India - Korea Invitational | Erangel 7, Miramar 7, Sanhok 4 |
| BMPS 2024 | Erangel 9, Miramar 6, Sanhok 3 |
| BMPS 2025 | Erangel 9, Miramar 6, Sanhok 3 |
| BMIS 2023 | Erangel 9, Miramar 6, Sanhok 3 |
| BMIS 2024 | Erangel 6, Miramar 6, Sanhok 3, Vikendi 3 |
| BMPS 2023 | Erangel 9, Miramar 6, Sanhok 3 |
| BMISD 2025 | Erangel 9, Miramar 6, Rondo 3 |

## Expected match count

For every stage, `expected_match_count = 18`, and the evidence is stated rather
than assumed:

1. The tournament's own embedded stage JSON summary states the match count in
   prose ("16 teams played 18 matches"), and
2. the shell set contains exactly `match_number` 1..18 with no gaps, and
3. the `day` field partitions those 18 shells as 6/6/6 across three days.

This value is `18`, not `19`. The `19` in `server/seed/goldenFixture.js` is a
**fixture** shape (a 19-map GF used for structural testing of the enrichment
pipeline) and is not evidence about any production stage. These 9 stages must not
be conformed to the fixture's 19.

## Per-stage evidence detail

### 1. Battlegrounds Mobile India Series 2025
- JSON summary: "Apr 25th - 27th, 2025 at Biswa Bangla Mela Prangan, Kolkata. 16 teams played 18 matches, with Team Versatile winning the title on 169 total points."
- Aggregate #1: DB `Team Versatile` tp=169 pp=68 kp=101 mp=18 w=3 = JSON `points=169 pos=68 elimins=101 matches=18 wwcd=3`
- Shell days: 2025-04-25 / 26 / 27, six each

### 2. Battlegrounds Mobile India Series 2026
- JSON summary: "Grand Finals: Mar 27th - 29th, 2026 at Chennai Trade Centre, Chennai. 16 teams, 3 matchdays, and 18 matches with 6 each day. 8 teams qualified from Semi Finals and 8 from Survival Stage, with IQOO SouL winning the title on 173 points."
- Aggregate #1: DB `iQOO SouL` tp=173 pp=54 kp=119 mp=18 w=2 = JSON `points=173 pos=54 elimins=119 matches=18 wwcd=2`
- Shell days: 2026-03-27 / 28 / 29, six each

### 3. India - Korea Invitational
- JSON summary: "Oct 26th - 28th, 2023. 16 teams played across 3 matchdays and 18 matches, featuring 8 teams from Korea Pro Series Season 3 and the top 8 teams from India Series 2023."
- Aggregate #1: DB `Dplus` tp=217 pp=125 kp=92 mp=18 w=5 = JSON `Dplus KIA points=217 pos=125 elimins=92 matches=18 wwcd=5`
- Shell days: 2023-10-26 / 27 / 28, six each
- Note: DB team name `Dplus` differs from JSON display name `Dplus KIA`; same team identity, cosmetic only.

### 4. Battlegrounds Mobile India Pro Series 2024
- JSON summary: "Sept 27th - 29th, 2024 at Adlux International Convention Centre, Kochi. 16 teams competed across 18 matches, with Team XSpark claiming the championship on 158 total points."
- Aggregate #1: DB `TeamXSpark` tp=158 pp=56 kp=102 mp=18 w=4 = JSON `Team XSpark points=158 pos=56 elimins=102 matches=18 wwcd=4`
- Shell days: 2024-09-27 / 28 / 29, six each

### 5. Battlegrounds Mobile India Pro Series 2025
- JSON summary: "July 4th - July 6th, 2025 at Yashobhoomi Convention Centre, Delhi. 16 teams played 18 matches, with Aryan x TMG Gaming winning the championship on 136 total points."
- Aggregate #1: DB `Aryan x TMG Gaming` tp=136 pp=57 kp=79 mp=18 w=3 = JSON `points=136 pos=57 elimins=79 matches=18 wwcd=3`
- Shell days: 2025-07-04 / 05 / 06, six each

### 6. Battlegrounds Mobile India Series 2023
- JSON summary: "Oct 12th - 13th and 15th, 2023 at Sardar Vallabhbhai Patel Indoor Stadium, Mumbai. 16 finalists played 18 matches across 3 matchdays, with Gladiators Esports winning the title on 200 points."
- Aggregate #1: DB `Gladiators Esports` tp=200 pp=96 kp=104 mp=18 w=0 = JSON `points=200 pos=96 elimins=104 matches=18 wwcd=0`
- Shell days: 2023-10-12 / 13 / 15, six each

### 7. Battlegrounds Mobile India Series 2024
- JSON summary: "June 28th - 30th, 2024 at Hitex Exhibition Center, Hyderabad. 16 teams played 18 matches across 3 matchdays, with TeamXSpark winning the title on 142 total points."
- Aggregate #1: DB `TeamXSpark` tp=142 pp=42 kp=100 mp=18 w=1 = JSON `Team X Spark points=142 pos=42 elimins=100 matches=18 wwcd=1`
- Shell days: 2024-06-28 / 29 / 30, six each

### 8. Battlegrounds Mobile India Pro Series 2023
- JSON summary: "Dec 15th - 17th, 2023. 16 teams competed across 18 matches, with Blind eSports winning the title on 249 total points."
- Aggregate #1: DB `Blind eSports` tp=249 pp=128 kp=121 mp=18 w=3 = JSON `points=249 pos=128 elimins=121 matches=18 wwcd=3`
- Shell days: 2023-12-15 / 16 / 17, six each

### 9. Battlegrounds Mobile India Showdown 2025
- JSON summary: "October 10th - 12th, 2025. 16 teams played 18 matches, with Orangutan winning the title on 147 total points."
- Aggregate #1: DB `Orangutan` tp=147 pp=55 kp=92 mp=18 w=4 = JSON `iQOO ORANGUTAN points=147 pos=55 elimins=92 matches=18 wwcd=4`
- Shell days: 2025-10-10 / 11 / 12, six each

## Separate item — BMIS 2026 non-Grand-Finals stages

Two stages in `Battlegrounds Mobile India Series 2026` are classified
`REAL_MATCHES_NO_RESULTS`. They are distinct from the 9 above: they have real
shells but **no** synthetic snapshot, so they are not part of the
synthetic-plus-shell set.

| Stage | real_match_count | synthetic_match_count | real_result_rows | synthetic_result_rows | classification |
|---|---|---|---|---|---|
| Semi Finals | 24 | 0 | 0 | 0 | REAL_MATCHES_NO_RESULTS |
| Survival Stage | 12 | 0 | 0 | 0 | REAL_MATCHES_NO_RESULTS |

Neither stage has an aggregate snapshot. Confirmed and left untouched.

## Action taken

None. No rows were deleted or modified. No `enrich-stage.mjs --apply` was run.
The synthetic snapshots remain in place. No production write of any kind
occurred during this analysis.

## Recommended next step

The 9 stages are internally consistent at the aggregate level and are marked
`NOT MATCH-LEVEL COMPLETE`. The synthetic snapshot is a derived duplicate of data
already present in the tournament JSON, so it is the natural candidate for
replacement — but only in the same transaction that inserts source-backed
per-match results, per the standing rule.

Because no per-match source exists in the repository, advancing these stages
requires externally sourced match-by-match data. That is out of scope for this
phase and must be supplied before any extraction is attempted.
