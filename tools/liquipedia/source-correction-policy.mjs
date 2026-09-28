// Source-correction policy for the BMPS 2025 Grand Finals pilot.
//
// Scope: this is a per-pilot decision record, NOT a general rule. It does not say
// "the source always wins". It names the exact field-level corrections that have
// been reviewed and approved, and classifies every difference that is actually
// observed. Anything not on the approved list is surfaced as UNAPPROVED and blocks
// the apply, so a silent overwrite is impossible.
//
// Decision (operator, 2026-09-26): accept the source (Liquipedia) map values for
// m4, m10, m16. Rationale is provenance only:
//   - the CORE rows are pre-extraction placeholders carrying Erangel,
//   - the source explicitly publishes Sanhok for those matches,
//   - the extraction replaces the placeholder representation with source-backed
//     match data, so the source-backed value belongs in the canonical record.
//
// The decision is recorded once and consumed twice: the emitter classifies the
// observed differences against it, and the dry run/report print all of them before
// any production apply.

export const SOURCE_CORRECTION_POLICY_VERSION = "PRESERVE_SOURCE_V1";

export const SOURCE_CORRECTION_STATUS = {
  CORRECTION: "SOURCE_CORRECTION",
  UNCHANGED: "SOURCE_MATCHES_CORE",
  UNAPPROVED: "UNAPPROVED_SOURCE_DIFFERS",
};

// The approved corrections. Keyed by `match_number:field`. Deliberately explicit:
// there is no wildcard, no field-level default, and no "source wins" fallback.
export const APPROVED_SOURCE_CORRECTIONS = [
  { match_number: 4, field: "map", existing_core: "Erangel", source: "Sanhok" },
  { match_number: 10, field: "map", existing_core: "Erangel", source: "Sanhok" },
  { match_number: 16, field: "map", existing_core: "Erangel", source: "Sanhok" },
].map((c) => ({
  ...c,
  policy: SOURCE_CORRECTION_POLICY_VERSION,
  status: SOURCE_CORRECTION_STATUS.CORRECTION,
}));

const key = (matchNumber, field) => `${matchNumber}:${field}`;

const approvedByKey = new Map(APPROVED_SOURCE_CORRECTIONS.map((c) => [key(c.match_number, c.field), c]));

/**
 * Classify every (match, field) where the existing CORE placeholder differs from
 * the source-derived value.
 *
 * @param {Array} existing  rows with { match_number, map } read from CORE
 * @param {Array} source    rows with { match_number, map } from the extraction
 * @returns {{ corrections: Array, unchanged: Array, unapproved: Array, approvedCount: number }}
 *   `unapproved` is the tripwire: a difference nobody signed off on.
 */
export function reconcileMapCorrections(existing, source, { approved = APPROVED_SOURCE_CORRECTIONS } = {}) {
  const approvedMap = new Map(approved.map((c) => [key(c.match_number, c.field), c]));
  const coreByNumber = new Map((existing ?? []).map((r) => [Number(r.match_number), r]));
  const corrections = [];
  const unchanged = [];
  const unapproved = [];

  for (const src of source ?? []) {
    const matchNumber = Number(src.match_number);
    const core = coreByNumber.get(matchNumber);
    if (!core) continue;

    const field = "map";
    const sourceValue = src.map ?? null;
    const coreValue = core.map ?? null;
    if (sourceValue === coreValue) {
      unchanged.push({ match_number: matchNumber, field, value: sourceValue });
      continue;
    }

    const entry = {
      match_number: matchNumber,
      field,
      existing_core: coreValue,
      source: sourceValue,
    };
    const approvedEntry = approvedMap.get(key(matchNumber, field));
    const matchesApproval =
      approvedEntry &&
      approvedEntry.existing_core === coreValue &&
      approvedEntry.source === sourceValue;

    if (matchesApproval) {
      corrections.push({
        ...entry,
        status: SOURCE_CORRECTION_STATUS.CORRECTION,
        policy: SOURCE_CORRECTION_POLICY_VERSION,
        rationale: "source-backed value replaces pre-extraction placeholder",
      });
    } else {
      unapproved.push({
        ...entry,
        status: SOURCE_CORRECTION_STATUS.UNAPPROVED,
        policy: null,
        detail: approvedEntry
          ? `approved correction does not match observed values (approved core=${approvedEntry.existing_core} source=${approvedEntry.source})`
          : "difference is not covered by any approved correction",
      });
    }
  }

  return { corrections, unchanged, unapproved, approvedCount: approved.length };
}

/**
 * Whether the set of approved corrections was fully exercised. An approval that
 * never fires means the decision record has drifted from the data and should be
 * re-reviewed rather than silently ignored.
 */
export function approvedCorrectionsExercised(corrections, { approved = APPROVED_SOURCE_CORRECTIONS } = {}) {
  const firedKeys = new Set(corrections.map((c) => key(c.match_number, c.field)));
  const missing = approved.filter((c) => !firedKeys.has(key(c.match_number, c.field)));
  return { allExercised: missing.length === 0, missing };
}

export function buildMapReconciliation(existing, source, options = {}) {
  const result = reconcileMapCorrections(existing, source, options);
  const exercised = approvedCorrectionsExercised(result.corrections, options);
  return {
    policy_version: SOURCE_CORRECTION_POLICY_VERSION,
    scope: "pilot:BMPS 2025 Grand Finals — map identity only",
    note: "Per-pilot decision record. Not a general 'source always wins' rule.",
    approved_corrections: (options.approved ?? APPROVED_SOURCE_CORRECTIONS).map((c) => ({
      match_number: c.match_number,
      field: c.field,
      existing_core: c.existing_core,
      source: c.source,
    })),
    corrections: result.corrections,
    unchanged_count: result.unchanged.length,
    unapproved: result.unapproved,
    approved_all_exercised: exercised.allExercised,
    approved_not_exercised: exercised.missing,
    safe_to_apply: result.unapproved.length === 0,
  };
}
