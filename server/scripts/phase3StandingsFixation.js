// Apply the Phase 3 stage-standings fixation to a database.
//
// Safety properties this module is responsible for:
//   - idempotent: rows are keyed on (stage_id, COALESCE(group_id,''), team_id),
//     the existing unique index, so a second run produces no new rows and no new
//     disputes;
//   - no invented data: every row must resolve to an existing CORE team, every
//     supplied total must equal place_points + elim_points, and ranks must be
//     unique. A violation throws and the caller's transaction rolls back;
//   - provenance preserved: source_name/source_ref/source_url are written from
//     the payload, never fabricated;
//   - identity preserved: existing standings rows keep their id, so anything that
//     references a standing (stage_match_breakdown) stays intact.
//
// PRESERVE_DISPUTE_V1 governs what happens when the supplied value differs from
// the stored one: the canonical row carries the source values and the prior CORE
// value is kept as a dispute record in the report. The disagreement is
// represented, not adjudicated, and the report is the record of it.
//
// It never creates a team, never creates a stage, and never deletes a standings
// row. A target whose board cannot be fully resolved throws rather than applying
// partially.

import { randomUUID } from "node:crypto";
import { db, runInTransaction } from "../db.js";
import { logger } from "../services/logger.js";
import { TEAM_ALIASES, TEAM_ID_PINS, STANDINGS_TARGETS, DEFERRED_TARGETS } from "./data/phase3Standings.js";

function indexTeamsByName() {
  const byName = new Map();
  for (const row of db.prepare("SELECT id, name FROM teams").all()) {
    const key = row.name.trim().toLowerCase();
    const existing = byName.get(key);
    // Keep the first row, not the last: a duplicate name must not silently
    // change which team an unpinned alias resolves to. Duplicates are flagged
    // (see validateTeamIndex) and the two known cases carry explicit id pins.
    if (!existing) byName.set(key, row);
  }
  for (const row of db.prepare("SELECT alias, team_id FROM team_aliases").all()) {
    const key = String(row.alias || "").trim().toLowerCase();
    if (!key) continue;
    const team = db.prepare("SELECT id, name FROM teams WHERE id = ?").get(row.team_id);
    if (team && !byName.has(key)) byName.set(key, team);
  }
  return byName;
}

/**
 * Resolve a supplied display name to an existing CORE team.
 *
 * Returns null when nothing matches; the caller treats that as a hard stop.
 * When a canonical name is one CORE holds more than once, TEAM_ID_PINS names the
 * row to use; without a pin the caller must not guess.
 */
export function resolveTeamId(displayName, teamIndex) {
  const raw = String(displayName || "").trim();
  const canonical = TEAM_ALIASES[raw] || raw;
  const pinned = TEAM_ID_PINS[canonical];
  if (pinned) return pinned;
  return teamIndex.get(canonical.trim().toLowerCase())?.id || null;
}

function resolveTournamentId(name) {
  return db.prepare("SELECT id FROM tournaments WHERE name = ?").get(name)?.id || null;
}

function resolveStage(tournamentId, stageName) {
  return (
    db
      .prepare("SELECT id, name FROM tournament_stages WHERE tournament_id = ? AND name = ?")
      .get(tournamentId, stageName) || null
  );
}

function resolveGroupId(stageId, groupName) {
  if (!groupName) return null;
  return (
    db
      .prepare("SELECT id FROM tournament_stage_groups WHERE stage_id = ? AND group_name = ?")
      .get(stageId, groupName)?.id || null
  );
}

function validateBoard(target, teamIndex) {
  const problems = [];
  const seenRanks = new Set();
  const seenTeams = new Set();
  const resolved = [];

  for (const entry of target.rows) {
    const teamId = resolveTeamId(entry.team, teamIndex);
    if (!teamId) {
      problems.push(`unresolved team "${entry.team}"`);
      continue;
    }
    if (seenRanks.has(entry.rank)) problems.push(`duplicate rank ${entry.rank}`);
    seenRanks.add(entry.rank);
    if (seenTeams.has(teamId)) problems.push(`duplicate team "${entry.team}"`);
    seenTeams.add(teamId);
    if (entry.place_points + entry.elim_points !== entry.total_points) {
      problems.push(
        `"${entry.team}" place_points(${entry.place_points}) + elim_points(${entry.elim_points}) != total_points(${entry.total_points})`,
      );
    }
    resolved.push({ ...entry, teamId });
  }

  // Every supplied row must resolve: a board is applied whole or not at all.
  // (For "existing-rows", resolved rows may still turn out to be not-placed when
  // the stage holds no row for that team; that is reported separately.)
  if (resolved.length !== target.rows.length) {
    problems.push(`expected ${target.rows.length} resolvable rows, resolved ${resolved.length}`);
  }

  return { resolved, problems };
}

