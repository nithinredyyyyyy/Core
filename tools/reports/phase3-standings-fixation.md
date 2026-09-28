# Phase 3 — Standings Fixation Report

Generated: 2026-09-28T08:36:07.803Z

Production database was never modified.

- Production DB: `/workspace/project/Core/server/data/stagecore.sqlite`
- Production md5 before: `85ab7f583faea808bff3e80ff4617120`
- Production md5 after: `85ab7f583faea808bff3e80ff4617120`
- Working copy: `/tmp/phase3-standings-pc97vH/stagecore.copy.sqlite`
- Integrated integrity check: ok
- Foreign-key issues: 0
- Idempotent second apply: yes
- Canonical bootstrap refreshed: yes

## PMWC 2024 removal

- Present in the starting database: 1
- After migrations 009-013: 0
- After apply: 0 (expected 0)
- Removed by the migration path: true
- Tournaments: 19 -> 18
- PMWC 2025 preserved: true
- PMWC 2026 preserved: true

## Applied standings

| Tournament | Stage | Group | Scope | Before | Expected | After | Inserted | Updated | Source |
|---|---|---|---|---|---|---|---|---|---|
| PUBG Mobile World Cup 2025 | Group Stage | — | existing-rows | 21 | 21 | 21 | 0 | 21 | USER_SUPPLIED_SOURCE |
| PUBG Mobile World Cup 2025 | Survival Stage | — | overall | 14 | 16 | 16 | 2 | 14 | USER_SUPPLIED_SOURCE |
| PUBG Mobile World Cup 2025 | Grand Finals | — | overall | 14 | 16 | 16 | 2 | 14 | USER_SUPPLIED_SOURCE |
| PUBG Mobile Global Championship 2025 | Group Stage | Group Green | group | 16 | 16 | 16 | 0 | 16 | PUBLISHED_STANDINGS |
| PUBG Mobile Global Championship 2025 | Group Stage | Group Red | group | 16 | 16 | 16 | 0 | 16 | PUBLISHED_STANDINGS |
| Battlegrounds Mobile India Pro Series 2026 | Survival Stage | — | overall | 0 | 32 | 32 | 32 | 0 | USER_SUPPLIED_SOURCE |
| PUBG Mobile World Cup 2026 | Survival Stage | — | overall | 0 | 16 | 16 | 16 | 0 | USER_SUPPLIED_SOURCE |

## Source labels resolved to canonical teams

Every supplied label below resolved to an existing CORE team, so no team was
created. The row's `team_id` points at the canonical team; the source's own
wording is preserved here as the audit trail.

