# Read-only rollout verification

Run from the repository root with installed locked dependencies, Python 3 and Node
matching `package.json`. No script opens the committed database for writing or
runs `tools/` data-mutation utilities. Application startup/repairs occur only on
fresh temporary canonical-seeded databases. Test artifacts go outside the checkout.

```sh
npm run build
python3 scripts/rollout/asset-references.py \
  9575d479f80e25f5c685102d08a82625d50520f6 HEAD /tmp/asset-references.json
node scripts/rollout/crawl-assets.mjs /tmp/core-asset-crawl
node scripts/rollout/http-probe.mjs /tmp/core-http-probe
ROLLOUT_MIGRATION_EVIDENCE=/tmp/migration010.json node --test tests/unit/migration010.test.js
```

The crawler attaches to the managed shared Chromium session with
`coderabbit-agent-browser get cdp-url`; it does not download/launch a hidden browser.
It copies the built frontend and server to a disposable directory so concurrent
builds cannot invalidate chunk URLs. It boots a production-mode app on an ephemeral
port with synthetic local configuration and canonical seed, then derives every
public detail URL directly from that database. Shared SPA query caches are retained,
API requests are paced below the unchanged limiter, and lazy images are made eager.
A separate browser context prevents existing service-worker caches hiding 404s.
All attempted routes/headings and failures are retained in JSON; any asset 404,
broken rendered image, failed request, API error or uncaught page error fails the
command. Duplicate player IGNs share one URL: seed row counts and unique URL counts
are both reported. This is desktop asset coverage; touch/visual review and an
existing-service-worker upgrade are separate rollout checks.

The reference script searches **every tracked blob** at both Git revisions,
including seed JSON, Android, all configs and SQLite bytes/text cells. UTF-8,
URL-encoded and JSON-escaped filename variants are checked. SQLite table/column/
row-index matches are recorded without cell values. Binary image pixels are not
source references. Dynamic image builders are listed separately; static absence
alone is not proof against arbitrary runtime-generated URLs. Review each builder
and pair the report with the browser crawl. The 313-file manifest is derived from
asset-removal commit `836f188`, so restorations remain visible in future reports.
No raw secrets or environment dumps should be added to the reports.

Gitleaks (standalone CLI, no application dependency), all locally reachable refs:

```sh
git fetch --all
git rev-parse --is-shallow-repository  # expected false; fetch full history if true
gitleaks git --log-opts="--all --full-history" --redact=100 \
  --ignore-gitleaks-allow --no-banner --no-color \
  --report-format=json --report-path=/tmp/gitleaks-redacted.json
```

Exit 1 means findings, not success. Record commit/file/rule/line and redact values.
This cannot inspect deleted, unreachable remote refs or secrets stored only in
provider dashboards. Do not rewrite history or rotate provider secrets from these
scripts. Review and revocation are operator actions.

Baseline `includeAssets: ['images/**/*']` is an indirect service-worker reference
to all 313 removed originals. They are restored byte-for-byte for conservative
upgrade compatibility. The current shell-only precache does not select them.
This keeps the safety restoration separate from the precache performance policy.
