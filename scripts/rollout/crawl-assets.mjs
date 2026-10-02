/** Boot the production bundle on a disposable canonical-seeded SQLite database.
 * Attach to the shared browser, crawl every seeded public detail route, and fail
 * on ANY asset 404 or broken rendered image. Never opens the committed DB.
 * Usage: node scripts/rollout/crawl-assets.mjs /absolute/output-directory
 * Requires npm run build and coderabbit-agent-browser's shared Chromium session.
 */
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, openSync, closeSync, cpSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import Database from 'better-sqlite3';
import { chromium } from 'playwright';

const output = path.resolve(process.argv[2] || '/tmp/core-crawl-evidence');
mkdirSync(output, { recursive: true });
const temporary = mkdtempSync(path.join(tmpdir(), 'core-rollout-crawl-'));
const dbPath = path.join(temporary, 'seed.sqlite');
// Freeze the build: later validation builds must not remove chunks mid-crawl.
cpSync('dist', path.join(temporary, 'dist'), { recursive: true });
cpSync('server', path.join(temporary, 'server'), { recursive: true, filter: source => !source.startsWith(path.join('server', 'data')) });
symlinkSync(path.resolve('node_modules'), path.join(temporary, 'node_modules'), 'dir');
const probe = createServer();
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const origin = `http://localhost:${port}`;
const log = openSync(path.join(output, 'crawl-server.log'), 'w', 0o600);
const server = spawn(process.execPath, [path.join(temporary, 'server/index.js')], {
  env: { ...process.env, NODE_ENV: 'production', PORT: String(port), CORE_DB_PATH: dbPath,
    CORE_AUTH_SESSION_SECRET: randomBytes(32).toString('hex'), CORE_ADMIN_EMAILS: '',
    GOOGLE_CLIENT_ID: '', FRONTEND_ORIGIN: origin, CORS_ORIGIN: origin },
  stdio: ['ignore', log, log],
});
let browser, context;
const report = { revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  seedSha256: createHash('sha256').update(readFileSync('server/seed/canonical.export.json')).digest('hex'),
  started: new Date().toISOString(), origin, routes: [], asset404s: [], brokenImages: [], requestFailures: [], apiFailures: [], pageErrors: [], assetResponses: 0 };
