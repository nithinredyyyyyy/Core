import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  checkProductionTarget,
  assertProductionTarget,
  describeTarget,
  EXPECTED_DISK_MOUNT,
  EXPECTED_DB_FILENAME,
  ProductionTargetError,
} from "../../tools/liquipedia/production-target-guard.mjs";

const EXPECTED_DB = `${EXPECTED_DISK_MOUNT}/${EXPECTED_DB_FILENAME}`;

// The guard hard-codes /tmp as a never-production location, so tests that need to
// simulate a production-shaped mount must use a neutral base, not os.tmpdir().
const NEUTRAL_BASE = "/workspace";
function neutralDir(prefix) {
  return mkdtempSync(join(NEUTRAL_BASE, prefix));
}
function withDir(dir, fn) {
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("production target guard", () => {
  test("accepts the expected persistent-disk path when the file exists", () => {
    withDir(neutralDir("guard-mount-"), (dir) => {
      const dbFile = join(dir, EXPECTED_DB_FILENAME);
      writeFileSync(dbFile, "");
      const result = checkProductionTarget(dbFile, { expectedMount: dir });
      assert.equal(result.ok, true);
      assert.equal(result.production, true);
      assert.equal(result.detail.under_mount, true);
    });
  });

  test("refuses a stale /tmp CORE_DB_PATH when no rehearsal flag is given", () => {
    withDir(mkdtempSync(join(tmpdir(), "guard-stale-")), (dir) => {
      const stale = join(dir, "f.sqlite");
      writeFileSync(stale, "");
      const result = checkProductionTarget(stale);
      assert.equal(result.ok, false);
      assert.equal(result.production, false);
      assert.match(result.detail.reason, /throwaway location/);
    });
  });

  test("refuses a /tmp target that even looks production-shaped, without the flag", () => {
    withDir(mkdtempSync(join(tmpdir(), "guard-shaped-")), (dir) => {
      const dbFile = join(dir, EXPECTED_DB_FILENAME);
      writeFileSync(dbFile, "");
      const result = checkProductionTarget(dbFile);
      assert.equal(result.ok, false);
      assert.equal(result.production, false);
    });
  });

  test("permits a /tmp target only with an explicit rehearsal override", () => {
    withDir(mkdtempSync(join(tmpdir(), "guard-rehearse-")), (dir) => {
      const copy = join(dir, EXPECTED_DB_FILENAME);
      writeFileSync(copy, "");
      const result = checkProductionTarget(copy, { allowRehearsal: true });
      assert.equal(result.ok, true);
      assert.equal(result.production, false);
      assert.equal(result.detail.rehearsal, true);
    });
  });

  test("refuses a path outside the expected mount that is not a throwaway location", () => {
    withDir(neutralDir("guard-other-"), (dir) => {
      withDir(neutralDir("guard-mount2-"), (otherMount) => {
        const dbFile = join(dir, EXPECTED_DB_FILENAME);
        writeFileSync(dbFile, "");
        const result = checkProductionTarget(dbFile, { expectedMount: otherMount });
        assert.equal(result.ok, false);
        assert.match(result.detail.reason, /does not resolve to the expected persistent-disk location/);
      });
    });
  });

  test("refuses a production-mounted path when the file is missing", () => {
    withDir(neutralDir("guard-missing-"), (dir) => {
      const missing = join(dir, EXPECTED_DB_FILENAME);
      const result = checkProductionTarget(missing, { expectedMount: dir });
      assert.equal(result.ok, false);
      assert.equal(result.production, true);
      assert.match(result.detail.reason, /does not exist/);
    });
  });

  test("refuses a wrong filename inside the expected mount", () => {
    withDir(neutralDir("guard-name-"), (dir) => {
      const wrong = join(dir, "other.sqlite");
      writeFileSync(wrong, "");
      const result = checkProductionTarget(wrong, { expectedMount: dir });
      assert.equal(result.ok, false);
      assert.equal(result.production, true);
      assert.match(result.detail.reason, /expected filename/);
    });
  });

  test("assertProductionTarget throws with an actionable message", () => {
    withDir(mkdtempSync(join(tmpdir(), "guard-throw-")), (dir) => {
      const stale = join(dir, "f.sqlite");
      writeFileSync(stale, "");
      assert.throws(
        () => assertProductionTarget(stale),
        (error) => {
          assert.ok(error instanceof ProductionTargetError);
          assert.match(error.message, /Refusing to operate on an unexpected database target/);
          assert.match(error.message, /rehearsal override/);
          return true;
        },
      );
    });
  });

  test("describeTarget distinguishes production from rehearsal", () => {
    withDir(neutralDir("guard-desc-"), (dir) => {
      const dbFile = join(dir, EXPECTED_DB_FILENAME);
      writeFileSync(dbFile, "");
      assert.match(describeTarget(checkProductionTarget(dbFile, { expectedMount: dir })), /^production/);
      assert.match(describeTarget(checkProductionTarget(dbFile, { allowRehearsal: true })), /non-production/);
    });
  });

  test("the expected mount constant matches render.yaml", () => {
    assert.equal(EXPECTED_DISK_MOUNT, "/app/server/data");
    assert.equal(EXPECTED_DB, "/app/server/data/stagecore.sqlite");
  });
});
