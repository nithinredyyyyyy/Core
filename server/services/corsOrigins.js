import { splitTrimmedValues } from "./schemas.js";

// Local development origins. These are the only origins baked into the code: they
// are loopback-only, so they cannot be reached from another host, and they are
// scoped to non-production so a production deploy never accepts them.
const DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://localhost:5173",
  "https://127.0.0.1:5173",
  "http://localhost:4000",
  "http://127.0.0.1:4000",
  "https://localhost:4000",
  "https://127.0.0.1:4000",
];

/**
 * Build the credentialed CORS allowlist from the environment.
 *
 * FRONTEND_ORIGIN and CORS_ORIGIN each accept a comma-separated list of exact
 * origins. Production origins are configuration, never hardcoded: a deploy names
 * the frontends it serves (Render same-origin, a Vercel frontend, etc.) through
 * these variables. Matching is exact string equality, so there is no wildcard for
 * credentialed requests.
 *
 * @returns {Set<string>} exact origins permitted to send credentialed requests
 */
export function buildAllowedOrigins(env = process.env, { isProduction = false } = {}) {
  const configured = [
    ...splitTrimmedValues(env.FRONTEND_ORIGIN || ""),
    ...splitTrimmedValues(env.CORS_ORIGIN || ""),
  ];

  return new Set([...configured, ...(isProduction ? [] : DEV_ORIGINS)]);
}

/**
 * CORS `origin` callback backed by an exact allowlist.
 *
 * A request with no Origin header (same-origin navigation, curl, health checks) is
 * allowed through; the allowlist only constrains cross-origin browser requests.
 */
export function corsOriginCallback(allowedOrigins) {
  return function origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  };
}
