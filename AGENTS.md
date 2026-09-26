# AGENTS.md

Repository-specific knowledge for the CORE BGMI esports platform.

## Commands

```bash
npm run lint        # eslint . --quiet
npm run typecheck   # tsc -p ./jsconfig.json
npm run build       # node tools/build.js
npm test            # node test runner; API integration tests
```

Dev servers used during verification: `node server/index.js` (API) and
`vite --port 5199` (frontend). The API enforces rate limits (public 120/min,
search 30/min, auth 20/min), so scripted browser sweeps must pace requests or
they will see 429s that look like real failures.

## Architecture

- `src/api/base44Client.js` — single API client. Entity lists, page payloads,
  and `home.view()` all go through it.
- `server/` — Express API. **Do not modify**: it owns HttpOnly session cookies,
  CSRF, CORS, CSP, SSRF/DNS-rebinding protection, admin authorization, rate
  limiting, and request/response limits.
- `src/services/*` — data access wrappers. Pages must not call `base44`
  entities directly; add a service function instead.
- `src/hooks/*` — TanStack Query hooks that compose services.
- `src/lib/status.js` — canonical status model (LIVE/UPCOMING/COMPLETED/
  CANCELLED/POSTPONED). Never communicate status through colour alone.
- `src/lib/formatting.js` — all date/time/number formatting.
- `src/lib/navigation.js` — the single nav config read by both the desktop
  header and the mobile bottom bar.

## Public API access rules

Some entity endpoints are admin-scoped and return **403 to anonymous users**:
`PlayerAlias`, `TeamAlias`, `PlayerTeamHistory`. The public
`/api/pages/teams` payload already bundles `teamAliases`, `teams`, `players`,
and `tournaments`, so public pages must read aliases from that payload rather
than from the raw entity endpoint. An anonymous `401` on `/api/auth/me` is
expected and is not a bug.

## Match result granularity

MatchResult rows are not uniform: multi-match tournaments publish one row per
match, while single-match tournaments publish cumulative rows. The shared view
model in `src/lib/matchViewModel.js` handles both and labels aggregated
standings honestly. Never present cumulative rows as single-match results.

## Design system

- `tailwind.config.js` holds the brand palette. Pages reference ~387 brand
  colour usages, so any palette edit must stay a strict superset of the
  existing keys.
- Dark-first, high contrast, minimal. No heavy effects, no oversized cards.
- Shared primitives live in `src/components/shared/` (StatusBadge, TeamLogo,
  PlayerAvatar, DataTable, FilterTabs, EmptyState, QueryError, PageSkeleton,
  MatchCard, NewsCard, SectionHeader, PageHeader, SearchInput).
- Grid containers must include `grid-cols-1` (or another explicit track).
  A bare `grid` creates an implicit `auto` track that sizes to min-content and
  causes horizontal overflow on narrow screens.

## Data integrity

Never fabricate teams, players, scores, rankings, tournaments, dates, prize
pools, or news. Render an empty state when the backend has no data.

## Frontend polish program (audit + plan)

Audit performed before changes; baseline was green (`lint`, `typecheck`,
`build`, 10 unit + 11 integration tests). Existing pages already used shared
primitives, so the program is a consolidation, not a rewrite.

Findings worth remembering:

- Navigation, status model, formatting, and the `shared/` primitives already
  existed and were reused. Do not add parallel versions of them.
- `/matches` (Match Center) already had LIVE/UPCOMING/RECENT tabs plus period
  and tournament filters. `/matches/:id` exists as the match detail route.
- `/rankings` had `trend` and `updatedAt` in the API payload but rendered
  neither. Trend values are currently all `0`, so movement renders as an
  em dash — never synthesise an arrow from nothing.
- `/teams` hardcoded `BMPS 2026` / `India` and had a filler "Search ready:
  Live" stat tile. Those were replaced with real values from the payload.
- `ProfilePanel` rendered its title as a `<p>`, leaving profile pages without
  section headings. It now renders a configurable heading (`h2` by default).
- The home hero used an `h2` and repeated the tournament name twice; it now
  carries the page `h1` and shows match number/map in the header strip.
- Search match results previously showed the tournament name as the label,
  making every row look identical. Labels are now `Match N · Map` with the
  tournament as the subtitle.

Planned phases (Phases 1-9 done; 10 in progress):

1. Design system + global shell + navigation
2. Home
3. Match Center + match detail
4. Tournaments + tournament detail
5. Teams + team detail
6. Players + player detail
7. Rankings + leaderboard
8. News + article
9. Search
10. Mobile/accessibility/performance/SEO polish

Phase 8-10 notes:

- Share functionality (§30) lives in `shared/ShareMenu.jsx` and is wired into
  match, tournament, team, player, and news-article detail pages. It prefers
  `navigator.share`, with WhatsApp / X / copy-link fallbacks.
- `/news` category filters now use the shared `FilterTabs` primitive instead
  of a bespoke button row.
- Tap targets raised to `min-h-11` in `SectionHeader`, `/news` tag chips,
  `/teams` card name + roster chips.
- Global search already supports `Ctrl+K` / `Cmd+K` via
  `useGlobalSearchShortcut` in `AppLayout`. `/rankings` already documents its
  methodology in `RankingRules` plus a "Last updated" timestamp.
- Palette audit: every `brand-*` Tailwind key used in `src/` resolves in
  `src/index.css`. The only unmatched `brand-*` strings are CSS class-name
  fragments in admin posters (`ig-brand-logo`, `poster-*-brand-text`, etc.),
  not palette keys.
- News articles render a `SourceCard` from `source_name` / `source_url` and
  label `ai_summary` blocks as AI-generated. Only 7 of 27 articles carry a
  source, so the card is conditional — never invent a source.

Verification for every phase: `npm run lint`, `npm run typecheck`,
`npm run build`, `npm test`, then a paced Playwright pass (mobile widths
320-430px) checking horizontal overflow, single `h1`, tap-target height, page
title, and `lang`.

The 401 on `/api/auth/me` for anonymous visitors is expected. A 429 during
scripted sweeps means the rate limiter is working, not that the page is broken
— pace the requests and re-check.

