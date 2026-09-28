import { db, entityConfigs, normalizeRecord } from "../db.js";

const ORDERABLE_COLUMNS = {
  Tournament: new Set([
    "created_date",
    "updated_date",
    "name",
    "start_date",
    "end_date",
    "status",
    "tier",
  ]),
  Team: new Set([
    "created_date",
    "updated_date",
    "name",
    "tag",
    "total_points",
    "wins",
    "matches_played",
  ]),
  Player: new Set([
    "created_date",
    "updated_date",
    "ign",
    "team_id",
    "total_kills",
    "matches_played",
    "avg_damage",
  ]),
  Match: new Set([
    "created_date",
    "updated_date",
    "scheduled_time",
    "stage",
    "group_name",
    "day",
    "match_number",
    "status",
  ]),
  MatchResult: new Set([
    "created_date",
    "updated_date",
    "placement",
    "total_points",
    "kill_points",
    "placement_points",
    "stage",
  ]),
  NewsArticle: new Set([
    "created_date",
    "updated_date",
    "title",
    "category",
    "featured",
    "game",
    "publication_status",
    "verification_status",
    "priority",
    "source_type",
    "source_name",
  ]),
  TransferWindow: new Set([
    "created_date",
    "updated_date",
    "window",
    "date",
    "country",
  ]),
  TeamAlias: new Set([
    "created_date",
    "updated_date",
    "alias",
    "normalized_alias",
    "alias_type",
  ]),
  PlayerAlias: new Set([
    "created_date",
    "updated_date",
    "alias",
    "normalized_alias",
  ]),
  PlayerTeamHistory: new Set([
    "created_date",
    "updated_date",
    "joined_date",
    "left_date",
    "role",
    "source",
  ]),
  TournamentStage: new Set([
    "created_date",
    "updated_date",
    "name",
    "slug",
    "stage_order",
    "stage_type",
    "status",
  ]),
  TournamentStageGroup: new Set([
    "created_date",
    "updated_date",
    "group_name",
    "group_order",
  ]),
  TournamentParticipant: new Set([
    "created_date",
    "updated_date",
    "seed",
    "invite_status",
    "final_rank",
    "prize_amount",
  ]),
  TournamentParticipantStageEntry: new Set([
    "created_date",
    "updated_date",
    "phase_label",
    "placement",
    "qualified",
    "eliminated",
  ]),
  TournamentParticipantPlayer: new Set([
    "created_date",
    "updated_date",
    "player_name",
    "country",
    "role",
    "is_captain",
    "is_substitute",
  ]),
  StageStanding: new Set([
    "created_date",
    "updated_date",
    "rank",
    "matches_played",
    "wins",
    "place_points",
    "elim_points",
    "total_points",
    "progression_status",
  ]),
  StageMatchBreakdown: new Set([
    "created_date",
    "updated_date",
    "placement",
    "kills",
    "total_points",
  ]),
  PlayerMatchStat: new Set([
    "created_date",
    "updated_date",
    "player_name",
    "kills",
    "finishes",
    "knocks",
    "deaths",
    "direct_kills",
    "grenade_kills",
    "vehicle_kills",
    "zone_kills",
    "matches_played",
  ]),
};

function getAllowedFilterColumns(config) {
  return new Set(["id", "created_date", "updated_date", ...config.fields]);
}

function getAllowedSort(entityName, rawSort) {
  if (!rawSort) return "created_date DESC";
  const direction = rawSort.startsWith("-") ? "DESC" : "ASC";
  const column = rawSort.replace(/^-/, "");
  const allowlist = ORDERABLE_COLUMNS[entityName];
  if (!allowlist || !allowlist.has(column)) {
    return "created_date DESC";
  }
  return `${column} ${direction}`;
}

function serializeFilterValue(config, key, value) {
  const jsonFieldSet = new Set(config.jsonFields);
  return jsonFieldSet.has(key) ? JSON.stringify(value) : value;
}

// A draft match result must never reach anonymous clients. The whole match is
// withheld, not just the draft row: a partially entered match would otherwise
// produce incorrect public standings. Mirrors filterPublishedMatchResults().
const MATCH_RESULT_PUBLIC_FILTER = `(
  COALESCE(NULLIF(publication_status, ''), 'published') = 'published'
  AND match_id NOT IN (
    SELECT match_id FROM match_results
    WHERE COALESCE(NULLIF(publication_status, ''), 'published') <> 'published'
  )
)`;

