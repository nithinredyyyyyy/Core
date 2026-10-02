# CORE design system

`DESIGN.md` is the supplied reference. `src/styles/design-tokens.css` is the
single CSS token source: semantic light/dark colors, brand palette, typography,
spacing, radii, shadows, blur, marquee gradient and legacy export-artwork colors.
`tailwind.config.js` reads the brand RGB declarations from that file and generates
opacity-aware color utilities; it contains no duplicate hex palette.

The landing page follows the reference's light identity even when the app theme
is dark. Its scoped semantic aliases keep text and glass surfaces readable.
Other application pages retain their light/dark themes. Inter Display 600/700
Latin subsets are self-hosted, with the Inter SIL OFL license under public/fonts.
The reference's 710px content width, 60:50 heading ratio, centered white hero,
blue gradient and floating preview are adapted to the existing product copy.

Use PageShell, PageHeader/SectionHeader, Card, Button, Badge/StatusBadge, Input,
Dialog/Sheet and Table/DataTable. Prefer 4/8/16-based spacing tokens and explicit
base grid tracks. Existing fixed-dimension social poster artwork retains its
export geometry. Default Tailwind palette utilities remain valid theme tokens;
legacy brand names remain a superset for existing pages and export artwork.

Remaining literal color exceptions: canvas export backgrounds and podium hex
values that append alpha bytes, plus Recharts selectors that identify vendor SVG
attributes. The generated audit report gives the exact inventory. Do not replace
those with unresolved CSS variables in canvas options or selector attribute tests.

ESLint now displays every warning and fails on any warning. Four documented
file-size allowances cover cohesive editor/state models and the static poster
stylesheet. Focused @ts-check covers safe redirects and tournament image lookup;
shared domain contracts live in src/types/tournaments.d.ts. Full checkJs remains
off for the legacy JS codebase. Prettier conventions are in .prettierrc.json.