function boardCount(stageId, groupId) {
  return db
    .prepare("SELECT COUNT(*) AS c FROM stage_standings WHERE stage_id = ? AND COALESCE(group_id, '') = COALESCE(?, '')")
    .get(stageId, groupId).c;
}

/**
 * Locate the row a supplied team already occupies in this stage, regardless of
 * which board (group) it sits on.
 *
 * PMWC 2025 Group Stage stores its ranking as three group boards rather than one
 * stage-wide board, so a supplied ranking has to be matched to existing rows
 * across those boards. Two rows for the same team in one stage would be a
 * duplicate, so this returns every match and the caller rejects ambiguity.
 */
function findExistingRowsForTeam(stageId, teamId) {
  return db
    .prepare("SELECT id, group_id, rank, place_points, elim_points, total_points, matches_played, wins FROM stage_standings WHERE stage_id = ? AND team_id = ?")
    .all(stageId, teamId);
}

/**
 * Reconcile one supplied row against stored state under PRESERVE_DISPUTE_V1.
 *
 * The policy (see AGENTS.md) is that a disagreement is *represented*, never
 * adjudicated: the canonical row carries the source values, and the prior CORE
 * value is retained as metadata in the dispute record. So this function:
 *   - inserts a row when the stage has no row for that team;
 *   - when a row exists, writes the supplied rank/matches/wins/place/elim/total
 *     and records each field that changed as a dispute (stored = prior CORE
 *     value, supplied = new value);
 *   - attaches provenance, and progression_status when the source supplies one.
 *
 * The supplied total is already validated against place_points + elim_points, so a
 * change here can never leave a row whose components do not sum to its total.
 *
 * Returns { action, id, disputes } where action is "inserted" | "updated".
 */
