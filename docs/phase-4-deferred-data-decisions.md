# Phase 4 Deferred Data Decisions

Date: 2026-09-17

Phase 4.2 removed runtime tournament read overrides. These lower-priority data gaps were reviewed after the migration and are intentionally kept as follow-up data-enrichment work rather than blockers for deleting `server/tournamentOverrides.js`.

## PMGC 2025 Relational Match Results

- Tournament: `PUBG Mobile Global Championship 2025`
- Current state: 32 JSON participants, 4 JSON stages, 6 relational stage rows, 25 relational `match_results` rows, and 16 Grand Finals JSON standings rows.
- Decision: leave as-is for Phase 4.2.
- Reason: page rendering has complete stored JSON standings after the post-import migration. The relational rows are partial, but converting every PMGC stage result into normalized match rows is an enrichment pass, not required to eliminate runtime overrides.

## PMWC 2024/2025 Relational Match Results

- Tournament: `PUBG Mobile World Cup 2024`
- Current state: 24 JSON participants, 3 JSON stages, 0 relational stage rows, 0 relational `match_results` rows, and 16 Main Tournament JSON standings rows.
- Tournament: `PUBG Mobile World Cup 2025`
- Current state: 24 JSON participants, 3 JSON stages, 0 relational stage rows, 0 relational `match_results` rows, and 16 Grand Finals JSON standings rows.
- Decision: leave as-is for Phase 4.2.
- Reason: both tournaments render from complete imported JSON data. Backfilling relational match rows should be done as a separate migration when the project needs match-level analytics for those tournaments.

## BMIC/BMSD 2026 Stub Data

- Tournament: `Battlegrounds Mobile India International Cup 2026`
- Current state: 3 JSON participants, 1 JSON stage, 0 relational `match_results` rows.
- Tournament: `Battlegrounds Mobile India Showdown 2026`
- Current state: 0 JSON participants, 6 JSON stages, 0 relational `match_results` rows.
- Decision: keep as stubs for Phase 4.2.
- Reason: these entries do not participate in the deleted runtime override path. They need source data before they can be completed safely, so they should remain visible as stub entries rather than receiving speculative generated data.
