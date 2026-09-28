import { randomUUID } from "node:crypto";
import { db, runInTransaction } from "../db.js";
import { logger } from "./logger.js";

// Idempotent enrichment path for imported historical data.
//
// This is deliberately separate from server/scripts/importTournament.js, whose
// default behaviour deletes every match and match_result for a tournament before
// re-inserting. Enrichment must never do that: it upserts individual matches and
// results, preserves unrelated data, and carries provenance.
//
// Identity keys:
//   matches           -> source_slug (preferred), else (tournament_id, stage, match_number)
//   match_results     -> (match_id, team_id)                       [existing unique index]
//   player_match_stats-> (match_id, player_name, team_id)          [existing unique index]
//   stages            -> (tournament_id, slug)                     [existing unique index]
//
// Never key on team/player display names alone.

const ALLOWED_MAPS = new Set(["Erangel", "Miramar", "Sanhok", "Rondo", "Other"]);

// The one authoritative definition of a synthetic cumulative snapshot.
//
// A snapshot is a stage total stored as a single placeholder match. It is
// identified by BOTH a placeholder match number AND the placeholder map:
//
//   (match_number = 0 OR match_number IS NULL) AND map = 'Other'
//
// The `map = 'Other'` half is load-bearing. Real matches can legitimately have
// match_number = NULL (imported feeds without numbering), and those carry real
// maps and real results. Matching on match_number alone deletes them. Every
// synthetic-detection site must use this predicate so the definition cannot
// drift between the reader and the delete path.
export const SYNTHETIC_MATCH_PREDICATE = `(match_number = 0 OR match_number IS NULL) AND map = 'Other'`;

/**
 * Row-level form of {@link SYNTHETIC_MATCH_PREDICATE} for a plain match object.
 * Used to reason about a match before it reaches the database.
 */
export function isSyntheticMatchShape(match) {
  const number = match?.match_number;
  const placeholderNumber = number === 0 || number === null || number === undefined;
  return placeholderNumber && match?.map === "Other";
}

export function slugifyStageName(value) {
  return (
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "stage"
  );
}

/**
 * Resolve an existing stage row so imported data reuses its identity instead of
 * creating a slug-colliding duplicate (startup repair prunes those by slug).
 * Only creates a stage when none exists.
 */
export function resolveStage(tournamentId, stageName, options = {}) {
  const name = String(stageName || "").trim();
  if (!name) throw new Error("Stage name is required");
  const slug = slugifyStageName(name);

  const existing = db
    .prepare("SELECT * FROM tournament_stages WHERE tournament_id = ? AND slug = ?")
    .get(tournamentId, slug);
  if (existing) return existing;

  const now = new Date().toISOString();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO tournament_stages
       (id, tournament_id, name, slug, stage_order, stage_type, status,
        summary, rules, map_rotation, created_date, updated_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    tournamentId,
    name,
    slug,
    options.stage_order ?? 999,
    options.stage_type ?? "stage",
    options.status ?? null,
    null,
    null,
    null,
    now,
    now,
  );
  return db.prepare("SELECT * FROM tournament_stages WHERE id = ?").get(id);
}

function assertProvenance(row, kind) {
  if (!row.source_url) throw new Error(`${kind} requires source_url`);
  if (!row.source_name) throw new Error(`${kind} requires source_name`);
}

/**
 * Upsert one match. `match.source_slug` is the primary idempotency key; when it is
 * absent, (tournament_id, stage, match_number) is used. Returns the match id.
 */