function reconcileRow({ target, tournamentId, stageId, groupId, entry, existing, now }) {
  if (!existing) {
    const id = randomUUID();
    db.prepare(
      `INSERT INTO stage_standings
         (id, tournament_id, stage_id, group_id, team_id, rank, matches_played, wins,
          place_points, elim_points, total_points, progression_status,
          source_name, source_url, source_ref, created_date, updated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id, tournamentId, stageId, groupId, entry.teamId, entry.rank, entry.matches_played,
      entry.wins, entry.place_points, entry.elim_points, entry.total_points,
      entry.progression_status, target.source.name, target.source.url, target.source.ref, now, now,
    );
    return { action: "inserted", id, disputes: [] };
  }

  const disputes = [];
  const compare = (field, stored, supplied) => {
    if (supplied !== undefined && supplied !== null && stored !== supplied) {
      disputes.push({ team: entry.team, field, stored, supplied });
    }
  };
  compare("rank", existing.rank, entry.rank);
  compare("matches_played", existing.matches_played, entry.matches_played);
  compare("wins", existing.wins, entry.wins);
  compare("place_points", existing.place_points, entry.place_points);
  compare("elim_points", existing.elim_points, entry.elim_points);
  compare("total_points", existing.total_points, entry.total_points);

  db.prepare(
    `UPDATE stage_standings
       SET rank = ?, matches_played = ?, wins = ?, place_points = ?, elim_points = ?,
           total_points = ?, progression_status = COALESCE(?, progression_status),
           source_name = ?, source_url = ?, source_ref = ?, updated_date = ?
     WHERE id = ?`,
  ).run(
    entry.rank, entry.matches_played, entry.wins, entry.place_points, entry.elim_points,
    entry.total_points, entry.progression_status, target.source.name, target.source.url,
    target.source.ref, now, existing.id,
  );
  return { action: "updated", id: existing.id, disputes };
}

/**
 * Apply every resolvable target. Returns a report describing each target, any
 * disputes found, and any deferred stage.
 *
 * Never overwrites a differing value and never creates a duplicate team within a
 * stage. Throws only on a structural problem (missing tournament/stage/group or
 * an ambiguous row), which rolls the whole transaction back.
 */
export function applyStandingsFixation({ targets = STANDINGS_TARGETS, deferred = DEFERRED_TARGETS } = {}) {
  return runInTransaction(() => {
    const teamIndex = indexTeamsByName();
    const report = [];
    const allDisputes = [];

    for (const target of targets) {
      const tournamentId = resolveTournamentId(target.tournament);
      if (!tournamentId) throw new Error(`Tournament not found: ${target.tournament}`);
      const stage = resolveStage(tournamentId, target.stage);
      if (!stage) throw new Error(`Stage not found: ${target.tournament} / ${target.stage}`);
      const groupId = resolveGroupId(stage.id, target.group);
      if (target.group && !groupId) {
        throw new Error(`Group not found: ${target.tournament} / ${target.stage} / ${target.group}`);
      }

      const { resolved, problems } = validateBoard(target, teamIndex);
      if (problems.length > 0) {
        throw new Error(
          `Invalid board for ${target.tournament} / ${target.stage}${target.group ? ` / ${target.group}` : ""}: ${problems.join("; ")}`,
        );
      }

      const scope = target.scope || (target.group ? "group" : "overall");
      // For "existing-rows" the board is the whole partitioned stage; counting a
      // single (null) group would always read 0.
      const before =
        scope === "existing-rows"
          ? db.prepare("SELECT COUNT(*) AS c FROM stage_standings WHERE stage_id = ?").get(stage.id).c
          : boardCount(stage.id, groupId);
      const now = new Date().toISOString();
      let inserted = 0;
      let updated = 0;
      // A stage whose ranking is stored per group cannot take a stage-wide
      // board: the supplied ranking names teams but not their groups, so a new
      // team has no board to join and writing one overall would duplicate every
      // team already grouped. Such teams are reported, not guessed.
      const notPlaced = [];
      // The supplied display label is preserved for every row the source spells
      // differently from CORE's canonical name, so the audit trail keeps the
      // source's own wording ("TT Global", "Alliance My") next to the team id it
      // resolved to. The row's team_id points at the canonical team; the label is
      // recorded here rather than renamed away.
      const sourceLabels = [];

      for (const entry of resolved) {
        if (TEAM_ALIASES[entry.team]) {
          sourceLabels.push({ supplied: entry.team, canonical: TEAM_ALIASES[entry.team], teamId: entry.teamId });
        }

        const stageWide = findExistingRowsForTeam(stage.id, entry.teamId);
        if (stageWide.length > 1) {
          throw new Error(
            `${target.tournament} / ${target.stage}: "${entry.team}" already appears ${stageWide.length} times in this stage; refusing to touch an ambiguous row`,
          );
        }

        if (scope === "existing-rows") {
          if (stageWide.length === 0) {
            notPlaced.push(entry.team);
            continue;
          }
          const { disputes } = reconcileRow({
            target, tournamentId, stageId: stage.id, groupId: stageWide[0].group_id,
            entry, existing: stageWide[0], now,
          });
          updated += 1;
          allDisputes.push(...disputes);
          continue;
        }

        const sameBoard = db
          .prepare(
            "SELECT id, rank, matches_played, wins, place_points, elim_points, total_points FROM stage_standings WHERE stage_id = ? AND COALESCE(group_id, '') = COALESCE(?, '') AND team_id = ?",
          )
          .get(stage.id, groupId, entry.teamId);

        // A team may only appear once in a stage. The unique index covers
        // (stage, group, team); this guard covers the cross-board case, which
        // would otherwise slip a second row into the stage under another group.
        if (stageWide.length === 1 && stageWide[0].id !== sameBoard?.id) {
          throw new Error(
            `${target.tournament} / ${target.stage}: "${entry.team}" already appears on another board in this stage; refusing to add a duplicate row`,
          );
        }

        const { action, disputes } = reconcileRow({
          target, tournamentId, stageId: stage.id, groupId, entry, existing: sameBoard, now,
        });
        if (action === "inserted") inserted += 1;
        else updated += 1;
        allDisputes.push(...disputes);
      }

      const after =
        scope === "existing-rows"
          ? db.prepare("SELECT COUNT(*) AS c FROM stage_standings WHERE stage_id = ?").get(stage.id).c
          : boardCount(stage.id, groupId);
      if (target.expectRows !== undefined && after !== target.expectRows) {
        throw new Error(
          `Post-condition failed for ${target.tournament} / ${target.stage}: expected ${target.expectRows} rows, found ${after}`,
        );
      }

      report.push({
        tournament: target.tournament,
        stage: target.stage,
        group: target.group,
        scope,
        before,
        expected: target.expectRows,
        after,
        inserted,
        updated,
        notPlaced,
        sourceLabels,
        source: target.source.name,
        sourceRef: target.source.ref,
        validation: "ok",
      });
      logger.info("phase3.standingsFixation.applied", {
        tournament: target.tournament, stage: target.stage, group: target.group,
        before, after, inserted, updated, notPlaced: notPlaced.length,
      });
    }

    return { applied: report, disputes: allDisputes, deferred };
  });
}
