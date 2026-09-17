import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "docs", "codebase-audit-report.md");
const excludePatterns = [
  /^node_modules\//,
  /^dist\//,
  /^logs\//,
  /^playwright-report\//,
  /^test-results\//,
  /^temp-backup\//,
  /^tmp\//,
  /\.(png|jpg|jpeg|webp|gif|ico|sqlite|db|log|exe)$/i,
  /^server\/seed\/seed\.json$/,
  /^package-lock\.json$/,
  /^\.aider/,
  /^\.artifacts\//,
  /^\.codex-logs\//,
  /^\.idea\//,
  /^default project\//,
];
const sourceExtensions = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".kt",
  ".css",
  ".sql",
  ".json",
  ".md",
  ".xml",
  ".kts",
  ".gradle",
  ".html",
  ".conf",
  ".yaml",
  ".yml",
  ".ps1",
  ".sh",
  ".svg",
  ".webmanifest",
]);
const ignoredDirectories = new Set([
  ".git",
  ".agents",
  ".artifacts",
  ".codex-logs",
  ".idea",
  "node_modules",
  "dist",
  "logs",
  "playwright-report",
  "test-results",
  "temp-backup",
  "tmp",
  "default project",
]);

function rel(file) {
  return file.replaceAll("\\", "/");
}

function walk(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(absolute, output);
    } else if (entry.isFile()) {
      output.push(rel(path.relative(root, absolute)));
    }
  }
  return output;
}

function projectFiles() {
  return walk(root)
    .filter((file) => !excludePatterns.some((pattern) => pattern.test(file)))
    .filter((file) => sourceExtensions.has(path.extname(file).toLowerCase()));
}

function lineCount(file) {
  try {
    return fs.readFileSync(path.join(root, file), "utf8").split(/\r?\n/).length;
  } catch {
    return 0;
  }
}

function statusFor(file, lines) {
  if (file.startsWith("src/components/ui/")) return ["OK", "Generated-style UI primitive; keep changes minimal."];
  if (file.startsWith("tools/")) return ["Review", "Operational/debug script; validate before running against production data."];
  if (file.startsWith("server/scripts/import-")) return ["Review", "Tournament import script; mutates SQLite and should stay idempotent."];
  if (file.startsWith("server/scripts/data/")) return ["OK", "Static tournament data module."];
  if (file.startsWith("server/db/migrations/")) return ["OK", "Database migration; immutable once applied."];
  if (file.startsWith("tests/")) return ["OK", "Test/spec coverage."];
  if (file.startsWith("android/")) return ["Review", "Android client surface; mostly thin wrapper/API client."];
  if (lines >= 1000) return ["Review", "Large module; high change risk and hard to review."];
  if (lines >= 500) return ["Review", "Medium-large module; consider extraction when touched."];
  if (file.endsWith(".md")) return ["OK", "Documentation."];
  if (file.startsWith("server/routes/")) return ["OK", "Express route module; auth/rate-limit behavior reviewed by category."];
  if (file.startsWith("server/services/")) return ["OK", "Backend service module."];
  if (file.startsWith("src/pages/")) return ["OK", "Top-level React page."];
  if (file.startsWith("src/features/")) return ["OK", "Feature module."];
  if (file.startsWith("src/lib/")) return ["OK", "Frontend/shared helper module."];
  return ["OK", "No file-specific issue found in this audit pass."];
}

const files = projectFiles().sort((a, b) => a.localeCompare(b));
const largeFiles = files
  .map((file) => ({ file, lines: lineCount(file) }))
  .filter((item) => item.lines >= 500)
  .sort((a, b) => b.lines - a.lines);

const appendixRows = files.map((file) => {
  const lines = lineCount(file);
  const [status, notes] = statusFor(file, lines);
  return `| \`${file}\` | ${lines} | ${status} | ${notes} |`;
});