export function upsertMatch(tournamentId, match) {
  const stageName = String(match.stage || "").trim();
  if (!stageName) throw new Error("match.stage is required");
  const matchNumber = Number(match.match_number);
  if (!Number.isInteger(matchNumber) || matchNumber < 1) {
    throw new Error("Imported matches require an integer match_number >= 1");
  }
  if (match.map && !ALLOWED_MAPS.has(match.map)) {
    throw new Error(`Unsupported map: ${match.map}`);
  }
  assertProvenance(match, "match");

  let existing = null;
  if (match.source_slug) {
    existing = db
      .prepare("SELECT id FROM matches WHERE source_slug = ?")
      .get(match.source_slug);
  }
  if (!existing) {
    existing = db
      .prepare(
        "SELECT id FROM matches WHERE tournament_id = ? AND stage = ? AND match_number = ?",
      )
      .get(tournamentId, stageName, matchNumber);
  }

  const now = new Date().toISOString();
  const row = {
    tournament_id: tournamentId,
    stage: stageName,
    group_name: match.group_name ?? null,
    match_number: matchNumber,
    map: match.map ?? null,
    status: match.status ?? "scheduled",
    scheduled_time: match.scheduled_time ?? null,
    stream_url: match.stream_url ?? null,
    day: match.day ?? null,
    source_slug: match.source_slug ?? null,
    source_url: match.source_url ?? null,
    source_name: match.source_name ?? null,
  };

  if (existing) {
    db.prepare(
      `UPDATE matches SET
         group_name = ?, match_number = ?, map = ?, status = ?, scheduled_time = ?,
         stream_url = ?, day = ?, source_slug = COALESCE(?, source_slug),
         source_url = COALESCE(?, source_url), source_name = COALESCE(?, source_name),
         updated_date = ?
       WHERE id = ?`,
    ).run(
      row.group_name, row.match_number, row.map, row.status, row.scheduled_time,
      row.stream_url, row.day, row.source_slug, row.source_url, row.source_name,
      now, existing.id,
    );
    return existing.id;
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO matches
       (id, tournament_id, stage, group_name, match_number, map, status,
        scheduled_time, stream_url, day, source_slug, source_url, source_name,
        created_date, updated_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id, row.tournament_id, row.stage, row.group_name, row.match_number, row.map,
    row.status, row.scheduled_time, row.stream_url, row.day, row.source_slug,
    row.source_url, row.source_name, now, now,
  );
  return id;
}

export function upsertMatchResults(tournamentId, matchId, stageName, results) {
  const now = new Date().toISOString();
  let written = 0;
  for (const result of results || []) {
    const placement = Number(result.placement);
    const killPoints = Number(result.kill_points) || 0;
    const placementPoints = Number(result.placement_points) || 0;
    const totalPoints =
      Number.isFinite(Number(result.total_points)) && result.total_points !== null
        ? Number(result.total_points)
        : killPoints + placementPoints;
    const winsCount =
      Number.isFinite(Number(result.wins_count))
        ? Number(result.wins_count)
        : placement === 1
          ? 1
          : 0;

    const existing = db
      .prepare("SELECT id FROM match_results WHERE match_id = ? AND team_id = ?")
      .get(matchId, result.team_id);

    if (existing) {
      db.prepare(
        `UPDATE match_results SET
           placement = ?, kill_points = ?, placement_points = ?, total_points = ?,
           matches_count = 1, wins_count = ?, stage = ?, publication_status = ?,
           source_ref = COALESCE(?, source_ref), source_url = COALESCE(?, source_url),
           updated_date = ?
         WHERE id = ?`,
      ).run(
        Number.isFinite(placement) ? placement : null,
        killPoints, placementPoints, totalPoints, winsCount, stageName,
        result.publication_status || "published",
        result.source_ref ?? null, result.source_url ?? null, now, existing.id,
      );
    } else {
      db.prepare(
        `INSERT INTO match_results
           (id, match_id, tournament_id, team_id, placement, kill_points,
            placement_points, total_points, matches_count, wins_count, stage,
            publication_status, source_ref, source_url, created_date, updated_date, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        randomUUID(), matchId, tournamentId, result.team_id,
        Number.isFinite(placement) ? placement : null,
        killPoints, placementPoints, totalPoints, winsCount, stageName,
        result.publication_status || "published",
        result.source_ref ?? null, result.source_url ?? null,
        now, now, result.created_by ?? "import@stagecore.local",
      );
    }
    written += 1;
  }
  return written;
}

export function upsertPlayerMatchStats(playerStats) {
  const now = new Date().toISOString();
  const stats = { kills: 0, finishes: 0, knocks: 0, deaths: 0, direct_kills: 0, grenade_kills: 0, vehicle_kills: 0, zone_kills: 0 };
  let written = 0;
  for (const stat of playerStats || []) {
    if (!stat.match_id || !stat.player_name || !stat.team_id) {
      throw new Error("player_match_stats requires match_id, player_name, team_id");
    }
    const existing = db
      .prepare(
        "SELECT id FROM player_match_stats WHERE match_id = ? AND player_name = ? AND team_id = ?",
      )
      .get(stat.match_id, stat.player_name, stat.team_id);

    const values = {
      player_id: stat.player_id ?? null,
      matches_played: Number.isFinite(Number(stat.matches_played)) ? Number(stat.matches_played) : 1,
      source: stat.source ?? null,
      ...Object.fromEntries(
        Object.keys(stats).map((key) => [key, Number(stat[key]) || 0]),
      ),
    };

    if (existing) {
      db.prepare(
        `UPDATE player_match_stats SET
           player_id = ?, matches_played = ?, kills = ?, finishes = ?, knocks = ?,
           deaths = ?, direct_kills = ?, grenade_kills = ?, vehicle_kills = ?,
           zone_kills = ?, source = ?, updated_date = ?
         WHERE id = ?`,
      ).run(
        values.player_id, values.matches_played, values.kills, values.finishes,
        values.knocks, values.deaths, values.direct_kills, values.grenade_kills,
        values.vehicle_kills, values.zone_kills, values.source, now, existing.id,
      );
    } else {
      db.prepare(
        `INSERT INTO player_match_stats
           (id, match_id, player_id, player_name, team_id, matches_played, kills,
            finishes, knocks, deaths, direct_kills, grenade_kills, vehicle_kills,
            zone_kills, source, created_date, updated_date, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        randomUUID(), stat.match_id, values.player_id, stat.player_name,
        stat.team_id, values.matches_played, values.kills, values.finishes,
        values.knocks, values.deaths, values.direct_kills, values.grenade_kills,
        values.vehicle_kills, values.zone_kills, values.source, now, now,
        stat.created_by ?? "import@stagecore.local",
      );
    }
    written += 1;
  }
  return written;
}

export function recordMatchSource({ tournamentId, stageId, sourceName, sourceUrl, retrievedAt, checksum }) {
  if (!sourceUrl) throw new Error("match_sources requires source_url");
  const existing = db
    .prepare("SELECT id FROM match_sources WHERE tournament_id = ? AND source_url = ?")
    .get(tournamentId, sourceUrl);
  if (existing) return existing.id;
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO match_sources
       (id, tournament_id, stage_id, source_name, source_url, retrieved_at, checksum, created_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, tournamentId, stageId ?? null, sourceName, sourceUrl, retrievedAt || now, checksum ?? null, now);
  return id;
}

function remapPlayerStats(playerStats, matchIds) {
  // Player stats may arrive keyed by the match's source_slug (the natural key in
  // an extraction payload). Resolve those to real match ids; anything already a
  // real id passes through unchanged.
  return (playerStats || []).map((stat) => {
    const key = stat.match_key || stat.match_id;
    const resolved = matchIds[key] || stat.match_id;
    return { ...stat, match_id: resolved };
  });
}

/**
 * Idempotent enrichment of a stage. All writes happen in one transaction. Runs the
 * caller-supplied `validate()` inside the transaction; a throw rolls everything
 * back so a stage is never left half-imported.
 */
export function enrichStage({ tournamentId, stage, matches = [], resultsByMatch = {}, playerStats = [], source = {}, validate } = {}) {
  if (!tournamentId) throw new Error("tournamentId is required");

  return runInTransaction(() => {
    const stageRow = resolveStage(tournamentId, stage);
    const matchIds = {};
    for (const match of matches) {
      const id = upsertMatch(tournamentId, { ...match, stage: stageRow.name });
      matchIds[match.source_slug || `${match.stage || stageRow.name}:${match.match_number}`] = id;
    }

    let resultCount = 0;
    for (const match of matches) {
      const key = match.source_slug || `${match.stage || stageRow.name}:${match.match_number}`;
      const matchId = matchIds[key];
      const rows = resultsByMatch[key] || resultsByMatch[match.match_number] || [];
      if (rows.length > 0) {
        resultCount += upsertMatchResults(tournamentId, matchId, stageRow.name, rows);
      }
    }

    let statCount = 0;
    if (playerStats.length > 0) {
      statCount = upsertPlayerMatchStats(remapPlayerStats(playerStats, matchIds));
    }

    if (source.source_url) {
      recordMatchSource({
        tournamentId,
        stageId: stageRow.id,
        sourceName: source.source_name || "unknown",
        sourceUrl: source.source_url,
        retrievedAt: source.retrieved_at,
        checksum: source.checksum,
      });
    }

    const summary = { stageId: stageRow.id, matches: Object.keys(matchIds).length, results: resultCount, playerStats: statCount };
    if (typeof validate === "function") validate(summary);
    return summary;
  });
}

/**
 * Replace a stage's synthetic cumulative snapshot with real per-match rows.
 * Atomic: validation failure rolls back every delete and insert, so the stage is
 * never partially replaced.
 *
 * Only rows matching SYNTHETIC_MATCH_PREDICATE are removed. Real matches with
 * match_number = NULL but a real map are preserved: they are data, not
 * placeholders. Before this predicate was shared, the delete matched on
 * match_number alone and would have destroyed such rows.
 */
export function replaceSyntheticSnapshot({ tournamentId, stage, matches, resultsByMatch, playerStats = [], source = {}, validate } = {}) {
  if (!tournamentId) throw new Error("tournamentId is required");
  const stageName = String(stage || "").trim();
  if (!stageName) throw new Error("stage is required");

  return runInTransaction(() => {
    const stageRow = resolveStage(tournamentId, stageName);

    // 1+2. Remove synthetic result rows, then their placeholder matches. The
    // predicate is the shared one, so a real match can never be swept up here.
    const syntheticIds = db
      .prepare(
        `SELECT id FROM matches
         WHERE tournament_id = ? AND stage = ? AND ${SYNTHETIC_MATCH_PREDICATE}`,
      )
      .all(tournamentId, stageRow.name)
      .map((row) => row.id);

    if (syntheticIds.length > 0) {
      const placeholders = syntheticIds.map(() => "?").join(", ");
      db.prepare(`DELETE FROM match_results WHERE match_id IN (${placeholders})`).run(...syntheticIds);
      db.prepare(`DELETE FROM player_match_stats WHERE match_id IN (${placeholders})`).run(...syntheticIds);
      db.prepare(`DELETE FROM matches WHERE id IN (${placeholders})`).run(...syntheticIds);
    }

    // 3+4+5. Insert real matches, results, and player stats.
    const matchIds = {};
    for (const match of matches) {
      const id = upsertMatch(tournamentId, { ...match, stage: stageRow.name });
      matchIds[match.source_slug || `${stageRow.name}:${match.match_number}`] = id;
    }
    let resultCount = 0;
    for (const match of matches) {
      const key = match.source_slug || `${stageRow.name}:${match.match_number}`;
      const rows = resultsByMatch[key] || resultsByMatch[match.match_number] || [];
      if (rows.length > 0) resultCount += upsertMatchResults(tournamentId, matchIds[key], stageRow.name, rows);
    }
    const statCount = playerStats.length > 0
      ? upsertPlayerMatchStats(remapPlayerStats(playerStats, matchIds))
      : 0;

    if (source.source_url) {
      recordMatchSource({
        tournamentId, stageId: stageRow.id,
        sourceName: source.source_name || "unknown",
        sourceUrl: source.source_url,
        retrievedAt: source.retrieved_at,
        checksum: source.checksum,
      });
    }

    const summary = {
      stageId: stageRow.id,
      removedSyntheticMatches: syntheticIds.length,
      matches: Object.keys(matchIds).length,
      results: resultCount,
      playerStats: statCount,
    };
    // 6+7. Validation gate — a throw rolls back to the pre-call state.
    if (typeof validate === "function") validate(summary);
    logger.info("enrichment.replaceSyntheticSnapshot", summary);
    return summary;
  });
}
