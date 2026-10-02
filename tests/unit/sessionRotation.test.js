import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

// A process restart is the deployment boundary. Mock only Google's verified
// identity response; exercise the real sign-in route, cookies and /auth/me.
const probe = `
import { OAuth2Client } from 'google-auth-library';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
OAuth2Client.prototype.verifyIdToken = async () => ({ getPayload: () => ({ sub: 'rotation-test', email: 'admin@example.test', email_verified: true }) });
const { httpServer } = await import('./server/index.js');
await new Promise(resolve => httpServer.listen(0, '127.0.0.1', resolve));
try {
  const base = 'http://127.0.0.1:' + httpServer.address().port;
  if (existsSync(process.env.OLD_COOKIE_FILE)) {
    const old = await fetch(base + '/api/auth/me', { headers: { cookie: readFileSync(process.env.OLD_COOKIE_FILE, 'utf8') } });
    if (old.status !== 401) throw new Error('Old session survived rotation');
  }
  const signin = await fetch(base + '/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: 'synthetic-verified-identity' }) });
  if (signin.status !== 201) throw new Error('Fresh sign-in failed');
  const cookie = signin.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
  const me = await fetch(base + '/api/auth/me', { headers: { cookie } });
  if (me.status !== 200 || (await me.json()).role !== 'admin') throw new Error('Fresh session rejected');
  writeFileSync(process.env.NEW_COOKIE_FILE, cookie, { mode: 0o600 });
} finally { httpServer.closeAllConnections(); await new Promise(resolve => httpServer.close(resolve)); }
`;

test('rotating the session secret rejects old sessions and a fresh Google sign-in succeeds', () => {
  const temporary = mkdtempSync(path.join(tmpdir(), 'core-rotation-'));
  try {
    const oldCookie = path.join(temporary, 'old-cookie');
    for (const phase of [0, 1]) {
      const result = spawnSync(process.execPath, ['--input-type=module', '-e', probe], {
        cwd: new URL('../..', import.meta.url), encoding: 'utf8', timeout: 60_000,
        env: { ...process.env, NODE_ENV: 'test', CORE_DB_PATH: path.join(temporary, 'test.sqlite'),
          CORE_ADMIN_EMAILS: 'admin@example.test', GOOGLE_CLIENT_ID: 'synthetic-client-id',
          CORE_AUTH_SESSION_SECRET: randomBytes(32).toString('hex'), OLD_COOKIE_FILE: oldCookie,
          NEW_COOKIE_FILE: phase === 0 ? oldCookie : path.join(temporary, 'fresh-cookie') },
      });
      // Do not expose child stdout or cookies if a failure occurs.
      assert.equal(result.status, 0, `Rotation phase ${phase} failed: ${result.error?.message || 'child assertion failed'}`);
    }
  } finally { rmSync(temporary, { recursive: true, force: true }); }
});
