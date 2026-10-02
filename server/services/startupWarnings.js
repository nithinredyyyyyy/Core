import { splitTrimmedValues } from './schemas.js';

/** Return configuration warnings without including any configured values. */
export function startupWarnings(env = process.env) {
  const warnings = [];
  if (!splitTrimmedValues(env.CORE_ADMIN_EMAILS || '').length) {
    warnings.push('CORE_ADMIN_EMAILS is empty; no account can access administration. Restart after configuring the allowlist.');
  }
  if (Buffer.byteLength(env.CORE_AUTH_SESSION_SECRET || '', 'utf8') < 32) {
    warnings.push('CORE_AUTH_SESSION_SECRET is missing or shorter than 32 bytes; configure a stable random secret of at least 32 bytes. Rotation signs everyone out.');
  }
  if (env.NODE_ENV === 'production') {
    for (const name of ['FRONTEND_ORIGIN', 'CORS_ORIGIN']) {
      if (!splitTrimmedValues(env[name] || '').length || String(env[name]).includes('*')) {
        warnings.push(`${name} is unset or contains a wildcard in production; verify exact allowed origins. Wildcards do not authorize credentialed requests.`);
      }
    }
  }
  return warnings;
}
