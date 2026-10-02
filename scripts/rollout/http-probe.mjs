/** Production-mode HTTP assertions on a fresh temporary seed; no remote writes. */
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, openSync, closeSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
const output = path.resolve(process.argv[2] || '/tmp/core-http-evidence');
mkdirSync(output, { recursive: true });
const temporary = mkdtempSync(path.join(tmpdir(), 'core-http-'));
const socket = createServer();
await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const base = `http://localhost:${port}`;
const log = openSync(path.join(output, 'http-server.log'), 'w', 0o600);
const child = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, NODE_ENV: 'production',
  PORT: String(port), CORE_DB_PATH: path.join(temporary, 'seed.sqlite'), CORE_AUTH_SESSION_SECRET: randomBytes(32).toString('hex'),
  CORE_ADMIN_EMAILS: 'operator@example.test', GOOGLE_CLIENT_ID: 'synthetic-client-id', FRONTEND_ORIGIN: base, CORS_ORIGIN: base }, stdio: ['ignore', log, log] });
const report = { revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), checks: [] };
try {
  let ready = false;
  for (let n = 0; n < 120; n++) {
    try { ready = (await fetch(base + '/api/health')).ok; } catch { /* starting */ }
    if (ready) break;
    if (child.exitCode !== null) throw new Error('Server failed startup');
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready);
  for (const route of ['/api/health', '/landing', '/sw.js', '/sw-cleanup.js']) {
    const headers = path.join(output, route.slice(1).replaceAll('/', '-') + '.headers');
    execFileSync('curl', ['--fail', '--silent', '--show-error', '--dump-header', headers, '--output', '/dev/null', base + route]);
    const text = readFileSync(headers, 'utf8');
    if (route === '/api/health') assert.match(text, /x-request-id: [a-f0-9-]{36}/i);
    if (route === '/landing') {
      assert.match(text, /content-security-policy:.*default-src 'self'/i);
      assert.match(text, /strict-transport-security: max-age=31536000; includeSubDomains/i);
      assert.match(text, /x-frame-options: SAMEORIGIN/i);
      assert.match(text, /referrer-policy: no-referrer/i);
    }
    report.checks.push({ route, status: 200, headersFile: path.basename(headers) });
  }
  const statuses = [];
  for (let n = 0; n < 21; n++) {
    const response = await fetch(base + '/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    const body = await response.json();
    statuses.push(response.status);
    assert.equal(body.requestId, response.headers.get('x-request-id'));
    assert.ok(!JSON.stringify(body).includes('SyntaxError'));
    if (n === 20) {
      assert.equal(response.status, 429);
      assert.ok(response.headers.has('retry-after'));
      writeFileSync(path.join(output, 'rate-limit.json'), JSON.stringify({ status: response.status, headers: Object.fromEntries(response.headers), body }, null, 2));
    } else assert.equal(response.status, 400);
  }
  report.checks.push({ check: '21 malformed sign-ins', statuses });
  const sw = await (await fetch(base + '/sw.js')).text();
  assert.ok(sw.includes('sw-cleanup.js'));
  assert.ok(sw.includes('NetworkOnly'));
  report.checks.push({ check: 'PWA includes cleanup and NetworkOnly API strategy', passed: true });
} finally {
  child.kill('SIGTERM');
  await new Promise(resolve => { if (child.exitCode !== null) resolve(); else child.once('exit', resolve); });
  closeSync(log);
  rmSync(temporary, { recursive: true, force: true });
  writeFileSync(path.join(output, 'http-probe.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify(report, null, 2));
