import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { db, runInTransaction } from "../db.js";
import { logger } from "./logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_PATH = join(__dirname, "..", "seed", "seed.json");

// Child rows of a tournament carry a denormalized tournament_id. Import scripts
// re-insert tournaments under fresh UUIDs (and delete the previous row), which
// leaves those child rows pointing at an id no live tournament owns. The rows
// are valid data — only the tournament_id is stale — so re-point them at the
// tournament that carries the same name (seed ids) or the same stage signature.
const CHILD_TABLES = [
  "tournament_stages",
  "tournament_participants",
  "stage_standings",
];

const SIGNATURE_MATCH_THRESHOLD = 0.8;

function tableExists(name) {
  return Boolean(
    db
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(name),
  );
}

function loadSeedTournamentIdsByName() {
  try {
    const seed = JSON.parse(readFileSync(SEED_PATH, "utf-8"));
    const tournaments = Array.isArray(seed?.tournaments) ? seed.tournaments : [];
    return new Map(
      tournaments
        .filter((t) => t?.id && t?.name)
        .map((t) => [t.id, t.name]),
    );
  } catch (error) {
    logger.warn("Tournament repair: could not read seed.json", {
      error: error?.message || String(error),
    });
    return new Map();
  }
}

function nullsLast(a, b) {
  return (a ?? 0) - (b ?? 0);
}

function getOrphanTournamentIds() {
  const ids = new Set();
  for (const table of CHILD_TABLES) {
    if (!tableExists(table)) continue;
    const rows = db
      .prepare(
        `SELECT DISTINCT tournament_id AS id FROM ${table}
         WHERE tournament_id IS NOT NULL
           AND tournament_id <> ''
           AND tournament_id NOT IN (SELECT id FROM tournaments)`,
      )
      .all();
    for (const row of rows) ids.add(row.id);
  }
  return ids;
}

function getChildCounts(tournamentId) {
  const counts = { stages: 0, standings: 0, participants: 0 };
  if (tableExists("tournament_stages")) {
    counts.stages = db
      .prepare("SELECT COUNT(*) AS c FROM tournament_stages WHERE tournament_id = ?")
      .get(tournamentId).c;
  }
  if (tableExists("stage_standings")) {
    counts.standings = db
      .prepare("SELECT COUNT(*) AS c FROM stage_standings WHERE tournament_id = ?")
      .get(tournamentId).c;
  }
  if (tableExists("tournament_participants")) {
    counts.participants = db
      .prepare("SELECT COUNT(*) AS c FROM tournament_participants WHERE tournament_id = ?")
      .get(tournamentId).c;
  }
  return counts;
}

function getStageNames(tournamentId) {
  if (!tableExists("tournament_stages")) return [];
  return db
    .prepare("SELECT name FROM tournament_stages WHERE tournament_id = ?")
    .all(tournamentId)
    .map((row) => row.name)
    .filter(Boolean);
}