try {
  let healthy = false;
  for (let n = 0; n < 120; n++) {
    if ((server.exitCode !== null || server.signalCode !== null)) throw new Error(`Server exited ${server.exitCode}`);
    try { healthy = (await fetch(`${origin}/api/health`)).ok; } catch { /* startup */ }
    if (healthy) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!healthy) throw new Error('Readiness timed out');
  const db = new Database(dbPath, { readonly: true });
  const catalog = {
    tournaments: db.prepare('SELECT id FROM tournaments').all().map(r => `/tournaments?id=${encodeURIComponent(r.id)}`),
    teams: db.prepare('SELECT name FROM teams').all().map(r => `/teams?team=${encodeURIComponent(r.name)}`),
    players: db.prepare('SELECT ign FROM players').all().map(r => `/players/${encodeURIComponent(r.ign)}`),
    matches: db.prepare('SELECT id FROM matches').all().map(r => `/matches/${encodeURIComponent(r.id)}`),
    news: db.prepare('SELECT id FROM news_articles').all().map(r => `/news/${encodeURIComponent(r.id)}`),
  };
  db.close();
  report.catalogCounts = Object.fromEntries(Object.entries(catalog).map(([key, routes]) => [key, routes.length]));
  const routes = [...new Set(['/', '/landing', '/signin', '/app', '/tournaments', '/teams', '/players', '/matches', '/leaderboard', '/rankings', '/news', ...Object.values(catalog).flat()])];
  browser = await chromium.connectOverCDP(execFileSync('coderabbit-agent-browser', ['get', 'cdp-url'], { encoding: 'utf8' }).trim());
  context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await context.newPage();
  let currentRoute = '/', pending = new Set();
  const assetTypes = new Set(['image', 'font', 'stylesheet', 'script', 'media', 'manifest']);
  page.on('request', request => { if (new URL(request.url()).origin === origin) pending.add(request); });
  page.on('requestfinished', request => pending.delete(request));
  page.on('requestfailed', request => {
    pending.delete(request);
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') report.requestFailures.push({ route: currentRoute, url: request.url(), error: request.failure()?.errorText });
  });
  page.on('pageerror', error => report.pageErrors.push({ route: currentRoute, message: error.message }));
  page.on('response', response => {
    pending.delete(response.request());
    const type = response.request().resourceType();
    if (assetTypes.has(type)) {
      report.assetResponses++;
      if (response.status() === 404) report.asset404s.push({ route: currentRoute, url: response.url(), type });
    }
    if (response.url().startsWith(`${origin}/api/`) && response.status() >= 400 && !response.url().endsWith('/auth/me')) report.apiFailures.push({ route: currentRoute, url: response.url(), status: response.status() });
  });
  // Preserve normal limits. Pace API requests below 120/min even on cache expiry.
  // Serial dispatch controls bursts without mocking responses or changing keys.
  let nextApiAt = 0;
  await page.route(`${origin}/api/**`, async route => {
    const at = Math.max(Date.now(), nextApiAt);
    nextApiAt = at + 550;
    await new Promise(resolve => setTimeout(resolve, Math.max(0, at - Date.now())));
    await route.continue();
  });
  const settle = async () => {
    const deadline = Date.now() + 45_000;
    let quietSince = Date.now();
    while (Date.now() < deadline) {
      if ((server.exitCode !== null || server.signalCode !== null)) throw new Error('Server stopped during crawl');
      if (pending.size) quietSince = Date.now();
      if (!pending.size && Date.now() - quietSince > 200) return;
      await page.waitForTimeout(50);
    }
    throw new Error(`Network did not settle on ${currentRoute}: ${[...pending].map(r => r.url()).join(", ")}`);
  };
  for (const route of routes) {
    currentRoute = route;
    if (!report.routes.length) await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
    else await page.evaluate(next => { history.pushState({}, '', next); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0, 0); }, route);
    await settle();
    // Trigger lazy images across the full page, including rows below the fold.
    await page.evaluate(() => { document.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'eager'; }); window.scrollTo(0, document.body.scrollHeight); });
    await settle();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => !document.body.innerText.includes('Something went wrong'), null, { timeout: 5000 });
    const state = await page.evaluate(() => ({ heading: document.querySelector('h1')?.textContent || '',
      broken: [...document.images].filter(img => img.currentSrc && img.complete && img.naturalWidth === 0).map(img => img.currentSrc),
      body: document.body.textContent.slice(0, 300) }));
    if (!state.heading || (route.startsWith('/teams?team=') && state.heading === 'Teams')) throw new Error(`Seeded detail did not render on ${route}`);
    report.brokenImages.push(...state.broken.map(url => ({ route, url })));
    report.routes.push({ route, heading: state.heading, brokenImages: state.broken.length });
    if (report.routes.length % 50 === 0) {
      writeFileSync(path.join(output, 'crawl-progress.json'), JSON.stringify(report, null, 2));
      console.log(`Crawled ${report.routes.length}/${routes.length}; asset404=${report.asset404s.length}; apiErrors=${report.apiFailures.length}`);
    }
  }
  report.expectedRoutes = routes.length;
} catch (error) {
  report.fatal = error.message;
} finally {
  report.finished = new Date().toISOString();
  await context?.close();
  await browser?.close();
  server.kill('SIGTERM');
  await new Promise(resolve => { if ((server.exitCode !== null || server.signalCode !== null)) resolve(); else server.once('exit', resolve); });
  closeSync(log);
  rmSync(temporary, { recursive: true, force: true });
  writeFileSync(path.join(output, 'crawl.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ routes: report.routes.length, expected: report.expectedRoutes, catalog: report.catalogCounts,
  assetResponses: report.assetResponses, asset404s: report.asset404s.length, brokenImages: report.brokenImages.length,
  apiFailures: report.apiFailures.length, pageErrors: report.pageErrors.length, requestFailures: report.requestFailures.length, fatal: report.fatal }, null, 2));
if (report.fatal || report.asset404s.length || report.brokenImages.length || report.apiFailures.length || report.pageErrors.length || report.requestFailures.length) process.exitCode = 1;