export function applyListQuery(entityName, config, query = {}, options = {}) {
  const whereClauses = [];
  const params = [];
  const allowedFilterColumns = getAllowedFilterColumns(config);
  const allowedSelectColumns = new Set([
    "id",
    "created_date",
    "updated_date",
    "created_by",
    ...config.fields,
  ]);

  if (entityName === "MatchResult" && options.includeUnpublished !== true) {
    whereClauses.push(MATCH_RESULT_PUBLIC_FILTER);
  }

  for (const [key, value] of Object.entries(query)) {
    if (!allowedFilterColumns.has(key)) {
      throw new Error("Invalid filter parameter");
    }
    whereClauses.push(`${key} = ?`);
    params.push(serializeFilterValue(config, key, value));
  }

  // Per-entity caps sized for the eventual historical dataset. Match and
  // PlayerMatchStat counts grow with seasons/maps/players, so they need more
  // headroom than the default. Callers still page via `skip` for the largest sets.
  const LIST_LIMITS = {
    MatchResult: 5000,
    PlayerMatchStat: 5000,
    StageStanding: 5000,
    Match: 3000,
  };
  const maxListLimit = LIST_LIMITS[entityName] ?? 500;
  const safeLimit = Number.isFinite(Number(options.limit))
    ? Math.min(Number(options.limit), maxListLimit)
    : null;
  const safeSkip = Number.isFinite(Number(options.skip))
    ? Math.max(Number(options.skip), 0)
    : 0;

  let orderBy = "created_date DESC";
  if (options.sort_by) {
    orderBy = getAllowedSort(entityName, options.sort_by);
  }

  const requestedFields = String(options.fields || "")
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);
  const selectColumns =
    requestedFields.length > 0
      ? requestedFields.filter((field) => allowedSelectColumns.has(field))
      : [];
  if (requestedFields.length > 0 && selectColumns.length === 0) {
    throw new Error("No supported fields requested");
  }

  let sql = `SELECT ${selectColumns.length > 0 ? selectColumns.join(", ") : "*"} FROM ${config.table}`;
  if (whereClauses.length > 0) {
    sql += ` WHERE ${whereClauses.join(" AND ")}`;
  }
  sql += ` ORDER BY ${orderBy}`;
  if (safeLimit) {
    sql += ` LIMIT ${safeLimit}`;
  }
  if (safeSkip) {
    sql += ` OFFSET ${safeSkip}`;
  }

  const records = db
    .prepare(sql)
    .all(...params)
    .map((row) => normalizeRecord(config, row));
  return records;
}

export function listEntity(entityName, query = {}, options = {}) {
  const config = entityConfigs[entityName];
  if (!config) {
    throw new Error(`Unknown entity: ${entityName}`);
  }
  return applyListQuery(entityName, config, query, options);
}

/**
 * Walk every page of an entity list instead of assuming one response holds the
 * whole set. `applyListQuery` clamps `limit` to a per-entity cap, so callers that
 * need more than the cap (e.g. every historical player) must page through it.
 *
 * Pages advance by the number of rows actually returned, mirroring the client
 * helper in src/services/pagination.js.
 */
export function listAllEntities(entityName, query = {}, options = {}) {
  const config = entityConfigs[entityName];
  if (!config) {
    throw new Error(`Unknown entity: ${entityName}`);
  }
  const pageSize = Number(options.pageSize) > 0 ? Number(options.pageSize) : 500;
  const maxPages = Number(options.maxPages) > 0 ? Number(options.maxPages) : 200;
  const rows = [];
  for (let page = 0; page < maxPages; page += 1) {
    const batch = applyListQuery(entityName, config, query, {
      ...options,
      limit: pageSize,
      skip: page * pageSize,
    });
    if (!Array.isArray(batch) || batch.length === 0) break;
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

export function getPublishedNewsArticles(options = {}) {
  return applyListQuery(
    "NewsArticle",
    entityConfigs.NewsArticle,
    { publication_status: "published" },
    options,
  );
}