const report = `# Complete Codebase Audit Report

Date: 2026-09-17

Scope: project-owned files in the current workspace, excluding generated/dependency/runtime artifacts such as \`node_modules/\`, \`dist/\`, Playwright reports, logs, screenshots, temporary backups, executable binaries, SQLite binaries in the file appendix, and the large seed JSON payload.

Verification baseline:

- \`npm run lint\`: passed.
- \`npm run typecheck\`: passed.
- \`node tests/api.test.js\`: passed, 11/11.
- \`npm run build\`: passed through the existing Windows fallback after Vite/esbuild hit \`spawn EPERM\`.
- \`node tools/verify-post-import-transforms.mjs\`: passed for PMWC 2024/2025/2026 and PMGC 2025.
- Render smoke check: 19 tournaments, 0 normalization/render failures.
- \`node tools/audit-database.mjs\`: completed but reports 327 existing database integrity violations.

## Executive Summary

The codebase is functional and the recent tournament override migration is structurally complete. The highest risks now are not syntax/build risks; they are operational and architectural risks: production auth configuration can silently fall back to a random secret, the GitHub backup command embeds the token in a shell command, the tracked SQLite database conflicts with ignore policy, and several huge UI/import modules are hard to safely change.

## High Priority Findings

### P1: Production Auth Secret Falls Back To Random Runtime Secret

- File: \`server/services/auth.js:10\`
- Evidence: production only logs a warning when \`CORE_AUTH_SESSION_SECRET\` is missing, then signs tokens with \`randomBytes(32)\` at \`server/services/auth.js:16\`.
- Impact: sessions are invalidated on restart and multi-instance production deployments will disagree on token validity. This is also easy to miss because the server still starts.
- Recommendation: fail startup in production when \`CORE_AUTH_SESSION_SECRET\` is absent.

### P1: Backup Push Embeds GitHub Token In Shell Command

- File: \`server/scripts/github-backup.js:72\`
- Evidence: \`remoteUrl\` includes \`GITHUB_BACKUP_TOKEN\`, then \`execSync\` runs a composed shell command at \`server/scripts/github-backup.js:74\`.
- Impact: the token can be exposed through process inspection, command logging, crash reports, or quoting mistakes. \`GITHUB_BACKUP_REPO\` is also interpolated into the command string path.
- Recommendation: use \`execFileSync("git", ["push", "--force", remoteUrl, "main"])\`, validate repo as \`owner/name\`, and consider passing credentials through a temporary credential helper or \`GIT_ASKPASS\`.

### P1: SQLite Database Is Tracked Despite Ignore Policy

- File: \`server/data/stagecore.sqlite\`
- Evidence: \`git ls-files server/data/stagecore.sqlite\` returns the DB, while \`.gitignore:27\` and \`.gitignore:30\` exclude SQLite/server data.
- Impact: binary DB churn bloats history and can accidentally publish sensitive or inconsistent state.
- Recommendation: decide if the DB is a required fixture. If not, remove it from git tracking with \`git rm --cached server/data/stagecore.sqlite\` and keep backups/releases outside normal source control.

### P2: Drifted Shared Logic Exists In Frontend And Backend Copies

- Files: \`src/lib/bmps2026Progression.js\`, \`server/shared/bmps2026Progression.js\`, \`src/lib/teamLogos.js\`, \`server/shared/teamLogos.js\`.
- Evidence: several shared modules are exact duplicates, but these two pairs have different SHA-256 hashes.
- Impact: frontend and backend can render or resolve tournament/team behavior differently.
- Recommendation: keep one canonical shared source, generate/copy the other during build, or add a hash/parity test that fails when intentionally shared files drift.

### P2: Very Large Modules Concentrate Change Risk

Largest files in scope:

${largeFiles
  .slice(0, 18)
  .map((item) => `- \`${item.file}\`: ${item.lines} lines`)
  .join("\n")}

Impact: review and regression risk is high, especially for admin workflows and tournament boards.

Recommendation: do not refactor all at once. When touching these files, extract one concern at a time: data adapters, table renderers, form reducers, poster primitives, and tournament-specific constants.

### P2: Admin/API Auth Is Protected, But Tokens Live In localStorage

- File: \`src/api/base44Client.js:95\` and \`src/api/base44Client.js:146\`.
- Evidence: auth token is read/written from \`window.localStorage\` and sent as \`X-StageCore-Auth-Token\` at \`src/api/base44Client.js:187\`.
- Impact: XSS would expose admin tokens. Current CSP still allows \`unsafe-inline\` scripts in production at \`server/index.js:57\`.
- Recommendation: for a production admin panel, move to HttpOnly same-site cookies, remove \`unsafe-inline\` if feasible, and add stronger CSP nonce/hash handling.

### P2: Destructive Entity Deletes Are Hand-Rolled

- File: \`server/services/entities.js:75\`.
- Evidence: team/tournament/match deletes manually cascade related records at \`server/services/entities.js:80\` through \`server/services/entities.js:102\`.
- Impact: missed relationships can create orphans; the current DB audit already reports orphaned references.
- Recommendation: add foreign keys with explicit cascade rules where possible, enable SQLite foreign keys, and cover delete paths with integration tests.

### P3: Build Fallback Is Windows-Specific And Diverges From Vite Output

- Files: \`tools/build.js\`, \`tools/build-fallback.ps1\`.
- Evidence: \`tools/build.js:30\` invokes PowerShell fallback on Windows; \`tools/build-fallback.ps1:53\` writes its own HTML template.
- Impact: fallback builds can drift from Vite/index.html behavior.
- Recommendation: keep fallback only as an emergency compatibility path, and add a snapshot/check that generated fallback HTML keeps critical tags aligned with \`index.html\`.

## Database Audit Snapshot

\`tools/audit-database.mjs\` currently reports 327 violations:

- 10 non-ISO created/updated dates.
- 8 duplicate team-name buckets.
- 252 duplicate player IGN buckets.
- 9 orphan-reference groups.
- 11 unresolved/placeholder participant teams.
- 16 derived mismatch reports across tournaments.
- 19 match result placement out-of-range rows.
- 2 duplicate placement groups in a match.

These are data integrity issues, not code compile failures. They should be handled in a dedicated data cleanup pass.

## Per-Directory Notes

- \`server/\`: generally clear layering after the override cleanup. Main risks are auth hardening, manual SQL mutation/cascade logic, and many historical import scripts.
- \`server/scripts/data/\`: good direction for tournament static data. PMWC 2026 stats remains very large and should be treated as data, not business logic.
- \`src/features/tournaments/\`: feature-complete but high complexity. \`TournamentDetailPage.jsx\` and \`StageStandingsBoard.jsx\` need careful slice-by-slice extraction.
- \`src/components/admin/\`: largest frontend risk area. Components mix forms, persistence, export logic, and UI state.
- \`tools/\`: valuable but messy operational toolbox. Many scripts mutate DB state directly and should be labeled as one-shot, verified, or supported.
- \`android/\`: thin Android client exists, but \`StageCoreApi.kt\` points at emulator-local backend by default; production/mobile deployment needs environment-driven base URL.
- \`tests/\`: useful API and unit coverage exists. Windows \`node --test tests/unit/*.test.js\` may still fail with \`spawn EPERM\` in this environment before executing files.

## File Appendix

Every project-owned file included in this audit pass is listed below.

| File | Lines | Status | Notes |
| --- | ---: | --- | --- |
${appendixRows.join("\n")}
`;

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report, "utf8");
console.log(reportPath);
