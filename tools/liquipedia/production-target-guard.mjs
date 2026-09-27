// Production-target guard for operator actions.
//
// The approved architecture puts the runtime database on a Render Persistent Disk
// mounted at /app/server/data (render.yaml). An operator action must prove it is
// pointed at that disk before mutating anything.
//
// The failure this exists to prevent: a stale or exported CORE_DB_PATH (for
// example `/tmp/tmp.*/f.sqlite` left over from a test run) silently redirects a
// "production" apply into a throwaway file. The operator sees a successful apply
// against the wrong database. That is worse than a hard failure.
//
// The guard is deliberately explicit about being override-able, so a legitimate
// rehearsal against a copy is possible — but it can never be overridden silently.

import fs from "node:fs";
import path from "node:path";

export const EXPECTED_DISK_MOUNT = "/app/server/data";
export const EXPECTED_DB_FILENAME = "stagecore.sqlite";

// Paths that must never be treated as production, independent of any flag. These
// are the throwaway locations tests and pilots use.
const FORBIDDEN_PREFIXES = ["/tmp/", "/var/folders/", "/private/var/folders/"];

export class ProductionTargetError extends Error {
  constructor(message, detail) {
    super(message);
    this.name = "ProductionTargetError";
    this.detail = detail;
  }
}

/**
 * @param {string} dbPath              resolved or raw path being targeted
 * @param {object} [opts]
 * @param {string} [opts.expectedMount]  mount the disk must live under
 * @param {boolean} [opts.allowRehearsal] permit a non-production target (explicit opt-in)
 * @param {string} [opts.rehearsalReason] why the override is acceptable
 * @param {string[]} [opts.forbiddenPrefixes] never-production prefixes; a test seam,
 *   production always uses the default
 * @returns {{ ok: boolean, production: boolean, detail: object }}
 */
export function checkProductionTarget(dbPath, opts = {}) {
  const expectedMount = opts.expectedMount ?? process.env.CORE_EXPECTED_DISK_MOUNT ?? EXPECTED_DISK_MOUNT;
  const forbiddenPrefixes = opts.forbiddenPrefixes ?? FORBIDDEN_PREFIXES;
  const resolved = path.resolve(dbPath);
  const filename = path.basename(resolved);

  // A forbidden prefix is never production. It is still a valid rehearsal target
  // when an operator explicitly opts in, because that is exactly where throwaway
  // copies live.
  const underMount =
    resolved === path.join(expectedMount, EXPECTED_DB_FILENAME) ||
    resolved.startsWith(`${expectedMount}${path.sep}`);
  const forbidden = forbiddenPrefixes.some((p) => resolved.startsWith(p));
  const filenameOk = filename === EXPECTED_DB_FILENAME;
  const exists = fs.existsSync(resolved);

  const detail = {
    resolved,
    expected_mount: expectedMount,
    expected_filename: EXPECTED_DB_FILENAME,
    under_mount: underMount,
    forbidden_prefix: forbidden,
    filename_ok: filenameOk,
    exists,
  };

  if (opts.allowRehearsal) {
    return {
      ok: true,
      production: false,
      detail: {
        ...detail,
        rehearsal: true,
        reason: opts.rehearsalReason || "explicit rehearsal override",
      },
    };
  }

  if (forbidden) {
    return {
      ok: false,
      production: false,
      detail: { ...detail, reason: "target is in a throwaway location, never production; pass --rehearsal for an intentional copy" },
    };
  }

  const isProduction = underMount;
  if (isProduction) {
    if (!filenameOk) {
      return { ok: false, production: true, detail: { ...detail, reason: `expected filename ${EXPECTED_DB_FILENAME}` } };
    }
    if (!exists) {
      return { ok: false, production: true, detail: { ...detail, reason: "database file does not exist" } };
    }
    return { ok: true, production: true, detail };
  }

  return {
    ok: false,
    production: false,
    detail: {
      ...detail,
      reason: `CORE_DB_PATH does not resolve to the expected persistent-disk location ${path.join(expectedMount, EXPECTED_DB_FILENAME)}`,
    },
  };
}

/**
 * Fail fast unless the target is the expected persistent disk, or a rehearsal
 * override was explicitly requested. Throws ProductionTargetError otherwise.
 */
export function assertProductionTarget(dbPath, opts = {}) {
  const result = checkProductionTarget(dbPath, opts);
  if (!result.ok) {
    const d = result.detail;
    throw new ProductionTargetError(
      `Refusing to operate on an unexpected database target: ${d.resolved}\n` +
        `  reason: ${d.reason}\n` +
        `  expected: ${path.join(d.expected_mount, d.expected_filename)}\n` +
        `  observed: CORE_DB_PATH=${process.env.CORE_DB_PATH ?? "<unset>"}\n` +
        `  For an intentional rehearsal against a copy, pass an explicit rehearsal override.`,
      d,
    );
  }
  return result;
}

export function describeTarget(result) {
  const d = result.detail;
  if (result.production) return `production (${d.resolved})`;
  return `rehearsal / non-production (${d.resolved})${d.rehearsal ? " [override]" : ""}`;
}