function getEmbeddedStageNames(tournamentId) {
  const row = db
    .prepare("SELECT stages FROM tournaments WHERE id = ?")
    .get(tournamentId);
  if (!row?.stages) return [];
  try {
    const stages = JSON.parse(row.stages);
    return Array.isArray(stages)
      ? stages.map((stage) => stage?.name).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function overlapRatio(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const value of a) if (b.has(value)) shared += 1;
  return shared / a.size;
}

// Resolve an orphan id to the live tournament that should own its child rows.
// Name match (via seed.json ids) is authoritative; stage-name signature is the
// fallback for rows whose original tournament id is no longer in seed.json.
function resolveTarget(orphanId, seedNameById, liveTournaments, signatures) {
  const seedName = seedNameById.get(orphanId);
  if (seedName) {
    const byName = liveTournaments.find((t) => t.name === seedName);
    if (byName) return { id: byName.id, via: "seed-name" };
  }

  const stageNames = getStageNames(orphanId);
  const signature = new Set(stageNames);
  let best = null;
  for (const tournament of liveTournaments) {
    const candidate = signatures.get(tournament.id) || new Set();
    const score = overlapRatio(signature, candidate);
    if (!best || score > best.score) best = { score, id: tournament.id };
  }
  if (best && best.score >= SIGNATURE_MATCH_THRESHOLD) {
    return { id: best.id, via: `stage-signature:${best.score.toFixed(2)}` };
  }
  return null;
}

function reassign(table, orphanId, targetId) {
  const result = db
    .prepare(`UPDATE ${table} SET tournament_id = ? WHERE tournament_id = ?`)
    .run(targetId, orphanId);
  return result.changes;
}

function dedupeStages(targetId) {
  // tournament_stages is unique on (tournament_id, slug). If the target already
  // had stages, keep the richest row per slug and drop the rest so the update
  // cannot violate the constraint.
  if (!tableExists("tournament_stages")) return 0;
  const rows = db
    .prepare(
      `SELECT id, slug,
              (CASE WHEN summary IS NOT NULL AND summary <> '' THEN 1 ELSE 0 END) AS has_summary,
              (SELECT COUNT(*) FROM stage_standings ss WHERE ss.stage_id = tournament_stages.id) AS standing_count
       FROM tournament_stages
       WHERE tournament_id = ?
       ORDER BY has_summary DESC, standing_count DESC, stage_order ASC`,
    )
    .all(targetId);

  const seen = new Set();
  const duplicates = [];
  for (const row of rows) {
    const key = row.slug ?? "";
    if (seen.has(key)) duplicates.push(row.id);
    else seen.add(key);
  }
  if (duplicates.length === 0) return 0;

  const placeholders = duplicates.map(() => "?").join(", ");
  if (tableExists("stage_standings")) {
    db.prepare(`DELETE FROM stage_standings WHERE stage_id IN (${placeholders})`).run(...duplicates);
  }
  if (tableExists("tournament_participant_stage_entries")) {
    db.prepare(
      `DELETE FROM tournament_participant_stage_entries WHERE stage_id IN (${placeholders})`,
    ).run(...duplicates);
  }
  if (tableExists("tournament_stage_groups")) {
    db.prepare(
      `DELETE FROM tournament_stage_groups WHERE stage_id IN (${placeholders})`,
    ).run(...duplicates);
  }
  db.prepare(`DELETE FROM tournament_stages WHERE id IN (${placeholders})`).run(...duplicates);
  return duplicates.length;
}

function dedupeParticipants(targetId) {
  // tournament_participants is unique on (tournament_id, team_id).
  if (!tableExists("tournament_participants")) return 0;
  const rows = db
    .prepare(
      `SELECT id, team_id
       FROM tournament_participants
       WHERE tournament_id = ?
       ORDER BY COALESCE(final_rank, 9999) ASC, created_date ASC`,
    )
    .all(targetId);

  const seen = new Set();
  const duplicates = [];
  for (const row of rows) {
    const key = row.team_id ?? "";
    if (seen.has(key)) duplicates.push(row.id);
    else seen.add(key);
  }
  if (duplicates.length === 0) return 0;

  const placeholders = duplicates.map(() => "?").join(", ");
  if (tableExists("tournament_participant_players")) {
    db.prepare(
      `DELETE FROM tournament_participant_players WHERE participant_id IN (${placeholders})`,
    ).run(...duplicates);
  }
  if (tableExists("tournament_participant_stage_entries")) {
    db.prepare(
      `DELETE FROM tournament_participant_stage_entries WHERE participant_id IN (${placeholders})`,
    ).run(...duplicates);
  }
  db.prepare(`DELETE FROM tournament_participants WHERE id IN (${placeholders})`).run(...duplicates);
  return duplicates.length;
}

function pruneUnreferencedOrphanStages() {
  // Older imports and seed rows left whole stage snapshots behind that no live
  // tournament owns. Their stages may still be referenced by stage groups or
  // stage entries, so only drop those with no remaining child references.
  if (!tableExists("tournament_stages")) return 0;
  const orphans = db
    .prepare(
      `SELECT id FROM tournament_stages
       WHERE tournament_id IS NOT NULL AND tournament_id <> ''
         AND tournament_id NOT IN (SELECT id FROM tournaments)`,
    )
    .all()
    .map((row) => row.id);
  if (orphans.length === 0) return 0;

  const referenced = (table, column, stageId) =>
    tableExists(table) &&
    Boolean(
      db
        .prepare(`SELECT 1 FROM ${table} WHERE ${column} = ? LIMIT 1`)
        .get(stageId),
    );

  const removable = orphans.filter(
    (id) =>
      !referenced("stage_standings", "stage_id", id) &&
      !referenced("tournament_stage_groups", "stage_id", id) &&
      !referenced("tournament_participant_stage_entries", "stage_id", id) &&
      !referenced("tournament_participants", "start_stage_id", id) &&
      !referenced("tournament_participants", "final_stage_id", id),
  );
  if (removable.length === 0) return 0;

  const placeholders = removable.map(() => "?").join(", ");
  db.prepare(`DELETE FROM tournament_stages WHERE id IN (${placeholders})`).run(...removable);
  return removable.length;
}

function loadSeedTeamsById() {
  try {
    const seed = JSON.parse(readFileSync(SEED_PATH, "utf-8"));
    const teams = Array.isArray(seed?.teams) ? seed.teams : [];
    return new Map(teams.filter((t) => t?.id).map((t) => [t.id, t]));
  } catch {
    return new Map();
  }
}

// Child rows reference teams by id. When a team row is missing entirely — the
// upsert path that re-keys tournaments can drop canonical teams while leaving
// their references behind — inner joins silently hide those participants and
// standings. Restore the canonical seed row so the existing references resolve.
function restoreMissingSeedTeams() {
  if (!tableExists("teams")) return 0;
  const seedTeams = loadSeedTeamsById();
  if (seedTeams.size === 0) return 0;

  const existing = new Set(
    db.prepare("SELECT id FROM teams").all().map((row) => row.id),
  );

  const referenceColumns = [
    ["tournament_participants", "team_id"],
    ["stage_standings", "team_id"],
    ["match_results", "team_id"],
    ["player_team_history", "team_id"],
  ];

  const restored = [];
  for (const [id, team] of seedTeams) {
    if (existing.has(id)) continue;
    const referenced = referenceColumns.some(
      ([table, column]) =>
        tableExists(table) &&
        Boolean(
          db
            .prepare(`SELECT 1 FROM ${table} WHERE ${column} = ? LIMIT 1`)
            .get(id),
        ),
    );
    if (!referenced) continue;

    const cols = Object.keys(team);
    db.prepare(
      `INSERT OR IGNORE INTO teams (${cols.map((c) => `"${c}"`).join(", ")})
       VALUES (${cols.map(() => "?").join(", ")})`,
    ).run(
      ...cols.map((c) => {
        const v = team[c];
        return typeof v === "object" && v !== null ? JSON.stringify(v) : v;
      }),
    );
    restored.push(team.name || id);
  }

  if (restored.length > 0) {
    logger.info("Tournament data repair: restored missing canonical teams", {
      count: restored.length,
      teams: restored,
    });
  }
  return restored.length;
}

export function repairTournamentDataIntegrity() {
  const startedAt = Date.now();
  const examined = countScannedChildRows();
  const restoredTeams = restoreMissingSeedTeams();
  const seedNameById = loadSeedTournamentIdsByName();

  const liveTournaments = db
    .prepare("SELECT id, name FROM tournaments")
    .all();
  if (liveTournaments.length === 0) {
    const empty = {
      examined,
      groups: 0,
      moved: 0,
      prunedStages: 0,
      restoredTeams,
      unresolved: 0,
      durationMs: Date.now() - startedAt,
    };
    logger.info("tournamentDataRepair", empty);
    return empty;
  }

  const signatures = new Map(
    liveTournaments.map((t) => [
      t.id,
      new Set([...getStageNames(t.id), ...getEmbeddedStageNames(t.id)]),
    ]),
  );

  const orphanIds = getOrphanTournamentIds();
  // Healthy startup: nothing detached, so report explicitly that zero rows moved.
  if (orphanIds.size === 0) {
    const clean = {
      examined,
      groups: 0,
      moved: 0,
      prunedStages: 0,
      restoredTeams,
      unresolved: 0,
      durationMs: Date.now() - startedAt,
    };
    logger.info("tournamentDataRepair", clean);
    return clean;
  }

  // Choose, per target tournament, only the single richest orphan group. The
  // orphan pool can hold several snapshots of the same event (older imports and
  // seed rows); reassigning all of them would stack duplicate stages/teams.
  const bestByTarget = new Map();
  const pending = [];
  for (const orphanId of orphanIds) {
    const target = resolveTarget(orphanId, seedNameById, liveTournaments, signatures);
    if (!target) {
      pending.push({ orphanId, via: null });
      continue;
    }
    const counts = getChildCounts(orphanId);
    const weight = counts.standings * 1000 + counts.participants * 100 + counts.stages;
    const current = bestByTarget.get(target.id);
    if (!current || weight > current.weight) {
      if (current) pending.push({ orphanId: current.orphanId, via: current.via });
      bestByTarget.set(target.id, { orphanId, via: target.via, weight, counts });
    } else {
      pending.push({ orphanId, via: target.via });
    }
  }

  let moved = 0;
  let prunedStages = 0;
  const applied = [];
  runInTransaction(() => {
    for (const [targetId, chosen] of bestByTarget) {
      for (const table of CHILD_TABLES) {
        if (!tableExists(table)) continue;
        moved += reassign(table, chosen.orphanId, targetId);
      }
      const droppedStages = dedupeStages(targetId);
      const droppedParticipants = dedupeParticipants(targetId);
      applied.push({
        targetId,
        via: chosen.via,
        counts: chosen.counts,
        droppedStages,
        droppedParticipants,
      });
    }
    prunedStages = pruneUnreferencedOrphanStages();
  });

  const summary = {
    examined,
    groups: applied.length,
    moved,
    prunedStages,
    restoredTeams,
    unresolved: pending.length,
    durationMs: Date.now() - startedAt,
  };

  if (applied.length > 0) {
    logger.info("tournamentDataRepair", { ...summary, details: applied });
  } else {
    logger.warn("tournamentDataRepair", summary);
  }

  return summary;
}

// Child rows scanned across the tables this repair can re-point. Reported so an
// operator can distinguish "nothing to do" from "the repair did not run".
function countScannedChildRows() {
  let total = 0;
  for (const table of CHILD_TABLES) {
    if (!tableExists(table)) continue;
    total += db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get().c;
  }
  return total;
}

if (process.env.CORE_REPAIR_TOURNAMENT_DATA === "1") {
  repairTournamentDataIntegrity();
}
