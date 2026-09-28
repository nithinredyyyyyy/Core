import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  SOURCE_CORRECTION_POLICY_VERSION,
  SOURCE_CORRECTION_STATUS,
  APPROVED_SOURCE_CORRECTIONS,
  reconcileMapCorrections,
  approvedCorrectionsExercised,
  buildMapReconciliation,
} from "../../tools/liquipedia/source-correction-policy.mjs";

// The pre-apply CORE shape for BMPS 2025 Grand Finals: 18 placeholder rows, all
// maps as stored before extraction. Mirrors the observed production baseline.
const CORE_PLACEHOLDERS = [
  ...[1, 4, 6, 7, 10, 12, 13, 16, 18].map((n) => ({ match_number: n, map: "Erangel" })),
  ...[2, 5, 8, 11, 14, 17].map((n) => ({ match_number: n, map: "Miramar" })),
  ...[3, 9, 15].map((n) => ({ match_number: n, map: "Sanhok" })),
];

// Source-derived maps. m4/m10/m16 differ (Sanhok in the source, Erangel in CORE),
// matching the approved decision record.
const SOURCE_MATCHES = [
  { match_number: 1, map: "Erangel" },
  { match_number: 2, map: "Miramar" },
  { match_number: 3, map: "Sanhok" },
  { match_number: 4, map: "Sanhok" },
  { match_number: 5, map: "Miramar" },
  { match_number: 6, map: "Erangel" },
  { match_number: 7, map: "Erangel" },
  { match_number: 8, map: "Miramar" },
  { match_number: 9, map: "Sanhok" },
  { match_number: 10, map: "Sanhok" },
  { match_number: 11, map: "Miramar" },
  { match_number: 12, map: "Erangel" },
  { match_number: 13, map: "Erangel" },
  { match_number: 14, map: "Miramar" },
  { match_number: 15, map: "Sanhok" },
  { match_number: 16, map: "Sanhok" },
  { match_number: 17, map: "Miramar" },
  { match_number: 18, map: "Erangel" },
];

describe("source-correction policy (PRESERVE_SOURCE_V1)", () => {
  test("the approved record names exactly m4, m10, m16 map corrections", () => {
    assert.equal(SOURCE_CORRECTION_POLICY_VERSION, "PRESERVE_SOURCE_V1");
    const keys = APPROVED_SOURCE_CORRECTIONS.map((c) => `${c.match_number}:${c.field}`);
    assert.deepEqual(keys.sort(), ["10:map", "16:map", "4:map"]);
    for (const c of APPROVED_SOURCE_CORRECTIONS) {
      assert.equal(c.existing_core, "Erangel");
      assert.equal(c.source, "Sanhok");
      assert.equal(c.status, SOURCE_CORRECTION_STATUS.CORRECTION);
    }
  });

  test("classifies the three observed differences as approved corrections", () => {
    const { corrections, unapproved } = reconcileMapCorrections(CORE_PLACEHOLDERS, SOURCE_MATCHES);
    assert.equal(corrections.length, 3);
    assert.equal(unapproved.length, 0);
    const numbers = corrections.map((c) => c.match_number).sort((a, b) => a - b);
    assert.deepEqual(numbers, [4, 10, 16]);
    for (const c of corrections) {
      assert.equal(c.status, "SOURCE_CORRECTION");
      assert.equal(c.field, "map");
      assert.equal(c.policy, "PRESERVE_SOURCE_V1");
      assert.equal(c.existing_core, "Erangel");
      assert.equal(c.source, "Sanhok");
    }
  });

  test("leaves the 15 unchanged match maps out of the correction list", () => {
    const { unchanged, corrections } = reconcileMapCorrections(CORE_PLACEHOLDERS, SOURCE_MATCHES);
    assert.equal(unchanged.length, 15);
    assert.equal(corrections.length + unchanged.length, 18);
  });

  test("an unapproved difference is a tripwire, not a silent correction", () => {
    const tampered = SOURCE_MATCHES.map((m) => (m.match_number === 7 ? { ...m, map: "Miramar" } : m));
    const { corrections, unapproved } = reconcileMapCorrections(CORE_PLACEHOLDERS, tampered);
    assert.equal(corrections.length, 3, "approved corrections still reported");
    assert.equal(unapproved.length, 1, "unapproved difference must surface");
    assert.equal(unapproved[0].match_number, 7);
    assert.equal(unapproved[0].status, "UNAPPROVED_SOURCE_DIFFERS");
    assert.equal(unapproved[0].policy, null);
  });

  test("an approved entry whose observed values no longer match is unapproved", () => {
    // CORE changed under us: m4 is now Vikendi instead of the approved Erangel.
    const driftedCore = CORE_PLACEHOLDERS.map((m) => (m.match_number === 4 ? { ...m, map: "Vikendi" } : m));
    const { corrections, unapproved } = reconcileMapCorrections(driftedCore, SOURCE_MATCHES);
    assert.equal(corrections.length, 2);
    const m4 = unapproved.find((u) => u.match_number === 4);
    assert.ok(m4, "m4 drift must be reported");
    assert.match(m4.detail, /does not match observed values/);
  });

  test("approved-all-exercised is false when an approval never fires", () => {
    const onlyM10M16 = SOURCE_MATCHES.filter((m) => m.match_number !== 4);
    const { corrections } = reconcileMapCorrections(CORE_PLACEHOLDERS, onlyM10M16);
    const exercised = approvedCorrectionsExercised(corrections);
    assert.equal(exercised.allExercised, false);
    assert.deepEqual(exercised.missing.map((m) => m.match_number), [4]);
  });

  test("buildMapReconciliation marks the pilot safe to apply", () => {
    const block = buildMapReconciliation(CORE_PLACEHOLDERS, SOURCE_MATCHES);
    assert.equal(block.safe_to_apply, true);
    assert.equal(block.approved_all_exercised, true);
    assert.equal(block.corrections.length, 3);
    assert.equal(block.unapproved.length, 0);
    assert.equal(block.unchanged_count, 15);
    assert.equal(block.policy_version, "PRESERVE_SOURCE_V1");
    // The scope note must not read as a general rule.
    assert.match(block.note, /Not a general/);
    assert.match(block.scope, /map identity only/);
  });

  test("buildMapReconciliation is not safe when an unapproved difference exists", () => {
    const tampered = SOURCE_MATCHES.map((m) => (m.match_number === 2 ? { ...m, map: "Erangel" } : m));
    const block = buildMapReconciliation(CORE_PLACEHOLDERS, tampered);
    assert.equal(block.safe_to_apply, false);
    assert.equal(block.unapproved.length, 1);
  });

  test("a match absent from CORE produces no correction entry", () => {
    const sourceWithExtra = [...SOURCE_MATCHES, { match_number: 99, map: "Sanhok" }];
    const { corrections, unapproved } = reconcileMapCorrections(CORE_PLACEHOLDERS, sourceWithExtra);
    assert.equal(corrections.length, 3);
    assert.equal(unapproved.length, 0);
  });

  test("an empty source yields no corrections and no unapproved differences", () => {
    const { corrections, unapproved, unchanged } = reconcileMapCorrections(CORE_PLACEHOLDERS, []);
    assert.equal(corrections.length, 0);
    assert.equal(unapproved.length, 0);
    assert.equal(unchanged.length, 0);
  });
});
