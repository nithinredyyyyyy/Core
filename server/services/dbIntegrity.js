import { db } from "../db.js";
import { logger } from "./logger.js";

// Startup safety for the persistent SQLite database.
//
// The database lives on a Render persistent disk and is the primary source of
// truth. Two rules matter here:
//
//   1. A populated database must never be silently replaced by seed data or by
//      a GitHub backup. Callers enforce that by consulting databaseHasData().
//   2. A corrupt database must fail loudly instead of resetting to seed. If
//      SQLite reports the file as malformed we exit non-zero so the deploy is
//      visibly unhealthy and an operator can recover from a snapshot.
//
// An empty or brand-new database is expected on first boot: it is created by
// server/db/schema.js and bootstrapped from the canonical export. That case is
// reported as "empty" and is not a failure.

const INTEGRITY_CHECK_ITERATIONS = 100;

export function checkDatabaseIntegrity() {
  const hasTables = db
    .prepare("SELECT count(*) as c FROM sqlite_master WHERE type = 'table'")
    .get().c;

  if (hasTables === 0) {
    logger.info("Database integrity: new/empty database, nothing to verify yet.");
    return { status: "empty" };
  }

  let integrity;
  try {
    // Running integrity_check on the live connection also exercises page reads;
    // a malformed file throws here rather than returning "ok".
    integrity = db.pragma(`integrity_check(${INTEGRITY_CHECK_ITERATIONS})`);
  } catch (error) {
    logger.error("Database integrity check could not run on a non-empty database.", {
      error: error?.message || String(error),
    });
    return { status: "corrupt", reason: error?.message || String(error) };
  }

  const integrityOk =
    Array.isArray(integrity) &&
    integrity.length === 1 &&
    integrity[0]?.integrity_check === "ok";

  if (!integrityOk) {
    logger.error("Database integrity check FAILED on a non-empty database.", {
      result: JSON.stringify(integrity).slice(0, 500),
    });
    return { status: "corrupt", reason: "integrity_check did not return ok" };
  }

  const foreignKeyViolations = db.pragma("foreign_key_check");
  if (foreignKeyViolations.length > 0) {
    // Foreign-key drift is repairable by the existing repair routines, so it is
    // reported rather than treated as fatal corruption.
    logger.warn("Database foreign_key_check reported violations.", {
      count: foreignKeyViolations.length,
    });
    return { status: "ok", foreignKeyViolations: foreignKeyViolations.length };
  }

  logger.info("Database integrity: ok, foreign_key_check: clean.");
  return { status: "ok", foreignKeyViolations: 0 };
}

// Returns true when the app may proceed to start. A corrupt non-empty database
// returns false so the caller can exit without touching the data.
export function assertDatabaseUsable() {
  const result = checkDatabaseIntegrity();
  if (result.status === "corrupt") {
    logger.error(
      "Refusing to start: the persistent database failed integrity checks. " +
        "No seed or backup data will be applied over it. Recover from a disk " +
        "snapshot or the GitHub backup before restarting.",
    );
    return false;
  }
  return true;
}
