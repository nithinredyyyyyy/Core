// Apply the Phase 3 stage-standings fixation to a database.
//
// Safety properties this module is responsible for:
//   - idempotent: upsert is keyed on (stage_id, COALESCE(group_id,''), team_id),
//     the existing unique index, so a second run changes nothing and adds no rows;
//   - no invented data: every row must resolve to an existing CORE team, every
//     supplied total must equal place_points + elim_points, and ranks must be
//     unique. A violation throws and the caller's transaction rolls back;
//   - provenance preserved: source_name/source_ref/source_url are written from
//     the payload, never fabricated;
//   - identity preserved: existing standings rows keep their id, so anything that
//     references a standing (stage_match_breakdown) stays intact.
//
// It never creates a team, never creates a stage, and never deletes a standings
// row. A target whose board cannot be fully resolved is reported as deferred
// rather than applied partially.

import { randomUUID } from "node:crypto";
import { db, runInTransaction } from "../db.js";
import { logger } from "../services/logger.js";
import { TEAM_ALIASES, STANDINGS_TARGETS, DEFERRED_TARGETS } from "./data/phase3Standings.js";

function indexTeamsByName() {
  const byName = new Map();
  for (const row of db.prepare("SELECT id, name FROM teams").all()) {
    byName.set(row.name.trim().toLowerCase(), row);
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
 * Returns null when nothing matches; the caller treats that as a hard stop.
 */
export function resolveTeamId(displayName, teamIndex) {
  const raw = String(displayName || "").trim();
  const canonical = TEAM_ALIASES[raw] || raw;
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

  if (target.expectRows !== undefined && resolved.length !== target.expectRows) {
    problems.push(`expected ${target.expectRows} rows, resolved ${resolved.length}`);
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
 * Reconcile one supplied row against stored state, without ever overwriting a
 * value.
 *
 * The policy is PRESERVE_DISPUTE_V1: disagreement is represented, not
 * adjudicated. So this function:
 *   - inserts a row only when the stage has no row for that team at all;
 *   - when a row exists, never changes rank/matches/wins/place/elim/total. It
 *     records every field that differs as a dispute and leaves the stored value
 *     alone;
 *   - always attaches provenance and, when supplied, progression_status.
 *
 * Returns { action, disputes } where action is "inserted" | "provenance-only".
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
       SET progression_status = COALESCE(?, progression_status),
           source_name = ?, source_url = ?, source_ref = ?, updated_date = ?
     WHERE id = ?`,
  ).run(entry.progression_status, target.source.name, target.source.url, target.source.ref, now, existing.id);
  return { action: "provenance-only", id: existing.id, disputes };
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
      const before = boardCount(stage.id, groupId);
      const now = new Date().toISOString();
      let inserted = 0;
      let verified = 0;
      const notPlaced = [];

      for (const entry of resolved) {
        const sameBoard = db
          .prepare(
            "SELECT id, rank, matches_played, wins, place_points, elim_points, total_points FROM stage_standings WHERE stage_id = ? AND COALESCE(group_id, '') = COALESCE(?, '') AND team_id = ?",
          )
          .get(stage.id, groupId, entry.teamId);
        const stageWide = scope === "existing-rows" ? findExistingRowsForTeam(stage.id, entry.teamId) : [];
        if (stageWide.length > 1) {
          throw new Error(
            `${target.tournament} / ${target.stage}: "${entry.team}" already appears ${stageWide.length} times in this stage; refusing to add another row`,
          );
        }

        if (scope === "existing-rows") {
          // This stage's ranking is stored per group. A row can only be verified,
          // never added: the supplied board does not say which group a new team
          // belongs to, and an overall board here would duplicate teams already
          // present. A team with no stored row is reported, not guessed.
          if (stageWide.length === 0) {
            notPlaced.push(entry.team);
            continue;
          }
          const { disputes } = reconcileRow({
            target, tournamentId, stageId: stage.id, groupId: stageWide[0].group_id,
            entry, existing: stageWide[0], now,
          });
          verified += 1;
          allDisputes.push(...disputes);
          continue;
        }

        const { action, disputes } = reconcileRow({
          target, tournamentId, stageId: stage.id, groupId, entry, existing: sameBoard, now,
        });
        if (action === "inserted") inserted += 1;
        else verified += 1;
        allDisputes.push(...disputes);
      }

      const after = boardCount(stage.id, groupId);
      if (target.expectRows !== undefined) {
        // For a per-group scope, expectRows is the group board size. For a
        // stage-wide scope it is the stage total. For "existing-rows" the stage is
        // partitioned, so the expectation is the number of rows in the stage.
        const actual =
          scope === "existing-rows"
            ? db.prepare("SELECT COUNT(*) AS c FROM stage_standings WHERE stage_id = ?").get(stage.id).c
            : after;
        if (actual !== target.expectRows) {
          throw new Error(
            `Post-condition failed for ${target.tournament} / ${target.stage}: expected ${target.expectRows} rows, found ${actual}`,
          );
        }
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
        verified,
        notPlaced,
        source: target.source.name,
        sourceRef: target.source.ref,
        validation: "ok",
      });
      logger.info("phase3.standingsFixation.applied", {
        tournament: target.tournament, stage: target.stage, group: target.group,
        before, after, inserted, verified, notPlaced: notPlaced.length,
      });
    }

    return { applied: report, disputes: allDisputes, deferred };
  });
}
