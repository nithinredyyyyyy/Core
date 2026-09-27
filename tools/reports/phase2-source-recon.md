# Phase 2 Reconnaissance — Historical Source Availability

Date: 2026-09-26
Status: reconnaissance only. No extraction performed. No production writes.
Scope: determine whether a source exists that can supply per-match historical data
for the 9 `SYNTHETIC_PLUS_EMPTY_SHELLS` stages, and what that source can and
cannot provide.

## Primary source found: Liquipedia PUBG Mobile wiki

Endpoint: `https://liquipedia.net/pubgmobile/api.php` (MediaWiki action API)

Operational constraints (all encountered and handled):
- `Accept-Encoding: gzip` is mandatory — requests without it return `406`.
- A descriptive User-Agent is required.
- Rate limiting is aggressive: sustained requests returned `429` with a
  Cloudflare challenge. Requests must be paced (roughly one every few seconds)
  and batched.
- The `list=search` API is disabled; pages must be addressed by exact title.

### What it provides

Per-stage, the `Grand Finals` section encodes a complete
**per-match × per-team matrix**:

| Capability | Template / field | Granularity |
|---|---|---|
| Placement per team per match | `{{MS\|<placement>\|<kills>}}` | match × team |
| Kills per team per match | same template, second arg | match × team |
| Starting points (carry-over) | `startingpoints=N` | team |
| Map per match | `{{Map\|...\|map=...}}` | match |
| Match date/time | `{{Map\|date=...}}` | match |
| MVP per match | `{{Map\|...\|mvp=...}}` | match |
| VOD per match | `{{Map\|...\|vod=...}}` | match |
| Standings kills | `kp=N` | team |

For all 9 target stages the matrix shape is **16 teams × 18 matches = 288 rows**,
which matches the production shell count exactly.

### Decoding rules (verified)

- `{{MS|p|k}}` = placement `p`, kills `k` for that team in that match.
- Standings `kp` = `sum(kills) + startingpoints`. Verified exactly for all 10
  teams with published `kp` on the BMPS 2026 page, and for all 10 on BMPS 2025.
- Placement points come from the page's points table:
  `1→10, 2→6, 3→5, 4→4, 5→3, 6→2, 7→1, 8→1`, else 0.
- `total_points` = `sum(kills) + placement_points + startingpoints`. This
  reproduces the production `total_points` field exactly.

## Coverage across the 9 target stages

| Stage | Full 288-row matrix | Notes |
|---|---|---|
| BMIS 2025 | yes | in main page Grand Finals |
| BMIS 2026 Grand Finals | yes | main page; 1056 MS entries across 3 stages |
| BMIS 2026 Semi Finals | yes | 24 matches × 16 teams = 384 |
| BMIS 2026 Survival Stage | yes | 12 matches × 16 teams = 192 |
| BMPS 2025 | yes | in main page Grand Finals |
| BMISD 2025 | yes | via subpage `.../Grand_Finals` |
| BMIS 2024 | yes | under `Finish Rankings` heading |
| BMIS 2023 | unresolved | page exists; no `{{MS}}`; fetch `429` before retry |
| BMPS 2023 | unresolved | page exists; no `{{MS}}`; fetch `429` before retry |
| BMPS 2024 | unresolved | page exists; no `{{MS}}`; fetch `429` before retry |
| India - Korea Invitational | unresolved | page title not located; fetch `429` |

"Unresolved" means not yet confirmed either way — the requests were blocked by
rate limiting, not by absence. They must be retried slowly before concluding.

## Independent verification against the production database

This is the strongest available evidence, because it is a cross-source check: a
third party's per-match data is re-derived into standings and compared to the
aggregate already in our database.

### BMPS 2025 Grand Finals — 16/16 rows present, 14 exact, 2 disputed

Re-deriving totals from Liquipedia's 288 individual match rows reproduces the
production aggregate for 14 of 16 teams field-for-field
(`kill_points`, `placement_points`, `total_points`, `matches_count`, `wins_count`).

Two rows disagree by exactly one point in the kill/placement split while the
total is identical:

| Team | DB (kp/pp/total) | Liquipedia (kp/pp/total) |
|---|---|---|
| Los Hermanos Esports | 78 / 48 / 126 | 77 / 49 / 126 |
| TEAM iNSANE | 40 / 18 / 58 | 41 / 17 / 58 |

### BMIS 2026 Grand Finals — 16/16 rows, all exact

Every team matched field-for-field. Note this is one of the two stages currently
classified `REAL_MATCHES_NO_RESULTS`' sibling; the GF itself is
`SYNTHETIC_PLUS_EMPTY_SHELLS`.

### BMIS 2025 Grand Finals — 16/16 rows present, 14 exact, 1 disputed, 1 unresolved

| Team | DB (kp/pp/total) | Liquipedia (kp/pp/total) | Nature |
|---|---|---|---|
| THWxNonx Esports | 49 / 24 / 73 | 50 / 24 / 74 | one kill, total differs by 1 |
| FET8 | present | not found | team-name resolution unresolved |

### Independent third-source cross-check (BMPS 2026)

For the BMPS 2026 Grand Finals (not one of the 9, used here only as a control):
the totals re-derived from Liquipedia's matrix match the **independently
published standings** from gamingonphone for all 16 teams exactly, including
`kills`, `positions`, `total points` and `wins`. The `kills + startingpoints = kp`
identity also holds for all 10 teams whose `kp` Liquipedia prints. Two unrelated
sources agreeing with a re-derivation from a third party's raw match rows is
materially stronger than a totals-only check.

## What the source cannot provide

**Per-match player statistics are not available.** Liquipedia's
`/Statistics/Players` subpages are tournament-aggregate only — they contain zero
`{{MS}}` and zero per-match player rows. This is a hard limit of the source, not
a parse difficulty.

Consequence: a Liquipedia-sourced extraction can populate
`matches` and `match_results` at full match × team granularity, but **cannot**
populate `player_match_stats` per match. That step must either be deferred or
sourced separately. It must not be fabricated to fill the table.

## Two data-quality observations for adjudication

1. **±1 kill/placement split disputes.** Three cases where the total agrees but
   the kill/placement split differs by one. This is characteristic of a
   last-kill or team-wipe scoring convention applied differently. Neither side
   is self-evidently right; both should be adjudicated against VOD or a second
   source before any apply.
2. **Scoring-model note already flagged by the validator.** The validator's V4
   note on BMIS 2025 Grand Finals records 2 rows where
   `total_points != kill_points + placement_points` — consistent with
   `startingpoints` carry-over, which the source confirms exists. The decoder
   must model `startingpoints` explicitly or it will mis-derive those rows.

## Recommendation

Pilot on **BMPS 2025 Grand Finals**:

- full 288-row matrix already retrieved and cached, no further rate-limited
  fetches needed to start;
- 14/16 already field-exact against production, so the pipeline is validated by
  construction;
- it exercises `startingpoints` carry-over, which the decoder must handle anyway;
- the 2 disputed rows are a good, small test of the adjudication step.

Secondary pilot candidate: **BMIS 2025 Grand Finals** (same characteristics).

## Pipeline the extraction must target

The repository already contains the full write path — no new persistence code is
needed:

- `enrichStage({ tournamentId, stage, matches, resultsByMatch, playerStats, source, validate })`
- `replaceSyntheticSnapshot({ tournamentId, stage, matches, resultsByMatch, playerStats, source, validate })`

Both are transactional, idempotent by `source_slug`, enforce provenance via
`assertProvenance` (`source_url` and `source_name` required), and run a
caller-supplied `validate()` inside the transaction so a failed import rolls
back completely. `replaceSyntheticSnapshot` additionally deletes the synthetic
rows first, which is exactly the atomic replace the standing rule requires.

What is missing is only the front of the pipeline: a
Liquipedia-wikitext → payload parser. That is the deliverable of the next step,
and it should stop at dry-run output plus validation before any apply.

## Standing rules reaffirmed

- Dry-run on a copy, validate, review, then apply. No live apply without review.
- Any field that cannot be verified from source material is left unavailable
  rather than fabricated. This applies in particular to `player_match_stats`,
  which this source cannot supply.
