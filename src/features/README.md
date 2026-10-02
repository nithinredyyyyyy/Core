# Feature modules

Tournament and leaderboard domains own their view components, state hooks and
pure helpers. Routes import the entry modules directly; no compatibility barrels
are needed. Cross-domain UI stays in `src/components/shared` and `components/ui`.

```
features/
  tournaments/
    TournamentsPage.jsx       # directory and query-parameter selection
    TournamentDetailPage.jsx # detail composition
    components/              # reusable cards, mobile boards and statistics
    sections/                # hero, brief, prizes, awards and participants
    standings/sections/      # desktop selectors, tables and pending views
    hooks/                   # detail/standings models and reducers
    utils/                   # pure formatting, branding and progression helpers
    admin/                   # tournament, match and result editor entry modules
      hooks/                 # tournament editor state
      sections/              # tournament editor fields and list
      matches/               # match editor hooks, sections and helpers
      results/               # result editor sections and helpers
      utils/
  leaderboard/
    components/
    data/
    hooks/
    utils/
```

`src/pages` retains the other route entry modules. Their extracted view sections
live in `components/{landing,players,rankings,teams}`. The remaining admin sections
live in `components/admin/{news,teams,instaPosters}`.

Shared tournament API/display contracts live in `src/types/tournaments.d.ts` and
are consumed through JSDoc in services and feature components. These document the
existing JSON variants; server validation remains in Zod. `checkJs` is currently
disabled, so this does not claim strict checking of all JavaScript implementations.

Keep relative `.js` imports in helpers used directly by Node tests. `@/` is the
frontend alias and is not resolved by the native Node test runner.
