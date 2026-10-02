import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startupWarnings } from '../../server/services/startupWarnings.js';

test('startup warnings identify missing production configuration without values', () => {
  assert.equal(startupWarnings({ NODE_ENV: 'production' }).length, 4);
  const secret = 'private-short-value';
  const origin = 'https://*.private.example';
  const warnings = startupWarnings({ NODE_ENV: 'production', CORE_AUTH_SESSION_SECRET: secret, FRONTEND_ORIGIN: origin });
  assert.equal(warnings.length, 4);
  assert.ok(!warnings.join('\n').includes(secret));
  assert.ok(!warnings.join('\n').includes(origin));
});

test('secret length is UTF-8 bytes; origin warnings apply only in production', () => {
  const env = { CORE_ADMIN_EMAILS: ' admin@example.test, ', CORE_AUTH_SESSION_SECRET: 'é'.repeat(16) };
  assert.deepEqual(startupWarnings(env), []);
  assert.equal(startupWarnings({ ...env, CORE_AUTH_SESSION_SECRET: 'a'.repeat(31) }).length, 1);
  assert.deepEqual(startupWarnings({ ...env, NODE_ENV: 'production', FRONTEND_ORIGIN: 'https://app.example', CORS_ORIGIN: 'https://app.example' }), []);
});