| Stage | Supplied label | Canonical team | Team id |
|---|---|---|---|
| PUBG Mobile World Cup 2025 / Group Stage | 4Thrives | 4Thrives Esports | `92a19672-3273-46dd-a31b-4dd8e40af73a` |
| PUBG Mobile World Cup 2025 / Group Stage | TT Global | ThunderTalk Gaming | `b5dadeef-5bd1-49fd-830d-a71631ec1df5` |
| PUBG Mobile World Cup 2025 / Group Stage | Regnum Carya | Regnum Carya Esports | `e0e107bf-9934-4e19-82bc-7b58c6ffe08d` |
| PUBG Mobile World Cup 2025 / Group Stage | Fire Flux | Fire Flux Esports | `a3b46254-cd46-4ec0-91d3-4021f946ab6c` |
| PUBG Mobile World Cup 2025 / Survival Stage | Fire Flux | Fire Flux Esports | `a3b46254-cd46-4ec0-91d3-4021f946ab6c` |
| PUBG Mobile World Cup 2025 / Survival Stage | Regnum Carya | Regnum Carya Esports | `e0e107bf-9934-4e19-82bc-7b58c6ffe08d` |
| PUBG Mobile World Cup 2025 / Grand Finals | Regnum Carya | Regnum Carya Esports | `e0e107bf-9934-4e19-82bc-7b58c6ffe08d` |
| PUBG Mobile World Cup 2025 / Grand Finals | 4Thrives | 4Thrives Esports | `92a19672-3273-46dd-a31b-4dd8e40af73a` |
| PUBG Mobile World Cup 2025 / Grand Finals | Fire Flux | Fire Flux Esports | `a3b46254-cd46-4ec0-91d3-4021f946ab6c` |
| PUBG Mobile World Cup 2025 / Grand Finals | TT Global | ThunderTalk Gaming | `b5dadeef-5bd1-49fd-830d-a71631ec1df5` |
| PUBG Mobile Global Championship 2025 / Group Stage | Gen.G MENA | Gen.G Esports MENA | `058bf2b3-041d-4ff2-874e-fe377d6413a2` |
| PUBG Mobile Global Championship 2025 / Group Stage | 9z | 9z Team | `6431f679-4607-4e08-ac65-033ef808ebb7` |
| PUBG Mobile Global Championship 2025 / Group Stage | Gs Team | GS Team | `01e57088-6309-40e9-be60-44a65e2c009d` |
| PUBG Mobile Global Championship 2025 / Group Stage | Arcred | ARCRED | `d38b9fec-b771-4aae-b8e5-4e75992c0acf` |
| PUBG Mobile Global Championship 2025 / Group Stage | Alliance My | Alliance | `39bbcb8f-7974-4a07-80be-ee2991606150` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | MYTH OFFICIAL | Myth Official | `78167ca7-56f4-4c2e-bdbf-af6328c760a9` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | TEAM AX | Team AX | `7425fe95-dfa9-493b-bab6-dc671763927b` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | VERSATILE ESPORTS | Versatile Esports | `9b293df1-d856-47e7-a0f4-70718ebe0236` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | RISING ESPORTS | Rising Esports | `27fc2f1f-d869-4362-9d13-ae9725e9d047` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | RAPID CHAOS ESPORTS | Rapid Chaos Esports | `c33f820e-2a4e-4fe0-a3ba-9869359ca1f1` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | MADKINGS | Madkings Esports | `941883a3-0912-4077-99c1-4e541406103c` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | GENxFM ESPORTS | GENxFM Esports | `4cc9de93-9c12-4e7d-9bbe-68a8a98423ab` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | Learn from past | Learn From Past | `9cfe7c6d-ee8f-4d69-8736-66ede35e8367` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | TROY TAMILAN ESPORTS | Troy Tamilan Esports | `4e14387b-e307-4777-9374-93e7628251b1` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | TEAM H4K | Team H4K | `d6d8a51e-55c8-4744-b5d3-fdf962961592` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | Santa Esp | Santa Esports | `318b3c21-c306-4363-818b-39f2dad052c4` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | TeamRedXross | Team RedXRoss | `1c9cc34e-0e7b-4c25-8a34-220e1a4b6ead` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | ARES ESPORT | Ares Esport | `42ab1785-e17e-4828-b8ba-2308f7257f1b` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | QUANTUM SPARKS | Quantum Sparks | `734736a9-6ee9-4c7a-af9a-9562d2864962` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | AURA x ESPORTS | Aura X Esports | `d954c0f4-10ab-4c5e-bf80-21945aaabf86` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | T7xORION ESPORTS | T7xOrion Esports | `74b93a0e-44f0-4a0a-9c7f-d5412f9f0426` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | GODSENT ESPORTS | Godsent Esports | `c19fc48d-201d-4483-97db-8e67127d22f0` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | HADX ESPORTS | HADX Esports | `c735976a-c065-44ea-86e4-347e9784a8ff` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | ThunderGods x Tortuga Gaming | ThunderGods X Tortuga Gaming | `a4ea00cc-5bee-4c25-ad94-eaf96799992e` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | JAGUAR ESPORTS | Jaguar Esports | `8644287a-8e6b-435b-8fc9-b63f81caf6ab` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | TEAM DOXY | Team Doxy | `cddee879-b980-4188-9501-95cdac1b53eb` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | RIOTNATIONz | RiotNations | `04780409-05d9-4c6b-a8e2-a10e6fa5e12c` |
| Battlegrounds Mobile India Pro Series 2026 / Survival Stage | PHOENIX ESPORTS | Phoenix Esports | `e9e32468-54f5-49a3-bf8a-ab8d4b82e004` |


## Disputes (prior CORE value retained; source value now canonical)

| Team | Field | Prior CORE value | Source value |
|---|---|---|---|
| Weibo Gaming | rank | 4 | 3 |
| DRX | rank | 3 | 4 |
| Team Secret | rank | 6 | 5 |
| Alpha Gaming | rank | 5 | 6 |
| Horaa Esports | rank | 13 | 12 |
| POWR eSports | place_points | 32 | 31 |
| POWR eSports | elim_points | 72 | 73 |
| Nongshim RedForce | place_points | 27 | 28 |
| Nongshim RedForce | elim_points | 65 | 64 |
| POWR eSports | place_points | 26 | 28 |
| POWR eSports | total_points | 87 | 89 |
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
| Geekay Esports | place_points | 28 | 29 |
| Geekay Esports | elim_points | 65 | 64 |
| Boars Gaming | place_points | 19 | 24 |
| Boars Gaming | elim_points | 65 | 60 |
| Virtus.Pro | place_points | 20 | 26 |
| Virtus.Pro | elim_points | 58 | 52 |
| True Rippers | place_points | 18 | 25 |
| True Rippers | elim_points | 44 | 37 |
| ETSH Esports | place_points | 8 | 17 |
| ETSH Esports | elim_points | 31 | 22 |
| Nuclear Zone | place_points | 5 | 13 |
| Nuclear Zone | elim_points | 34 | 26 |

Per `PRESERVE_DISPUTE_V1` the disagreement is represented, not adjudicated:
the canonical row now carries the source value and the prior CORE value is
kept here. The supplied total was validated against its own components
before the write, so no stored row has components that disagree with its
total.


## Deferred (not written)

### Battlegrounds Mobile India Pro Series 2024 / Semi Finals

- Reason: `SOURCE_NOT_AVAILABLE`
- Detail: The instruction says the supplied source contains a per-round P/K board for this stage (24 teams x 16 matches). No such board exists in the repository, in CORE, or in the task text; only the aggregate rank/total narrative was insufficient to rebuild it. The 24-team Semi Finals field is not the 16-team Finalist list in import-bmps-2024.js, and that list carries no per-round placements or kills.
- Required to proceed: Provide the 24-team x 16-match P/K board (or any per-round placement/kill table) for BMPS 2024 Semi Finals. Reconstructing the agreed place/elim/total invariants without it would invent roughly 768 cells.
