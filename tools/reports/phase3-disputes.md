# Phase 3 — Disputes and Deferred Decisions

Generated: 2026-09-28T07:36:35.457Z

These are decision items, not defects. Per `PRESERVE_DISPUTE_V1`, disagreements
and absences are represented and reported, never adjudicated or filled by
inference.

## Deferred stages

- **Battlegrounds Mobile India Pro Series 2024 / Semi Finals** — `SOURCE_NOT_AVAILABLE`
  - Provide the 24-team x 16-match P/K board (or any per-round placement/kill table) for BMPS 2024 Semi Finals. Reconstructing the agreed place/elim/total invariants without it would invent roughly 768 cells.
- **PUBG Mobile World Cup 2025 / Grand Finals** — `TEAM_IDENTITY_UNRESOLVED`
  - Unresolved: TT Global
  - Confirm the canonical identity for 'TT Global' (or supply its CORE team id). Confirm whether it is CORE's rank-16 'ThunderTalk Gaming' row.
- **PUBG Mobile Global Championship 2025 / Group Stage** — `TEAM_IDENTITY_UNRESOLVED`
  - Unresolved: Alliance My
  - Confirm whether 'Alliance My' is CORE's 'Alliance' or 'Yoodo Alliance' (or another team). CORE's existing Group Red rank 9 is 'Alliance' with identical supplied values (18/0/39/62/101).
- **Battlegrounds Mobile India Pro Series 2025 / Survival Stage** — `TOURNAMENT_YEAR_UNCERTAIN`
  - Unresolved: Santa Esp
  - Confirm which edition this Survival Stage belongs to (2025 or 2026), the correct stage name, and the canonical identity of 'Santa Esp' (CORE holds 'Santa Esports').

## Notes carried forward

- PEL 2026 Grand Finals scoring dispute is untouched: stored totals exceed
  derived totals by a gap that placement + elimination points do not explain.
  Resolving it needs the official tournament scoring rules.
- `replaceSyntheticSnapshot` now removes only `(match_number = 0 OR NULL) AND
  map = 'Other'`. Real NULL-numbered matches (19 PEL 2026 GF, 5 PMGC 2025) are
  no longer in the delete path.
- PMGC player statistics from the supplied elimination table were NOT imported.