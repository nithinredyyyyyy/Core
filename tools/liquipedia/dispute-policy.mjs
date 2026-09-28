// Disputed-split representation policy.
//
// Governs how a stage whose source disagrees with the existing CORE aggregate is
// represented during enrichment. The point of the policy is that a disagreement is
// *represented*, never hidden and never silently adjudicated.
//
// Policy PRESERVE_DISPUTE_V1 (default):
//   - the imported canonical result row carries the SOURCE-derived values, and
//     must stay internally consistent: total_points = kill_points + placement_points
//   - the existing CORE value is retained in reconciliation metadata
//   - the team aggregate is flagged DISPUTED_SPLIT_TOTAL_AGREES
//   - nothing is adjudicated; the disagreement is left for an explicit decision
//
// The discrepancy is a property of the team's aggregate (source sum over all
// matches vs the existing cumulative snapshot), not of any individual match, so
// it is attached at team level. Marking every per-match row as disputed would
// wrongly imply each match disagrees.

export const DISPUTE_POLICY_VERSION = "PRESERVE_DISPUTE_V1";

export const DISPUTE_POLICIES = {
  PRESERVE_DISPUTE_V1: {
    version: DISPUTE_POLICY_VERSION,
    description:
      "Import the source-derived canonical row, retain the existing CORE value in reconciliation metadata, flag the team aggregate as DISPUTED_SPLIT_TOTAL_AGREES. No adjudication, no overwrite.",
    canonical_value_source: "source",
    adjudicated: false,
    overwrite_existing: false,
    preserve_existing_in_metadata: true,
    blocks_apply: false,
    resolution: "PENDING_EXPLICIT_DECISION",
  },
};

export function resolveDisputePolicy(name = DISPUTE_POLICY_VERSION) {
  const policy = DISPUTE_POLICIES[name];
  if (!policy) {
    throw new Error(`Unknown dispute policy: ${name}`);
  }
  return policy;
}

/**
 * Canonical rows must be internally consistent regardless of any disagreement
 * about the split, because the schema derives standings from them. This asserts
 * the invariant rather than trusting construction.
 */
export function assertCanonicalConsistency(rows) {
  const errors = [];
  for (const row of rows ?? []) {
    const killPoints = row.kill_points ?? row.kills;
    const expected = killPoints + row.placement_points;
    if (row.total_points !== expected) {
      errors.push({
        code: "CANONICAL_TOTAL_INCONSISTENT",
        detail: `match ${row.match_number} ${row.team_name}: total_points ${row.total_points} != kill_points ${killPoints} + placement_points ${row.placement_points}`,
      });
    }
  }
  return errors;
}

/**
 * Build the team-level dispute record set from the reconciliation rows. Every
 * non-exact classification is carried through with its existing CORE value
 * preserved; exact rows produce no dispute entry.
 */
export function buildTeamDisputes({ reconciledRows = [], policy = resolveDisputePolicy() }) {
  const disputes = [];
  for (const row of reconciledRows) {
    if (row.discrepancy_classification === "FIELD_EXACT") continue;
    disputes.push({
      team: row.team,
      team_match_key: row.team_match_key,
      core_team: row.core_team,
      dispute_status: row.discrepancy_classification,
      adjudication_status: policy.adjudicated ? "ADJUDICATED" : "UNRESOLVED",
      resolution: policy.resolution,
      canonical_value_source: policy.canonical_value_source,
      source_value: row.source_detail ?? row.source_value,
      existing_core_value: row.core_detail ?? row.core_value,
      existing_core_preserved: policy.preserve_existing_in_metadata,
      overwritten: policy.overwrite_existing,
      total_agrees: row.total_agrees ?? null,
      total_comparison: row.total_comparison ?? null,
      scope: row.scope ?? "aggregate",
    });
  }
  return disputes;
}

/**
 * Assemble the dispute metadata block that ships with the payload.
 */
export function buildDisputeMetadata({ reconciledRows, policy = resolveDisputePolicy(), consistencyErrors = [] }) {
  const disputes = buildTeamDisputes({ reconciledRows, policy });
  return {
    policy_version: policy.version,
    policy: {
      canonical_value_source: policy.canonical_value_source,
      adjudicated: policy.adjudicated,
      overwrite_existing: policy.overwrite_existing,
      preserve_existing_in_metadata: policy.preserve_existing_in_metadata,
      blocks_apply: policy.blocks_apply,
      resolution: policy.resolution,
      description: policy.description,
    },
    counts: {
      field_exact: reconciledRows.filter((r) => r.discrepancy_classification === "FIELD_EXACT").length,
      disputed_split_total_agrees: reconciledRows.filter((r) => r.discrepancy_classification === "DISPUTED_SPLIT_TOTAL_AGREES").length,
      totals_only_agree: reconciledRows.filter((r) => r.discrepancy_classification === "TOTALS_ONLY_AGREE").length,
      identity_unresolved: reconciledRows.filter((r) => r.discrepancy_classification === "IDENTITY_UNRESOLVED").length,
    },
    // The guarantee the policy exists to make: representing a dispute never makes
    // the imported rows internally inconsistent.
    canonical_rows_consistent: consistencyErrors.length === 0,
    canonical_consistency_errors: consistencyErrors,
    disputes,
  };
}
