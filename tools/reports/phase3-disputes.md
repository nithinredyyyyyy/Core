# Phase 3 — Disputes and Deferred Decisions

Generated: 2026-09-28T08:36:07.803Z

These are decision items, not defects. Per `PRESERVE_DISPUTE_V1`, disagreements
and absences are represented and reported, never adjudicated or filled by
inference.

## Deferred stages

- **Battlegrounds Mobile India Pro Series 2024 / Semi Finals** — `SOURCE_NOT_AVAILABLE`
  - Provide the 24-team x 16-match P/K board (or any per-round placement/kill table) for BMPS 2024 Semi Finals. Reconstructing the agreed place/elim/total invariants without it would invent roughly 768 cells.

## Notes carried forward

- PEL 2026 Grand Finals scoring dispute is untouched: stored totals exceed
  derived totals by a gap that placement + elimination points do not explain.
  Resolving it needs the official tournament scoring rules.
- `replaceSyntheticSnapshot` now removes only `(match_number = 0 OR NULL) AND
  map = 'Other'`. Real NULL-numbered matches (19 PEL 2026 GF, 5 PMGC 2025) are
  no longer in the delete path.
- PMGC player statistics from the supplied elimination table were NOT imported.
- CORE holds duplicate team rows for `Rising Esports` (`27fc2f1f` and
  `02dd4d30`) and for `RiotNations` (`04780409`) vs `RiotNationZ` (`cb5e47df`).
  This is a pre-existing data-integrity issue, reported here and NOT fixed:
  the fixation pins the BMPS 2026 participant row for each name rather than
  merging, renaming, or deleting a team.
- BMPS 2025 Survival Stage was NOT created. The 32-team Survival board is
  BMPS 2026's composition and CORE has no BMPS 2025 Survival Stage; the board
  is written to `Battlegrounds Mobile India Pro Series 2026 / Survival Stage`.