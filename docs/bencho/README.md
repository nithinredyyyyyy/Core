# Bencho integration

Source: the dock and carousel embedded in remote `Design.md` at commit `d4919a9`.
Unmodified supplied sources/CSS are beside this document. The application uses
`src/components/bencho/MagnifyingDock.jsx` and `Carousel.jsx`; TypeScript syntax
was removed. All 94 original block comments are preserved and regression tested.
MIT, Copyright (c) 2026 Lorenzo Cabra; see LICENSE and https://bencho.dev/licence.
`lucide-react` was already installed. No runtime dependency was added.

## Local token mapping

Mappings live in `src/components/bencho/tokens.css`. Material values without a
project equivalent are local to `.bencho-dock` or `.bencho-carousel`.

| Bencho variable | Project mapping / local value |
|---|---|
| `--font-mono` | `--font-mono-family` |
| `--g-blur` | `--blur-glass` |
| `--g-bright` | local `100%` |
| `--g-edge-far` | local `0.08` |
| `--g-edge-hi` | local `0.65` |
| `--g-edge-lo` | local `0.16` |
| `--g-lift` | local `0.12` |
| `--g-sat` | local `150%` |
| `--g-shadow` | `--shadow-lg` |
| `--g-spec` | local `0.6` |
| `--ink` | `hsl(var(--foreground))` |
| `--ink-rgb` | `--ink-rgb-light`; dark theme uses `--white-rgb` |
| `--on-ink` | `hsl(var(--background))` |
| `--pane` | `--glass-surface` |
| `--pane-edge` | `hsl(var(--border))` |
| `--shadow-rgb` | `--shadow-rgb-base` |
| `--try-edge` | `hsl(var(--ring))` |
| `--bg` | `hsl(var(--background))` |
| `--font-ui` | `--font-family-base` |
| `--lift` | local `0px`, per-card drift amplitude |
| `--sway` | local `0deg`, per-card drift amplitude |

RGB tokens resolve to three comma-separated bare numbers. Supplied selectors
are scoped under `.bencho-scope`, including the unused pane/lab selectors, so
retaining the source CSS and its comments does not restyle other components.

The source SHOTS stub stays empty as the default. TournamentsPage supplies up to
five real tournaments, ordered with the existing tournament comparator, with
images from getTournamentLogo and their existing `/tournaments?id=...` URLs.
Missing images use the existing CORE logo. An empty feed renders EmptyState
before mounting CarouselRing: no division by zero, transform writes or rAF loop.
One-shot and empty feeds are verified in the shared browser.

The dock replaces the existing mobile bar while preserving its destinations and
More sheet. Both components support touch; carousel buttons and arrow keys also
work. Reduced-motion preference changes are observed, every animation frame and
ResizeObserver is cleaned up, and control targets remain unscaled on mobile.
