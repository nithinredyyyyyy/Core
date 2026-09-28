import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
// Use /tmp explicitly: it exists on Linux CI and is the guard's real forbidden
// prefix, so the default-rule tests are deterministic regardless of TMPDIR.
const TMP = "/tmp";
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

function withDir(dir, fn) {
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Tests create temp dirs under /tmp, which the guard treats as never-production by
// default. The mount-simulation tests pass the forbidden-prefix test seam so a
// temp dir can stand in for a real mount. The default guard behaviour, including
// the real /tmp rule, is exercised by the stale-path and override tests below.
function mountOpts(mount) {
  return { expectedMount: mount, forbiddenPrefixes: [] };
}

describe("production target guard", () => {
  test("accepts the expected persistent-disk path when the file exists", () => {
    withDir(mkdtempSync(join(TMP, "guard-mount-")), (dir) => {
      const dbFile = join(dir, EXPECTED_DB_FILENAME);
      writeFileSync(dbFile, "");
      const result = checkProductionTarget(dbFile, mountOpts(dir));
      assert.equal(result.ok, true);
      assert.equal(result.production, true);
      assert.equal(result.detail.under_mount, true);
    });
  });

  test("refuses a stale /tmp CORE_DB_PATH when no rehearsal flag is given", () => {
    withDir(mkdtempSync(join(TMP, "guard-stale-")), (dir) => {
      const stale = join(dir, "f.sqlite");
      writeFileSync(stale, "");
      const result = checkProductionTarget(stale);
      assert.equal(result.ok, false);
      assert.equal(result.production, false);
      assert.match(result.detail.reason, /throwaway location/);
    });
  });

  test("refuses a /tmp target that even looks production-shaped, without the flag", () => {
    withDir(mkdtempSync(join(TMP, "guard-shaped-")), (dir) => {
      const dbFile = join(dir, EXPECTED_DB_FILENAME);
      writeFileSync(dbFile, "");
      const result = checkProductionTarget(dbFile);
      assert.equal(result.ok, false);
      assert.equal(result.production, false);
    });
  });

  test("permits a /tmp target only with an explicit rehearsal override", () => {
    withDir(mkdtempSync(join(TMP, "guard-rehearse-")), (dir) => {
      const copy = join(dir, EXPECTED_DB_FILENAME);
      writeFileSync(copy, "");
      const result = checkProductionTarget(copy, { allowRehearsal: true });
      assert.equal(result.ok, true);
      assert.equal(result.production, false);
      assert.equal(result.detail.rehearsal, true);
    });
  });

  test("refuses a path outside the expected mount that is not a throwaway location", () => {
    withDir(mkdtempSync(join(TMP, "guard-other-")), (dir) => {
      withDir(mkdtempSync(join(TMP, "guard-mount2-")), (otherMount) => {
        const dbFile = join(dir, EXPECTED_DB_FILENAME);
        writeFileSync(dbFile, "");
        const result = checkProductionTarget(dbFile, mountOpts(otherMount));
        assert.equal(result.ok, false);
        assert.match(result.detail.reason, /does not resolve to the expected persistent-disk location/);
      });
    });
  });

  test("refuses a production-mounted path when the file is missing", () => {
    withDir(mkdtempSync(join(TMP, "guard-missing-")), (dir) => {
      const missing = join(dir, EXPECTED_DB_FILENAME);
      const result = checkProductionTarget(missing, mountOpts(dir));
      assert.equal(result.ok, false);
      assert.equal(result.production, true);
      assert.match(result.detail.reason, /does not exist/);
    });
  });

  test("refuses a wrong filename inside the expected mount", () => {
    withDir(mkdtempSync(join(TMP, "guard-name-")), (dir) => {
      const wrong = join(dir, "other.sqlite");
      writeFileSync(wrong, "");
      const result = checkProductionTarget(wrong, mountOpts(dir));
      assert.equal(result.ok, false);
      assert.equal(result.production, true);
      assert.match(result.detail.reason, /expected filename/);
    });
  });

  test("assertProductionTarget throws with an actionable message", () => {
    withDir(mkdtempSync(join(TMP, "guard-throw-")), (dir) => {
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
    withDir(mkdtempSync(join(TMP, "guard-desc-")), (dir) => {
      const dbFile = join(dir, EXPECTED_DB_FILENAME);
      writeFileSync(dbFile, "");
      assert.match(describeTarget(checkProductionTarget(dbFile, mountOpts(dir))), /^production/);
      assert.match(describeTarget(checkProductionTarget(dbFile, { allowRehearsal: true })), /non-production/);
    });
  });

  test("the expected mount constant matches render.yaml", () => {
    assert.equal(EXPECTED_DISK_MOUNT, "/app/server/data");
    assert.equal(EXPECTED_DB, "/app/server/data/stagecore.sqlite");
  });
});
