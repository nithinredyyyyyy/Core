import { db, runInTransaction } from "../db.js";
import { logger } from "./logger.js";

// Import scripts re-insert players under fresh UUIDs, leaving child rows in
// these tables pointing at the previous generation's player ids. The rows carry
// the player's IGN (directly or via an alias), so they can be re-pointed at the
// live player with the same IGN instead of being orphaned forever.
const REFERENCING_TABLES = [
  { table: "tournament_participant_players", nullable: true },
  { table: "player_aliases", nullable: false },
  { table: "player_team_history", nullable: false },
  { table: "player_season_ratings", nullable: false },
];

const norm = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

function tableExists(name) {
  return Boolean(
    db
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(name),
  );
}

function buildLiveIndex() {
  const byIgn = new Map();
  const byNormalized = new Map();
  for (const row of db.prepare("SELECT id, ign FROM players").all()) {
    const ign = String(row.ign || "").trim();
    if (!ign) continue;
    const key = ign.toLowerCase();
    if (!byIgn.has(key)) byIgn.set(key, []);
    byIgn.get(key).push(row.id);
    const nk = norm(ign);
    if (nk) {
      if (!byNormalized.has(nk)) byNormalized.set(nk, []);
      byNormalized.get(nk).push(row.id);
    }
  }
  return { byIgn, byNormalized };
}

function getOrphanIds() {
  const live = new Set(db.prepare("SELECT id FROM players").all().map((r) => r.id));
  const orphans = new Set();
  for (const { table } of REFERENCING_TABLES) {
    if (!tableExists(table)) continue;
    for (const row of db
      .prepare(`SELECT DISTINCT player_id AS id FROM ${table} WHERE player_id IS NOT NULL`)
      .all()) {
      if (row.id && !live.has(row.id)) orphans.add(row.id);
    }
  }
  return orphans;
}

// Rows scanned in the referencing tables. Reported so an operator can tell
// "nothing to do" apart from "the repair did not run".
function countScannedReferenceRows() {
  let total = 0;
  for (const { table } of REFERENCING_TABLES) {
    if (!tableExists(table)) continue;
    total += db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get().c;
  }
  return total;
}

// Candidate IGNs for an orphan id: the names recorded on its rows and aliases.
function candidateNames(orphanId) {
  const counts = new Map();
  const add = (name) => {
    const value = String(name || "").trim();
    if (!value) return;
    counts.set(value, (counts.get(value) || 0) + 1);
  };
  if (tableExists("tournament_participant_players")) {
    for (const row of db
      .prepare("SELECT player_name FROM tournament_participant_players WHERE player_id = ?")
      .all(orphanId)) {
      add(row.player_name);
    }
  }
  if (tableExists("player_aliases")) {
    for (const row of db
      .prepare("SELECT alias FROM player_aliases WHERE player_id = ?")
      .all(orphanId)) {
      add(row.alias);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

// Resolve an orphan id to exactly one live player. Ambiguous IGNs (two live
// players share the name) are left unresolved rather than guessed.
function resolveTarget(orphanId, index) {
  for (const name of candidateNames(orphanId)) {
    const exact = index.byIgn.get(name.toLowerCase());
    if (exact?.length === 1) return exact[0];
    const normalized = index.byNormalized.get(norm(name));
    if (normalized?.length === 1) return normalized[0];
  }
  return null;
}

// An unresolved orphan is a player whose row was dropped by an import while
// their history/aliases survived. Re-create the player under the original id so
// every reference resolves and no history is lost.
function adoptOrphanPlayers(orphans) {
  const adopted = new Map();
  const now = new Date().toISOString();
  for (const orphanId of orphans) {
    const names = candidateNames(orphanId);
    if (names.length === 0) continue;
    const ign = names[0];
    const teamRow = tableExists("player_team_history")
      ? db
          .prepare(
            `SELECT team_id FROM player_team_history
             WHERE player_id = ? AND team_id IS NOT NULL
             ORDER BY COALESCE(left_date, joined_date, created_date) DESC LIMIT 1`,
          )
          .get(orphanId)
      : null;
    db.prepare(
      `INSERT INTO players (id, ign, team_id, created_date, updated_date)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(orphanId, ign, teamRow?.team_id || null, now, now);
    adopted.set(orphanId, ign);
  }
  return adopted;
}

export function repairPlayerReferences() {
  const startedAt = Date.now();
  const examined = countScannedReferenceRows();
  const orphans = getOrphanIds();

  // Healthy startup must be observable as a zero-write operation, not silence.
  if (orphans.size === 0) {
    const clean = {
      examined,
      orphans: 0,
      repointed: 0,
      cleared: 0,
      removed: 0,
      adopted: 0,
      unresolved: 0,
      durationMs: Date.now() - startedAt,
    };
    logger.info("playerReferenceRepair", clean);
    return clean;
  }

  const index = buildLiveIndex();
  const mapping = new Map();
  for (const orphanId of orphans) {
    const target = resolveTarget(orphanId, index);
    if (target) mapping.set(orphanId, target);
  }

  const stats = {
    examined,
    orphans: orphans.size,
    repointed: 0,
    cleared: 0,
    removed: 0,
    adopted: 0,
    unresolved: 0,
    durationMs: Date.now() - startedAt,
  };

  runInTransaction(() => {
    const unresolved = [...orphans].filter((id) => !mapping.has(id));
    for (const orphanId of adoptOrphanPlayers(unresolved).keys()) {
      mapping.set(orphanId, orphanId);
    }
    stats.adopted = [...orphans].filter((id) => mapping.get(id) === id).length;
    for (const { table, nullable } of REFERENCING_TABLES) {
      if (!tableExists(table)) continue;
      for (const [orphanId, targetId] of mapping) {
        const result = db
          .prepare(`UPDATE ${table} SET player_id = ? WHERE player_id = ?`)
          .run(targetId, orphanId);
        stats.repointed += result.changes;
      }
      // Any id still unstamped has no name at all: it cannot be attributed to a
      // player, so it is dropped (or nulled where the column allows it).
      for (const orphanId of orphans) {
        if (mapping.has(orphanId)) continue;
        if (nullable) {
          stats.cleared += db
            .prepare(`UPDATE ${table} SET player_id = NULL WHERE player_id = ?`)
            .run(orphanId).changes;
        } else {
          stats.removed += db
            .prepare(`DELETE FROM ${table} WHERE player_id = ?`)
            .run(orphanId).changes;
        }
      }
    }
    dedupe("player_aliases", "player_id, normalized_alias", stats);
    dedupe("player_team_history", "player_id, team_id, COALESCE(joined_date,''), COALESCE(left_date,'')", stats);
    dedupe("player_season_ratings", "player_id, season", stats);
  });

  stats.unresolved = [...orphans].filter((id) => !mapping.has(id)).length;
  stats.durationMs = Date.now() - startedAt;
  logger.info("playerReferenceRepair", stats);
  return stats;
}

// Re-pointing can collide two rows onto the same logical key (e.g. both
// generations recorded the same alias). Keep one row per key.
function dedupe(table, keyColumns, stats) {
  if (!tableExists(table)) return;
  const result = db
    .prepare(
      `DELETE FROM ${table}
       WHERE rowid NOT IN (
         SELECT MIN(rowid) FROM ${table} GROUP BY ${keyColumns}
       )`,
    )
    .run();
  stats.removed += result.changes;
}

if (process.env.CORE_REPAIR_PLAYER_REFS === "1") {
  repairPlayerReferences();
}
