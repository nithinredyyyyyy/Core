# Phase 3 — Standings Fixation Report

Generated: 2026-09-28T07:36:35.457Z

Production database was never modified.

- Production DB: `/workspace/project/Core/server/data/stagecore.sqlite`
- Production md5 before: `85ab7f583faea808bff3e80ff4617120`
- Production md5 after: `85ab7f583faea808bff3e80ff4617120`
- Working copy: `/tmp/phase3-standings-04l86A/stagecore.copy.sqlite`
- Integrated integrity check: ok
- Foreign-key issues: 0
- Idempotent second apply: yes
- Canonical bootstrap refreshed: yes

## PMWC 2024 removal

- Before: 0
- After: 0 (expected 0)
- PMWC 2025 preserved: true
- PMWC 2026 preserved: true

## Applied standings

| Tournament | Stage | Group | Scope | Before | Expected | After | Inserted | Verified | Source |
|---|---|---|---|---|---|---|---|---|---|
| PUBG Mobile World Cup 2025 | Group Stage | — | existing-rows | 0 | 21 | 0 | 0 | 21 | USER_SUPPLIED_SOURCE |
| PUBG Mobile World Cup 2025 | Survival Stage | — | overall | 14 | 16 | 16 | 2 | 14 | USER_SUPPLIED_SOURCE |
| PUBG Mobile Global Championship 2025 | Group Stage | Group Green | group | 16 | 16 | 16 | 0 | 16 | PUBLISHED_STANDINGS |
| PUBG Mobile World Cup 2026 | Survival Stage | — | overall | 0 | 16 | 16 | 16 | 0 | USER_SUPPLIED_SOURCE |

## Disputes (stored value preserved, supplied value recorded)

| Team | Field | Stored | Supplied |
|---|---|---|---|
| Weibo Gaming | rank | 4 | 3 |
| DRX | rank | 3 | 4 |
| Team Secret | rank | 6 | 5 |
| Alpha Gaming | rank | 5 | 6 |
| POWR Esports | place_points | 32 | 31 |
| POWR Esports | elim_points | 72 | 73 |
| Nongshim RedForce | place_points | 27 | 28 |
| Nongshim RedForce | elim_points | 65 | 64 |
| Alpha Gaming | place_points | 61 | 66 |
| Alpha Gaming | elim_points | 113 | 108 |
| Dplus | place_points | 48 | 52 |
| Dplus | elim_points | 101 | 97 |
| GOAT Team | place_points | 57 | 43 |
| GOAT Team | elim_points | 76 | 90 |
| Wolves Esports | place_points | 37 | 33 |
| Wolves Esports | elim_points | 78 | 82 |
| Inner Circle Esports | place_points | 38 | 27 |
| Inner Circle Esports | elim_points | 76 | 87 |
| Gen.G MENA | place_points | 39 | 34 |
| Gen.G MENA | elim_points | 69 | 74 |
| Loops Esports | place_points | 25 | 22 |
| Loops Esports | elim_points | 81 | 84 |
| Alter Ego Ares | place_points | 25 | 30 |
| Alter Ego Ares | elim_points | 80 | 75 |
| Team Falcons | place_points | 36 | 25 |
| Team Falcons | elim_points | 68 | 79 |
| Papara Supermassive | place_points | 28 | 26 |
| Papara Supermassive | elim_points | 76 | 78 |
| 9z | place_points | 44 | 27 |
| 9z | elim_points | 54 | 71 |
| Tianba | place_points | 31 | 20 |
| Tianba | elim_points | 67 | 78 |
| Gs Team | place_points | 30 | 18 |
| Gs Team | elim_points | 68 | 80 |
| Orangutan | place_points | 35 | 21 |
| Orangutan | elim_points | 56 | 70 |
| REJECT | place_points | 31 | 15 |
| REJECT | elim_points | 47 | 63 |
| Team Secret | place_points | 11 | 7 |
| Team Secret | elim_points | 21 | 25 |

Per `PRESERVE_DISPUTE_V1` these are reported, not resolved. Each is a
placement/elimination component split — the stored total is untouched and
matches the supplied total, so no ranking changed.


## Deferred (not written)

### Battlegrounds Mobile India Pro Series 2024 / Semi Finals

- Reason: `SOURCE_NOT_AVAILABLE`
- Detail: The instruction assumes a supplied per-round P/K board (24 teams x 16 matches). No such board exists in the repository, in CORE, or in the task text. The 24-team Semi Finals field is not the 16-team Finalist list in import-bmps-2024.js, and that list carries no per-round placements or kills.
- Required to proceed: Provide the 24-team x 16-match P/K board (or any per-round placement/kill table) for BMPS 2024 Semi Finals. Reconstructing the agreed place/elim/total invariants without it would invent roughly 768 cells.

### PUBG Mobile World Cup 2025 / Grand Finals

- Reason: `TEAM_IDENTITY_UNRESOLVED`
- Unresolved teams: TT Global
- Detail: Rank 16 of the supplied 16-team board is 'TT Global'. No CORE team or alias matches it, and it is not an unambiguous variant of an existing team. CORE's own Grand Finals row at rank 16 is 'ThunderTalk Gaming' with identical supplied values (18/0/14/40/54), but CORE also holds a separate 'TT Global'-shaped ambiguity risk, so the identity is not asserted here.
- Required to proceed: Confirm the canonical identity for 'TT Global' (or supply its CORE team id). Confirm whether it is CORE's rank-16 'ThunderTalk Gaming' row.

### PUBG Mobile Global Championship 2025 / Group Stage / Group Red

- Reason: `TEAM_IDENTITY_UNRESOLVED`
- Unresolved teams: Alliance My
- Detail: Rank 9 of the supplied Group Red board is 'Alliance My'. CORE holds both 'Alliance' and 'Yoodo Alliance', so the intended organisation cannot be chosen without guessing.
- Required to proceed: Confirm whether 'Alliance My' is CORE's 'Alliance' or 'Yoodo Alliance' (or another team). CORE's existing Group Red rank 9 is 'Alliance' with identical supplied values (18/0/39/62/101).

### Battlegrounds Mobile India Pro Series 2025 / Survival Stage

- Reason: `TOURNAMENT_YEAR_UNCERTAIN`
- Unresolved teams: Santa Esp
- Detail: Two independent problems. (1) CORE's BMPS 2025 defines no Survival stage at all; its stages are League Stage, Rounds 1-3, Semi Finals Week 1, Semi Finals Week 2 and Grand Finals. (2) The supplied 32-team board's composition, including its 32-team group split, matches the BMPS 2026 Survival Stage, but BMPS 2026's Survival Stage is empty in CORE and 3 resolvable supplied teams (DCxSCR Esports, Esport Social, Likitha Esports) are not BMPS 2026 participants. Writing it under either year would attach correct-looking rows to the wrong event.
- Required to proceed: Confirm which edition this Survival Stage belongs to (2025 or 2026), the correct stage name, and the canonical identity of 'Santa Esp' (CORE holds 'Santa Esports').
