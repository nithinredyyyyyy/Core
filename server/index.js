import cors from "cors";
import express from "express";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  db,
  entityConfigs,
  normalizeRecord,
  recomputeTeamStats,
  serializePayload,
} from "./db.js";
import { normalizeOrganizationName } from "../src/lib/organizationIdentity.js";
import { getTeamLogoByName } from "../src/lib/teamLogos.js";
import { buildHomeViewModel } from "./homeView.js";
import {
  backfillImportedNewsMetadata,
  importNewsFromSources,
} from "./newsIngest.js";
import { NEWS_SOURCES } from "./newsSources.js";
import { registerStreamExtractionRoutes } from "./streamExtraction.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "..", "dist");
const indexHtmlPath = path.join(distDir, "index.html");
const PUBLIC_WRITE_ENTITIES = new Set([
  "FanProfile",
  "FanPrediction",
  "FanPollVote",
  "FanChatMessage",
  "FanFollowItem",
  "SavedMatch",
  "FantasySquad",
  "FanCommentReaction",
]);
const PUBLIC_DELETE_ENTITIES = new Set([
  "FanFollowItem",
  "SavedMatch",
  "FantasySquad",
  "FanCommentReaction",
]);
const ADMIN_WRITE_ENTITIES = new Set(
  Object.keys(entityConfigs).filter(
    (entityName) => !PUBLIC_WRITE_ENTITIES.has(entityName),
  ),
);
const FAN_SESSION_SECRET = String(
  process.env.CORE_FAN_SESSION_SECRET || randomUUID(),
);
const AUTH_SESSION_SECRET = String(
  process.env.CORE_AUTH_SESSION_SECRET || randomUUID(),
);
const GOOGLE_CLIENT_ID = String(
  process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "",
).trim();
function splitTrimmedValues(rawValue) {
  return String(rawValue || "")
    .split(",")
    .flatMap((value) => {
      const normalized = value.trim();
      return normalized ? [normalized] : [];
    });
}
const ADMIN_EMAILS = new Set(
  splitTrimmedValues(
    process.env.CORE_ADMIN_EMAILS || "sathkrishna3@gmail.com",
  ).map((value) => value.toLowerCase()),
);
const CONFIGURED_CORS_ORIGINS = [
  ...splitTrimmedValues(process.env.FRONTEND_ORIGIN || ""),
  ...splitTrimmedValues(process.env.CORS_ORIGIN || ""),
];
const ALLOWED_CORS_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://localhost:5173",
  "https://127.0.0.1:5173",
  "http://localhost:4000",
  "http://127.0.0.1:4000",
  "https://localhost:4000",
  "https://127.0.0.1:4000",
  ...CONFIGURED_CORS_ORIGINS,
]);

if (process.env.CORE_BACKFILL_NEWS_ON_STARTUP === "1") {
  backfillImportedNewsMetadata();
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (ALLOWED_CORS_ORIGINS.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "stagecore",
    timestamp: new Date().toISOString(),
  });
});

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
  FanProfile: new Set([
    "created_date",
    "updated_date",
    "display_name",
    "favorite_team",
    "total_points",
    "accuracy_percent",
    "badge",
  ]),
  FanPrediction: new Set([
    "created_date",
    "updated_date",
    "prediction_date",
    "status",
    "awarded_points",
    "tournament_name",
  ]),
  FanPollVote: new Set([
    "created_date",
    "updated_date",
    "poll_key",
    "option",
    "display_name",
  ]),
  FanChatMessage: new Set([
    "created_date",
    "updated_date",
    "topic",
    "display_name",
    "tournament_name",
  ]),
  FanFollowItem: new Set([
    "created_date",
    "updated_date",
    "target_type",
    "target_label",
    "display_name",
  ]),
  SavedMatch: new Set([
    "created_date",
    "updated_date",
    "match_id",
    "display_name",
  ]),
  FantasySquad: new Set([
    "created_date",
    "updated_date",
    "week_label",
    "tournament_name",
    "total_points",
    "status",
    "display_name",
  ]),
  FanCommentReaction: new Set([
    "created_date",
    "updated_date",
    "comment_id",
    "reaction",
    "vote_value",
    "display_name",
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
};

const stringField = (min = 1) => z.string().trim().min(min);
const numberField = () => z.number().finite();
const intField = () => z.number().int();
const fanSessionRequestSchema = z.object({
  display_name: z.string().trim().min(1).max(32).optional(),
  user_id: z.string().trim().min(1).max(80).optional(),
});

const createSchemas = {
  Tournament: z.object({
    name: stringField(),
    game: stringField(),
    tier: z.string().optional(),
    status: z.string().optional(),
    prize_pool: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    stages: z.array(z.any()).optional(),
    description: z.string().optional(),
    banner_url: z.string().optional(),
    rules: z.string().optional(),
    max_teams: intField().optional(),
    format_overview: z.string().optional(),
    calendar: z.array(z.any()).optional(),
    prize_breakdown: z.array(z.any()).optional(),
    awards: z.array(z.any()).optional(),
    participants: z.array(z.any()).optional(),
    rankings: z.array(z.any()).optional(),
    created_by: z.string().optional(),
  }),
  Team: z.object({
    name: stringField(),
    tag: stringField(),
    logo_url: z.string().optional(),
    game: z.string().optional(),
    region: z.string().optional(),
    total_kills: intField().optional(),
    total_points: intField().optional(),
    matches_played: intField().optional(),
    wins: intField().optional(),
    created_by: z.string().optional(),
  }),
  Player: z.object({
    ign: stringField(),
    real_name: z.string().optional(),
    team_id: z.string().optional(),
    role: z.string().optional(),
    photo_url: z.string().optional(),
    total_kills: intField().optional(),
    matches_played: intField().optional(),
    avg_damage: numberField().optional(),
    created_by: z.string().optional(),
  }),
  Match: z.object({
    tournament_id: stringField(),
    stage: stringField(),
    group_name: z.string().optional(),
    match_number: intField().optional(),
    map: z.string().optional(),
    status: z.string().optional(),
    scheduled_time: z.string().optional(),
    stream_url: z.string().optional(),
    day: intField().optional(),
    created_by: z.string().optional(),
  }),
  MatchResult: z.object({
    match_id: stringField(),
    tournament_id: z.string().optional(),
    team_id: stringField(),
    placement: intField().optional(),
    kill_points: intField().optional(),
    placement_points: intField().optional(),
    total_points: intField().optional(),
    matches_count: intField().optional(),
    wins_count: intField().optional(),
    stage: z.string().optional(),
    created_by: z.string().optional(),
  }),
  NewsArticle: z.object({
    title: stringField(),
    summary: z.string().optional(),
    ai_summary: z.string().optional(),
    content: stringField(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    thumbnail_url: z.string().optional(),
    featured: z.number().int().min(0).max(1).optional(),
    game: z.string().optional(),
    source_name: z.string().optional(),
    source_url: z.string().optional(),
    source_type: z.string().optional(),
    verification_status: z.string().optional(),
    publication_status: z.string().optional(),
    priority: z.string().optional(),
    is_auto_ingested: z.number().int().min(0).max(1).optional(),
    import_hash: z.string().optional(),
    created_date: z.string().optional(),
    created_by: z.string().optional(),
  }),
  TransferWindow: z.object({
    window: stringField(),
    date: z.string().optional(),
    country: z.string().optional(),
    players: z.array(z.any()).optional(),
    oldTeam: z.string().optional(),
    newTeam: z.string().optional(),
    created_by: z.string().optional(),
  }),
  FanProfile: z.object({
    user_id: stringField(),
    display_name: stringField(),
    favorite_team: z.string().optional(),
    profile_image: z.string().max(750000).optional(),
    total_points: intField().optional(),
    xp_points: intField().optional(),
    login_streak: intField().optional(),
    accuracy_percent: numberField().optional(),
    badge: z.string().optional(),
    rank_badge: z.string().optional(),
    badge_inventory: z.array(z.string()).optional(),
    predictions_count: intField().optional(),
    correct_predictions: intField().optional(),
    created_by: z.string().optional(),
  }),
  FanPrediction: z.object({
    user_id: stringField(),
    display_name: stringField(),
    tournament_id: z.string().optional(),
    tournament_name: z.string().optional(),
    prediction_date: z.string().optional(),
    lock_time: z.string().optional(),
    winner_team: z.string().optional(),
    top_fragger: z.string().optional(),
    top_three: z.array(z.string()).optional(),
    status: z.string().optional(),
    awarded_points: intField().optional(),
    created_by: z.string().optional(),
  }),
  FanPollVote: z.object({
    user_id: stringField(),
    display_name: stringField(),
    poll_key: stringField(),
    option: stringField(),
    created_by: z.string().optional(),
  }),
  FanChatMessage: z.object({
    user_id: stringField(),
    display_name: stringField(),
    tournament_id: z.string().optional(),
    tournament_name: z.string().optional(),
    topic: z.string().optional(),
    body: stringField(),
    created_by: z.string().optional(),
  }),
  FanFollowItem: z.object({
    user_id: stringField(),
    display_name: stringField(),
    target_type: stringField(),
    target_id: z.string().optional(),
    target_label: stringField(),
    created_by: z.string().optional(),
  }),
  SavedMatch: z.object({
    user_id: stringField(),
    display_name: stringField(),
    match_id: stringField(),
    note: z.string().optional(),
    created_by: z.string().optional(),
  }),
  FantasySquad: z.object({
    user_id: stringField(),
    display_name: stringField(),
    tournament_id: z.string().optional(),
    tournament_name: z.string().optional(),
    week_label: z.string().optional(),
    picks: z.array(z.any()).optional(),
    captain_player_id: z.string().optional(),
    captain_name: z.string().optional(),
    total_points: intField().optional(),
    status: z.string().optional(),
    created_by: z.string().optional(),
  }),
  FanCommentReaction: z.object({
    user_id: stringField(),
    display_name: stringField(),
    comment_id: stringField(),
    reaction: z.string().optional(),
    vote_value: intField().optional(),
    created_by: z.string().optional(),
  }),
  TeamAlias: z.object({
    team_id: stringField(),
    alias: stringField(),
    normalized_alias: stringField(),
    alias_type: z.string().optional(),
  }),
  PlayerAlias: z.object({
    player_id: stringField(),
    alias: stringField(),
    normalized_alias: stringField(),
  }),
  PlayerTeamHistory: z.object({
    player_id: stringField(),
    team_id: stringField(),
    joined_date: z.string().optional(),
    left_date: z.string().optional(),
    role: z.string().optional(),
    source: z.string().optional(),
  }),
  TournamentStage: z.object({
    tournament_id: stringField(),
    name: stringField(),
    slug: stringField(),
    stage_order: intField(),
    stage_type: z.string().optional(),
    status: z.string().optional(),
    summary: z.string().optional(),
    rules: z.string().optional(),
    map_rotation: z.array(z.any()).optional(),
  }),
  TournamentStageGroup: z.object({
    stage_id: stringField(),
    group_name: stringField(),
    group_order: intField(),
  }),
  TournamentParticipant: z.object({
    tournament_id: stringField(),
    team_id: stringField(),
    seed: intField().optional(),
    invite_status: z.string().optional(),
    start_stage_id: z.string().optional(),
    final_stage_id: z.string().optional(),
    final_rank: intField().optional(),
    prize_amount: z.string().optional(),
  }),
  TournamentParticipantStageEntry: z.object({
    participant_id: stringField(),
    stage_id: stringField(),
    group_id: z.string().optional(),
    phase_label: z.string().optional(),
    placement: intField().optional(),
    qualified: z.number().int().min(0).max(1).optional(),
    eliminated: z.number().int().min(0).max(1).optional(),
    notes: z.string().optional(),
  }),
  TournamentParticipantPlayer: z.object({
    participant_id: stringField(),
    player_id: z.string().optional(),
    player_name: stringField(),
    country: z.string().optional(),
    role: z.string().optional(),
    is_captain: z.number().int().min(0).max(1).optional(),
    is_substitute: z.number().int().min(0).max(1).optional(),
  }),
  StageStanding: z.object({
    tournament_id: stringField(),
    stage_id: stringField(),
    group_id: z.string().optional(),
    team_id: stringField(),
    rank: intField().optional(),
    matches_played: intField().optional(),
    wins: intField().optional(),
    place_points: intField().optional(),
    elim_points: intField().optional(),
    total_points: intField().optional(),
    progression_status: z.string().optional(),
  }),
  StageMatchBreakdown: z.object({
    standing_id: stringField(),
    match_id: stringField(),
    placement: intField().optional(),
    kills: intField().optional(),
    total_points: intField().optional(),
  }),
};

const updateSchemas = Object.fromEntries(
  Object.entries(createSchemas).map(([entity, schema]) => [
    entity,
    schema.partial(),
  ]),
);

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

function applyListQuery(entityName, config, query = {}, options = {}) {
  const whereClauses = [];
  const params = [];
  const allowedFilterColumns = getAllowedFilterColumns(config);

  for (const [key, value] of Object.entries(query)) {
    if (!allowedFilterColumns.has(key)) {
      throw new Error(`Unsupported filter key: ${key}`);
    }
    whereClauses.push(`${key} = ?`);
    params.push(serializeFilterValue(config, key, value));
  }

  const maxListLimit = entityName === "MatchResult" ? 5000 : 500;
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

  let sql = `SELECT * FROM ${config.table}`;
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

  return db
    .prepare(sql)
    .all(...params)
    .map((row) => normalizeRecord(config, row));
}

function getHomeSummaryPayload() {
  const tournaments = applyListQuery(
    "Tournament",
    entityConfigs.Tournament,
    {},
    {
      sort_by: "-created_date",
      limit: 100,
    },
  );
  const teams = applyListQuery(
    "Team",
    entityConfigs.Team,
    {},
    {
      sort_by: "-total_points",
      limit: 400,
    },
  );
  const matches = applyListQuery(
    "Match",
    entityConfigs.Match,
    {},
    {
      sort_by: "-scheduled_time",
      limit: 80,
    },
  );
  const results = applyListQuery(
    "MatchResult",
    entityConfigs.MatchResult,
    {},
    {
      sort_by: "-created_date",
      limit: 1200,
    },
  );
  const news = getPublishedNewsArticles({
    sort_by: "-created_date",
    limit: 100,
  });

  return {
    tournaments,
    teams,
    matches,
    results,
    news,
  };
}

function validateEntityPayload(entityName, payload, mode = "create") {
  const schema =
    mode === "update" ? updateSchemas[entityName] : createSchemas[entityName];
  if (!schema) return payload || {};
  return schema.parse(payload || {});
}

function getPublishedNewsArticles(options = {}) {
  return applyListQuery(
    "NewsArticle",
    entityConfigs.NewsArticle,
    { publication_status: "published" },
    options,
  );
}

function normalizeTournamentPayload(row) {
  return normalizeRecord(entityConfigs.Tournament, row);
}

function encodeTokenSegment(value) {
  return Buffer.from(String(value), "utf8").toString("base64url");
}

function decodeTokenSegment(value) {
  return Buffer.from(String(value), "base64url").toString("utf8");
}

function signFanSessionPayload(encodedPayload) {
  return createHmac("sha256", FAN_SESSION_SECRET)
    .update(String(encodedPayload))
    .digest("base64url");
}

function signAuthSessionPayload(encodedPayload) {
  return createHmac("sha256", AUTH_SESSION_SECRET)
    .update(String(encodedPayload))
    .digest("base64url");
}

function createFanSession(displayName, preferredUserId) {
  const safeName =
    String(displayName || "").trim() ||
    `Fan${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const payload = {
    userId: String(preferredUserId || "").trim() || `fan-${randomUUID()}`,
    displayName: safeName,
    issuedAt: new Date().toISOString(),
  };
  const encodedPayload = encodeTokenSegment(JSON.stringify(payload));
  const signature = signFanSessionPayload(encodedPayload);

  return {
    userId: payload.userId,
    displayName: payload.displayName,
    token: `${encodedPayload}.${signature}`,
  };
}

function createAuthSession(user) {
  const payload = {
    userId: String(user?.id || "").trim() || `user-${randomUUID()}`,
    email: String(user?.email || "").trim(),
    fullName: String(user?.full_name || user?.displayName || "").trim(),
    role: String(user?.role || "fan").trim() || "fan",
    authMethod: String(user?.auth_method || "custom").trim() || "custom",
    issuedAt: new Date().toISOString(),
  };
  const encodedPayload = encodeTokenSegment(JSON.stringify(payload));
  const signature = signAuthSessionPayload(encodedPayload);

  return {
    user: {
      id: payload.userId,
      email: payload.email,
      full_name: payload.fullName,
      role: payload.role,
      auth_method: payload.authMethod,
    },
    token: `${encodedPayload}.${signature}`,
  };
}

function resolveFanSession(req) {
  const rawToken = String(req.headers["x-stagecore-fan-token"] || "").trim();
  if (!rawToken) return null;

  const [encodedPayload, providedSignature] = rawToken.split(".");
  if (!encodedPayload || !providedSignature) return null;

  const expectedSignature = signFanSessionPayload(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeTokenSegment(encodedPayload));
    if (!payload?.userId || !payload?.displayName) {
      return null;
    }

    return {
      token: rawToken,
      userId: String(payload.userId),
      displayName: String(payload.displayName),
      issuedAt: payload.issuedAt || null,
    };
  } catch {
    return null;
  }
}

function resolveAppAuthSession(req) {
  const rawToken = String(req.headers["x-stagecore-auth-token"] || "").trim();
  if (!rawToken) return null;

  const [encodedPayload, providedSignature] = rawToken.split(".");
  if (!encodedPayload || !providedSignature) return null;

  const expectedSignature = signAuthSessionPayload(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeTokenSegment(encodedPayload));
    if (!payload?.userId) {
      return null;
    }

    return {
      token: rawToken,
      user: {
        id: String(payload.userId),
        email: String(payload.email || ""),
        full_name: String(payload.fullName || ""),
        role: String(payload.role || "fan"),
        auth_method: String(payload.authMethod || "custom"),
      },
      issuedAt: payload.issuedAt || null,
    };
  } catch {
    return null;
  }
}

function getDirectRequestIp(req) {
  return String(req.socket?.remoteAddress || req.ip || "").trim();
}

function resolveRequestAuth(req) {
  const configuredAdminKey = String(process.env.CORE_ADMIN_KEY || "").trim();
  const providedAdminKey = String(req.headers["x-core-admin-key"] || "").trim();
  const authenticatedByKey = Boolean(
    configuredAdminKey &&
    providedAdminKey &&
    configuredAdminKey === providedAdminKey,
  );

  if (authenticatedByKey) {
    return {
      isAuthenticated: true,
      user: {
        id: "token-admin",
        email: "admin@core.remote",
        full_name: "Remote Admin",
        role: "admin",
        auth_method: "admin_key",
      },
    };
  }

  const appSession = resolveAppAuthSession(req);
  if (appSession?.user) {
    return {
      isAuthenticated: true,
      user: appSession.user,
    };
  }

  return {
    isAuthenticated: false,
    user: null,
  };
}

function isConfiguredAdminEmail(email) {
  return ADMIN_EMAILS.has(String(email || "").trim().toLowerCase());
}

function requireAdminAccess(req, res) {
  const auth = resolveRequestAuth(req);
  if (!auth.isAuthenticated) {
    res.status(401).json({
      error: "Not authenticated",
      code: "auth_required",
    });
    return false;
  }
  if (auth.user?.role !== "admin") {
    res.status(403).json({
      error: "Admin permission required",
      code: "admin_required",
    });
    return false;
  }
  req.coreAuth = auth;
  return true;
}

function ensureEntityWriteAccess(req, res, entityName) {
  if (PUBLIC_WRITE_ENTITIES.has(entityName)) {
    const fanSession = resolveFanSession(req);
    if (!fanSession) {
      res.status(401).json({
        error: "Fan session required",
        code: "fan_session_required",
      });
      return false;
    }

    req.fanSession = fanSession;
    return true;
  }

  if (!ADMIN_WRITE_ENTITIES.has(entityName)) {
    return null;
  }

  const auth = resolveRequestAuth(req);
  if (!auth.isAuthenticated || auth.user?.role !== "admin") {
    res.status(403).json({
      error: "Admin permission required",
      code: "admin_required",
    });
    return false;
  }

  req.coreAuth = auth;
  return true;
}

function withFanOwnership(entityName, payload, fanSession) {
  if (!PUBLIC_WRITE_ENTITIES.has(entityName)) {
    return payload;
  }

  return {
    ...payload,
    user_id: fanSession.userId,
    display_name: fanSession.displayName,
    created_by: `fan:${fanSession.userId}`,
  };
}

function ensurePublicRecordOwnership(req, res, entityName, id) {
  const fanSession = req.fanSession || resolveFanSession(req);
  if (!fanSession) {
    res.status(401).json({
      error: "Fan session required",
      code: "fan_session_required",
    });
    return null;
  }

  const record = getRecord(entityName, id);
  if (!record) {
    res.status(404).json({ error: "Not found" });
    return null;
  }

  if (record.user_id !== fanSession.userId) {
    res.status(403).json({
      error: "You can only modify your own fan activity",
      code: "fan_record_forbidden",
    });
    return null;
  }

  req.fanSession = fanSession;
  return record;
}

function normalizeSearchValue(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

function buildAcronym(value) {
  const parts = String(value || "")
    .replace(/[:()/.-]/g, " ")
    .split(/\s+/)
    .flatMap((part) => {
      const normalized = part.trim();
      return normalized ? [normalized] : [];
    });
  const letters = parts.reduce((result, part) => {
    if (/^\d+$/.test(part)) return result;
    const initial = part[0]?.toUpperCase();
    return initial ? `${result}${initial}` : result;
  }, "");
  const year = parts.find((part) => /^\d{4}$/.test(part));
  return year ? `${letters} ${year}` : letters;
}

function serializeFilterValue(config, key, value) {
  const jsonFieldSet = new Set(config.jsonFields);
  return jsonFieldSet.has(key) ? JSON.stringify(value) : value;
}

function getTournamentSearchAliases(tournament) {
  const name = String(tournament?.name || "");
  const lower = name.toLowerCase();
  const yearMatch = name.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : "";
  const aliases = [
    tournament?.short_name,
    tournament?.shortName,
    tournament?.tag,
    tournament?.code,
    buildAcronym(name),
    buildAcronym(name).replace(/\s+/g, ""),
  ].filter(Boolean);

  const knownSeries = [
    ["battlegrounds mobile india pro series", "BMPS"],
    ["battlegrounds mobile india series", "BGIS"],
    ["battlegrounds mobile india showdown", "BMSD"],
    ["battlegrounds mobile india international cup", "BMIC"],
    ["esl snapdragon pro series", "ESL SPS"],
  ];

  knownSeries.forEach(([pattern, code]) => {
    if (lower.includes(pattern)) {
      aliases.push(code, code.replace(/\s+/g, ""));
      if (year) {
        aliases.push(`${code} ${year}`, `${code}${year}`);
      }
    }
  });

  return [...new Set(aliases.filter(Boolean))];
}

function scoreTextMatch(value, query) {
  if (!value) return -1;
  const normalized = String(value).toLowerCase().trim();
  const compact = normalizeSearchValue(value);
  const compactQuery = normalizeSearchValue(query);
  if (normalized === query || compact === compactQuery) return 160;
  if (normalized.startsWith(query) || compact.startsWith(compactQuery))
    return 120;
  if (normalized.includes(query) || compact.includes(compactQuery)) return 75;
  return -1;
}

function isShortCodeQuery(query) {
  const compact = normalizeSearchValue(query);
  return compact.length >= 2 && compact.length <= 8;
}

function getGlobalSearchResults(rawQuery, rawLimit = 10) {
  const query = String(rawQuery || "")
    .toLowerCase()
    .trim();
  if (query.length < 2) return [];

  const limit = Number.isFinite(Number(rawLimit))
    ? Math.min(Math.max(Number(rawLimit), 1), 20)
    : 10;
  const compactQuery = normalizeSearchValue(query);
  const shortCodeQuery = isShortCodeQuery(query);
  const tournaments = db
    .prepare("SELECT * FROM tournaments")
    .all()
    .map(normalizeTournamentPayload);
  const teams = db
    .prepare("SELECT * FROM teams")
    .all()
    .map((row) => normalizeRecord(entityConfigs.Team, row));
  const teamAliases = db
    .prepare("SELECT * FROM team_aliases")
    .all()
    .map((row) => normalizeRecord(entityConfigs.TeamAlias, row));
  const players = db
    .prepare("SELECT * FROM players")
    .all()
    .map((row) => normalizeRecord(entityConfigs.Player, row));
  const playerAliases = db
    .prepare("SELECT * FROM player_aliases")
    .all()
    .map((row) => normalizeRecord(entityConfigs.PlayerAlias, row));
  const matches = db
    .prepare("SELECT * FROM matches")
    .all()
    .map((row) => normalizeRecord(entityConfigs.Match, row));
  const news = db
    .prepare(
      "SELECT * FROM news_articles WHERE publication_status = 'published'",
    )
    .all()
    .map((row) => normalizeRecord(entityConfigs.NewsArticle, row));

  const teamById = new Map(teams.map((team) => [team.id, team]));
  const tournamentById = new Map(
    tournaments.map((tournament) => [tournament.id, tournament]),
  );

  const organizations = new Map();
  teams.forEach((team) => {
    const key = normalizeSearchValue(team.name || team.tag || team.id);
    organizations.set(key, {
      label: team.name,
      sub: team.tag || "Team profile",
      aliases: new Set([team.name, team.tag].filter(Boolean)),
      path: `/teams?team=${encodeURIComponent(team.name)}`,
    });
  });

  teamAliases.forEach((alias) => {
    const team = teamById.get(alias.team_id);
    if (!team) return;
    const key = normalizeSearchValue(team.name || team.tag || team.id);
    const organization = organizations.get(key);
    if (!organization) return;
    organization.aliases.add(alias.alias);
    organization.aliases.add(alias.normalized_alias);
  });

  const playerAliasMap = new Map();
  players.forEach((player) => {
    playerAliasMap.set(
      player.id,
      new Set([player.ign, player.real_name].filter(Boolean)),
    );
  });
  playerAliases.forEach((alias) => {
    const existing = playerAliasMap.get(alias.player_id);
    if (!existing) return;
    existing.add(alias.alias);
    existing.add(alias.normalized_alias);
  });

  const results = [];

  tournaments.forEach((tournament) => {
    const aliases = [
      tournament.name,
      tournament.game,
      tournament.status,
      ...getTournamentSearchAliases(tournament),
    ].filter(Boolean);
    let score = Math.max(
      ...aliases.map((alias) => scoreTextMatch(alias, query)),
    );
    const exactAliasHit = aliases.some(
      (alias) => normalizeSearchValue(alias) === compactQuery,
    );
    if (exactAliasHit) score = Math.max(score, 280);
    if (score < 0) return;
    results.push({
      type: "tournament",
      label: tournament.name,
      sub: `${tournament.game || "Tournament"}${tournament.status ? ` · ${tournament.status}` : ""}`,
      path: `/tournaments?id=${tournament.id}`,
      score: score + 60,
    });
  });

  [...organizations.values()].forEach((organization) => {
    const aliases = [...organization.aliases].filter(Boolean);
    let score = Math.max(
      scoreTextMatch(organization.label, query),
      scoreTextMatch(organization.sub, query),
      ...aliases.map((alias) => scoreTextMatch(alias, query)),
    );
    const compactTag = normalizeSearchValue(organization.sub);
    const exactAliasHit = aliases.some(
      (alias) => normalizeSearchValue(alias) === compactQuery,
    );
    if (compactTag && compactTag === compactQuery) score = Math.max(score, 250);
    if (exactAliasHit) score = Math.max(score, 220);
    if (score < 0) return;
    results.push({
      type: "team",
      label: organization.label,
      sub: organization.sub,
      path: organization.path,
      score: score + 70,
    });
  });

  players.forEach((player) => {
    const aliases = [...(playerAliasMap.get(player.id) || [])].filter(Boolean);
    const team = teamById.get(player.team_id);
    let score = Math.max(
      scoreTextMatch(player.ign, query),
      scoreTextMatch(player.real_name, query),
      scoreTextMatch(team?.name, query),
      ...aliases.map((alias) => scoreTextMatch(alias, query)),
    );
    const exactAliasHit = aliases.some(
      (alias) => normalizeSearchValue(alias) === compactQuery,
    );
    if (exactAliasHit) score = Math.max(score, 210);
    if (score < 0) return;
    results.push({
      type: "player",
      label: player.ign,
      sub: team?.name || player.real_name || "Player",
      path: `/players/${encodeURIComponent(player.ign)}${team?.name ? `?team=${encodeURIComponent(team.name)}` : ""}`,
      score: score + 20,
    });
  });

  matches.forEach((match) => {
    const tournament = tournamentById.get(match.tournament_id);
    const stageLabel = `${match.stage || ""}${match.group_name ? ` · ${match.group_name}` : ""}`;
    const score = Math.max(
      scoreTextMatch(stageLabel, query),
      scoreTextMatch(match.map, query),
      scoreTextMatch(tournament?.name, query),
      scoreTextMatch(`match ${match.match_number || ""}`, query),
    );
    if (score < 0) return;
    results.push({
      type: "match",
      label: tournament?.name || "Match",
      sub: `${stageLabel || "Stage pending"}${match.map ? ` · ${match.map}` : ""}${match.match_number ? ` · Match ${match.match_number}` : ""}`,
      path: tournament ? `/tournaments?id=${tournament.id}` : "/tournaments",
      score,
    });
  });

  news.forEach((article) => {
    let score = Math.max(
      scoreTextMatch(article.title, query),
      scoreTextMatch(article.category?.replace(/_/g, " "), query),
      scoreTextMatch(article.game, query),
    );
    if (score < 0) return;
    if (shortCodeQuery) {
      score -= 70;
    }
    results.push({
      type: "news",
      label: article.title,
      sub: article.category?.replace(/_/g, " ") || article.game || "Story",
      path: `/news/${article.id}`,
      score: score - 20,
    });
  });

  return results
    .filter((result) => result.label && result.path)
    .sort(
      (left, right) =>
        right.score - left.score || left.label.localeCompare(right.label),
    )
    .filter((result, index, list) => {
      const duplicateIndex = list.findIndex(
        (item) =>
          item.type === result.type &&
          item.path === result.path &&
          normalizeSearchValue(item.label) ===
            normalizeSearchValue(result.label),
      );
      return duplicateIndex === index;
    })
    .slice(0, limit)
    .map(({ score, ...result }) => result);
}

registerStreamExtractionRoutes({
  app,
  requireAdmin: requireAdminAccess,
});

function deriveStandingsFromMatchResults(tournamentId, stages, stageGroups) {
  if (!stages.length) return [];

  const rows = db
    .prepare(
      `
      SELECT
        mr.team_id,
        mr.placement,
        mr.kill_points,
        mr.placement_points,
        mr.total_points,
        mr.matches_count,
        mr.wins_count,
        mr.stage,
        m.group_name,
        tm.name AS team_name,
        tm.tag AS team_tag,
        tm.logo_url AS team_logo_url
      FROM match_results mr
      LEFT JOIN matches m ON m.id = mr.match_id
      JOIN teams tm ON tm.id = mr.team_id
      WHERE mr.tournament_id = ?
    `,
    )
    .all(tournamentId);

  if (!rows.length) return [];

  const stageIdByName = new Map(stages.map((stage) => [stage.name, stage.id]));
  const groupIdByStageAndName = new Map(
    stageGroups.map((group) => [
      `${group.stage_id}::${group.group_name}`,
      group.id,
    ]),
  );
  const grouped = new Map();

  rows.forEach((row) => {
    const stageId = stageIdByName.get(row.stage);
    if (!stageId) return;

    const stage = stages.find((entry) => entry.id === stageId);
    const stageType = String(stage?.stage_type || "").toLowerCase();
    const normalizedGroupName =
      row.group_name && stageType !== "grand_finals"
        ? String(row.group_name).startsWith("Group ")
          ? row.group_name
          : `Group ${String(row.group_name)
              .replace(/^group\s+/i, "")
              .toUpperCase()}`
        : null;
    const groupId = normalizedGroupName
      ? groupIdByStageAndName.get(`${stageId}::${normalizedGroupName}`) || null
      : null;
    const aggregateKey = `${stageId}::${groupId || "overall"}::${row.team_id}`;

    const existing = grouped.get(aggregateKey) || {
      id: randomUUID(),
      tournament_id: tournamentId,
      stage_id: stageId,
      group_id: groupId,
      team_id: row.team_id,
      matches_played: 0,
      wins: 0,
      place_points: 0,
      elim_points: 0,
      total_points: 0,
      placement_sum: 0,
      team: {
        id: row.team_id,
        name: row.team_name,
        tag: row.team_tag,
        logo_url: row.team_logo_url,
      },
      stage_name: row.stage,
      group_name: normalizedGroupName,
      progression_status: null,
    };

    const wins =
      Number.isFinite(Number(row.wins_count)) && Number(row.wins_count) > 0
        ? Number(row.wins_count)
        : Number(row.placement) === 1
          ? 1
          : 0;

    existing.matches_played += Number(row.matches_count) || 1;
    existing.wins += wins;
    existing.place_points += Number(row.placement_points) || 0;
    existing.elim_points += Number(row.kill_points) || 0;
    existing.total_points += Number(row.total_points) || 0;
    existing.placement_sum += Number(row.placement) || 0;
    grouped.set(aggregateKey, existing);
  });

  const listsByBoard = new Map();
  [...grouped.values()].forEach((entry) => {
    const boardKey = `${entry.stage_id}::${entry.group_id || "overall"}`;
    const list = listsByBoard.get(boardKey) || [];
    list.push(entry);
    listsByBoard.set(boardKey, list);
  });

  const derived = [];
  listsByBoard.forEach((list) => {
    list
      .map((entry) => ({
        ...entry,
        average_elimination_position:
          (entry.matches_played || 0) > 0
            ? entry.placement_sum / entry.matches_played
            : null,
      }))
      .sort((a, b) => {
        if ((b.total_points || 0) !== (a.total_points || 0))
          return (b.total_points || 0) - (a.total_points || 0);
        if ((b.wins || 0) !== (a.wins || 0))
          return (b.wins || 0) - (a.wins || 0);
        if ((b.place_points || 0) !== (a.place_points || 0))
          return (b.place_points || 0) - (a.place_points || 0);
        const aAverage = Number.isFinite(a.average_elimination_position)
          ? a.average_elimination_position
          : Number.POSITIVE_INFINITY;
        const bAverage = Number.isFinite(b.average_elimination_position)
          ? b.average_elimination_position
          : Number.POSITIVE_INFINITY;
        if (aAverage !== bAverage) return aAverage - bAverage;
        if ((b.elim_points || 0) !== (a.elim_points || 0))
          return (b.elim_points || 0) - (a.elim_points || 0);
        return String(a.team?.name || "").localeCompare(
          String(b.team?.name || ""),
        );
      })
      .forEach((entry, index) => {
        derived.push({
          ...entry,
          rank: index + 1,
        });
      });
  });

  return derived;
}

function getNormalizedTournament(id) {
  const tournamentRow = db
    .prepare("SELECT * FROM tournaments WHERE id = ?")
    .get(id);
  if (!tournamentRow) return null;

  const tournament = normalizeTournamentPayload(tournamentRow);
  const stages = db
    .prepare(
      "SELECT * FROM tournament_stages WHERE tournament_id = ? ORDER BY stage_order ASC, name ASC",
    )
    .all(id)
    .map((row) => normalizeRecord(entityConfigs.TournamentStage, row));

  const stageIds = stages.map((stage) => stage.id);
  const stageGroups = stageIds.length
    ? db
        .prepare(
          `SELECT * FROM tournament_stage_groups WHERE stage_id IN (${stageIds.map(() => "?").join(", ")}) ORDER BY group_order ASC, group_name ASC`,
        )
        .all(...stageIds)
        .map((row) => normalizeRecord(entityConfigs.TournamentStageGroup, row))
    : [];

  const participants = db
    .prepare(
      `
      SELECT tp.*, tm.name AS team_name, tm.tag AS team_tag, tm.logo_url AS team_logo_url
      FROM tournament_participants tp
      JOIN teams tm ON tm.id = tp.team_id
      WHERE tp.tournament_id = ?
      ORDER BY COALESCE(tp.final_rank, 9999), tm.name ASC
    `,
    )
    .all(id)
    .map((row) => ({
      ...normalizeRecord(entityConfigs.TournamentParticipant, row),
      team: {
        id: row.team_id,
        name: row.team_name,
        tag: row.team_tag,
        logo_url: row.team_logo_url,
      },
    }));

  const participantIds = participants.map((participant) => participant.id);
  const participantStageEntries = participantIds.length
    ? db
        .prepare(
          `
          SELECT tse.*, ts.name AS stage_name, tsg.group_name
          FROM tournament_participant_stage_entries tse
          JOIN tournament_stages ts ON ts.id = tse.stage_id
          LEFT JOIN tournament_stage_groups tsg ON tsg.id = tse.group_id
          WHERE tse.participant_id IN (${participantIds.map(() => "?").join(", ")})
          ORDER BY ts.stage_order ASC, COALESCE(tsg.group_order, 999), tse.placement ASC
        `,
        )
        .all(...participantIds)
        .map((row) =>
          normalizeRecord(entityConfigs.TournamentParticipantStageEntry, row),
        )
    : [];

  const participantPlayers = participantIds.length
    ? db
        .prepare(
          `
          SELECT tpp.*, p.ign AS player_ign, p.role AS player_role, p.photo_url AS player_photo_url
          FROM tournament_participant_players tpp
          LEFT JOIN players p ON p.id = tpp.player_id
          WHERE tpp.participant_id IN (${participantIds.map(() => "?").join(", ")})
          ORDER BY tpp.player_name ASC
        `,
        )
        .all(...participantIds)
        .map((row) =>
          normalizeRecord(entityConfigs.TournamentParticipantPlayer, row),
        )
    : [];

  const standings = stageIds.length
    ? db
        .prepare(
          `
          SELECT ss.*, ts.name AS stage_name, tsg.group_name, tm.name AS team_name, tm.tag AS team_tag, tm.logo_url AS team_logo_url
          FROM stage_standings ss
          JOIN tournament_stages ts ON ts.id = ss.stage_id
          LEFT JOIN tournament_stage_groups tsg ON tsg.id = ss.group_id
          JOIN teams tm ON tm.id = ss.team_id
          WHERE ss.tournament_id = ?
          ORDER BY ts.stage_order ASC, COALESCE(tsg.group_order, 999), COALESCE(ss.rank, 9999), tm.name ASC
        `,
        )
        .all(id)
        .map((row) => ({
          ...normalizeRecord(entityConfigs.StageStanding, row),
          stage_name: row.stage_name,
          group_name: row.group_name,
          team: {
            id: row.team_id,
            name: row.team_name,
            tag: row.team_tag,
            logo_url: row.team_logo_url,
          },
        }))
    : [];

  const derivedStandings = deriveStandingsFromMatchResults(
    id,
    stages,
    stageGroups,
  );
  const persistedByBoard = new Map();
  standings.forEach((entry) => {
    const boardKey = `${entry.stage_id}::${entry.group_id || "overall"}`;
    const list = persistedByBoard.get(boardKey) || [];
    list.push(entry);
    persistedByBoard.set(boardKey, list);
  });

  const derivedByBoard = new Map();
  derivedStandings.forEach((entry) => {
    const boardKey = `${entry.stage_id}::${entry.group_id || "overall"}`;
    const list = derivedByBoard.get(boardKey) || [];
    list.push(entry);
    derivedByBoard.set(boardKey, list);
  });

  const selectedBoards = new Set();
  derivedByBoard.forEach((derivedList, boardKey) => {
    const persistedList = persistedByBoard.get(boardKey) || [];
    if (
      persistedList.length === 0 ||
      derivedList.length > persistedList.length
    ) {
      selectedBoards.add(boardKey);
    }
  });

  const mergedStandings = standings.filter((entry) => {
    const boardKey = `${entry.stage_id}::${entry.group_id || "overall"}`;
    return !selectedBoards.has(boardKey);
  });
  derivedStandings.forEach((entry) => {
    const boardKey = `${entry.stage_id}::${entry.group_id || "overall"}`;
    if (selectedBoards.has(boardKey)) {
      mergedStandings.push(entry);
    }
  });

  const groupedEntries = new Map();
  participantStageEntries.forEach((entry) => {
    const list = groupedEntries.get(entry.participant_id) || [];
    list.push(entry);
    groupedEntries.set(entry.participant_id, list);
  });

  const groupedPlayers = new Map();
  participantPlayers.forEach((player) => {
    const list = groupedPlayers.get(player.participant_id) || [];
    list.push(player);
    groupedPlayers.set(player.participant_id, list);
  });

  const groupedGroups = new Map();
  stageGroups.forEach((group) => {
    const list = groupedGroups.get(group.stage_id) || [];
    list.push(group);
    groupedGroups.set(group.stage_id, list);
  });

  const groupedStandings = new Map();
  mergedStandings.forEach((standing) => {
    const key = `${standing.stage_id}::${standing.group_id || "overall"}`;
    const list = groupedStandings.get(key) || [];
    list.push(standing);
    groupedStandings.set(key, list);
  });

  return {
    tournament,
    stages: stages.map((stage) => ({
      ...stage,
      groups: groupedGroups.get(stage.id) || [],
      standings: {
        overall: groupedStandings.get(`${stage.id}::overall`) || [],
        by_group: Object.fromEntries(
          (groupedGroups.get(stage.id) || []).map((group) => [
            group.group_name,
            groupedStandings.get(`${stage.id}::${group.id}`) || [],
          ]),
        ),
      },
    })),
    participants: participants.map((participant) => ({
      ...participant,
      stage_entries: groupedEntries.get(participant.id) || [],
      players: groupedPlayers.get(participant.id) || [],
    })),
  };
}

function isBmps2026PromotionStage(stageName) {
  return /^round\s+[123]$/i.test(String(stageName || "").trim());
}

function getBmps2026NextStageName(stageName) {
  const normalized = String(stageName || "")
    .trim()
    .toLowerCase();
  if (normalized === "round 1") return "Round 2";
  if (normalized === "round 2") return "Round 3";
  if (normalized === "round 3") return "Round 4";
  return null;
}

function getBmps2026StageDestination({ stageName, group, placement }) {
  const normalizedStage = String(stageName || "")
    .trim()
    .toLowerCase();
  const normalizedGroup = String(group || "")
    .trim()
    .toUpperCase();

  if (normalizedStage === "round 4") {
    if (normalizedGroup === "A") return placement <= 8 ? "Grand Finals" : "Semi Finals";
    if (normalizedGroup === "B") return placement <= 8 ? "Semi Finals" : "Survival Stage";
    if (normalizedGroup === "C") return "Survival Stage";
    if (normalizedGroup === "D") return placement <= 8 ? "Survival Stage" : null;
  }

  return null;
}

function getBmps2026MovementGroup(group, placement, totalTeams) {
  const label = String(group || "")
    .trim()
    .toUpperCase();
  const total = Math.max(Number(totalTeams) || 0, 0);
  const bottomCutoff = Math.max(total - 3, 13);

  if (label === "A") {
    if (placement >= bottomCutoff) return "B";
    return "A";
  }
  if (label === "B") {
    if (placement <= 4) return "A";
    if (placement >= bottomCutoff) return "C";
    return "B";
  }
  if (label === "C") {
    if (placement <= 4) return "B";
    if (placement >= bottomCutoff) return "D";
    return "C";
  }
  if (label === "D") {
    if (placement <= 4) return "C";
    return "D";
  }
  return label || "A";
}

function deriveBmps2026OverviewEntries(normalizedTournament) {
  const baseEntries = (normalizedTournament?.participants || []).map(
    (participant) => ({
      team: participant?.team?.name || "Unknown Team",
      phase:
        participant?.stage_entries?.[0]?.stage_name &&
        participant?.stage_entries?.[0]?.group_name
          ? `${participant.stage_entries[0].stage_name} - ${participant.stage_entries[0].group_name}`
          : participant?.stage_entries?.[0]?.stage_name || "Participants",
    }),
  );
  const derivedEntries = [...baseEntries];
  const knownPhaseKeys = new Set(
    derivedEntries.map(
      (entry) =>
        `${normalizeOrganizationName(entry.team)}::${String(entry.phase || "").toLowerCase()}`,
    ),
  );

  for (const stage of normalizedTournament?.stages || []) {
    const nextStageName = getBmps2026NextStageName(stage?.name);
    const isRound4 = String(stage?.name || "").trim().toLowerCase() === "round 4";
    if (!isBmps2026PromotionStage(stage?.name) && !isRound4) continue;
    if (!isRound4 && !nextStageName) continue;

    const rowsByGroup = new Map();
    const groupedStandings = stage?.standings?.by_group || {};
    Object.entries(groupedStandings).forEach(([groupName, rows]) => {
      const groupLabel = String(groupName || "")
        .replace(/^Group\s+/i, "")
        .trim()
        .toUpperCase();
      const filteredRows = (rows || []).filter((row) => row?.team?.name);
      if (groupLabel && filteredRows.length > 0) {
        rowsByGroup.set(groupLabel, filteredRows);
      }
    });

    for (const [group, rows] of rowsByGroup.entries()) {
      const orderedRows = rows.toSorted((left, right) => {
        if ((right.total_points || 0) !== (left.total_points || 0)) {
          return (right.total_points || 0) - (left.total_points || 0);
        }
        if ((right.wins || 0) !== (left.wins || 0)) {
          return (right.wins || 0) - (left.wins || 0);
        }
        if ((right.place_points || 0) !== (left.place_points || 0)) {
          return (right.place_points || 0) - (left.place_points || 0);
        }
        return String(left.team?.name || "").localeCompare(
          String(right.team?.name || ""),
        );
      });

      orderedRows.forEach((row, index) => {
        const teamName = row?.team?.name || "Unknown Team";
        const destinationStage = isRound4
          ? getBmps2026StageDestination({
              stageName: stage?.name,
              group,
              placement: index + 1,
            })
          : nextStageName;
        if (!destinationStage) return;
        const destinationGroup = isRound4
          ? null
          : getBmps2026MovementGroup(group, index + 1, orderedRows.length);
        const phase = destinationGroup
          ? `${destinationStage} - Group ${destinationGroup}`
          : destinationStage;
        const phaseKey = `${normalizeOrganizationName(teamName)}::${phase.toLowerCase()}`;
        if (knownPhaseKeys.has(phaseKey)) return;
        knownPhaseKeys.add(phaseKey);
        derivedEntries.push({ team: teamName, phase });
      });
    }
  }

  return derivedEntries;
}

function insertRecord(entityName, payload) {
  const config = entityConfigs[entityName];
  const now = new Date().toISOString();
  const record = {
    id: randomUUID(),
    created_date: now,
    updated_date: now,
    ...serializePayload(config, payload),
  };

  const columns = Object.keys(record);
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT INTO ${config.table} (${columns.join(", ")}) VALUES (${placeholders})`;
  db.prepare(sql).run(...columns.map((column) => record[column]));

  if (entityName === "MatchResult") {
    recomputeTeamStats();
  }

  return getRecord(entityName, record.id);
}

function getRecord(entityName, id) {
  const config = entityConfigs[entityName];
  const row = db.prepare(`SELECT * FROM ${config.table} WHERE id = ?`).get(id);
  return normalizeRecord(config, row);
}

function updateRecord(entityName, id, payload) {
  const config = entityConfigs[entityName];
  const updates = serializePayload(config, payload);
  updates.updated_date = new Date().toISOString();
  const fields = Object.keys(updates);
  if (fields.length === 0) {
    return getRecord(entityName, id);
  }
  const sql = `UPDATE ${config.table} SET ${fields.map((field) => `${field} = ?`).join(", ")} WHERE id = ?`;
  db.prepare(sql).run(...fields.map((field) => updates[field]), id);

  if (entityName === "MatchResult") {
    recomputeTeamStats();
  }

  return getRecord(entityName, id);
}

function deleteRecord(entityName, id) {
  const config = entityConfigs[entityName];

  if (entityName === "Team") {
    db.prepare("DELETE FROM players WHERE team_id = ?").run(id);
    db.prepare("DELETE FROM match_results WHERE team_id = ?").run(id);
  }
  if (entityName === "Tournament") {
    const matchIds = db
      .prepare("SELECT id FROM matches WHERE tournament_id = ?")
      .all(id)
      .map((row) => row.id);
    if (matchIds.length > 0) {
      const placeholders = matchIds.map(() => "?").join(", ");
      db.prepare(
        `DELETE FROM match_results WHERE match_id IN (${placeholders})`,
      ).run(...matchIds);
    }
    db.prepare("DELETE FROM matches WHERE tournament_id = ?").run(id);
    db.prepare("DELETE FROM match_results WHERE tournament_id = ?").run(id);
  }
  if (entityName === "Match") {
    db.prepare("DELETE FROM match_results WHERE match_id = ?").run(id);
  }

  const result = db.prepare(`DELETE FROM ${config.table} WHERE id = ?`).run(id);
  if (
    entityName === "MatchResult" ||
    entityName === "Team" ||
    entityName === "Tournament" ||
    entityName === "Match"
  ) {
    recomputeTeamStats();
  }
  return result.changes > 0;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/admin/overview", (req, res) => {
  const auth = resolveRequestAuth(req);
  if (!auth.isAuthenticated) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const countForEntity = (entityName) => {
    const config = entityConfigs[entityName];
    if (!config?.table) return 0;
    const row = db
      .prepare(`SELECT COUNT(*) AS count FROM ${config.table}`)
      .get();
    return Number(row?.count || 0);
  };

  const teams = db.prepare("SELECT name, logo_url FROM teams").all();
  const activeTournaments = db
    .prepare(
      "SELECT id, name, participants, status FROM tournaments WHERE status != 'completed'",
    )
    .all();

  const duplicateBuckets = new Map();
  teams.forEach((team) => {
    const key = normalizeOrganizationName(team?.name || "");
    if (!key) return;
    duplicateBuckets.set(key, (duplicateBuckets.get(key) || 0) + 1);
  });
  const duplicateOrgCount = [...duplicateBuckets.values()].filter(
    (count) => count > 1,
  ).length;

  const teamKeys = new Set(
    teams.flatMap((team) => {
      const normalized = normalizeOrganizationName(team?.name || "");
      return normalized ? [normalized] : [];
    }),
  );
  const participantNames = new Set();
  let unresolvedParticipantCount = 0;

  activeTournaments.forEach((tournament) => {
    let participants = [];
    if (tournament?.name === "Battlegrounds Mobile India Pro Series 2026") {
      const normalizedTournament = getNormalizedTournament(tournament.id);
      participants = deriveBmps2026OverviewEntries(normalizedTournament);
    } else {
      try {
        participants = JSON.parse(tournament?.participants || "[]");
      } catch {
        participants = [];
      }
    }

    participants.forEach((entry) => {
      const name = entry?.team;
      if (!name) return;
      participantNames.add(name);
      const key = normalizeOrganizationName(name);
      if (key && !teamKeys.has(key)) {
        unresolvedParticipantCount += 1;
      }
    });
  });

  const missingLogoCount = [...participantNames].filter((name) => {
    const team = teams.find(
      (row) =>
        normalizeOrganizationName(row?.name || "") ===
        normalizeOrganizationName(name),
    );
    return !(team?.logo_url || getTeamLogoByName(name));
  }).length;

  return res.json({
    counts: {
      tournaments: countForEntity("Tournament"),
      teams: countForEntity("Team"),
      matches: countForEntity("Match"),
      news: countForEntity("NewsArticle"),
      transfers: countForEntity("TransferWindow"),
      activeTournaments: activeTournaments.length,
    },
    health: {
      duplicateOrgCount,
      unresolvedParticipantCount,
      missingLogoCount,
    },
  });
});

app.get("/api/auth/me", (req, res) => {
  const auth = resolveRequestAuth(req);
  if (!auth.isAuthenticated) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json(auth.user);
});

app.post("/api/auth/google", async (req, res) => {
  const payloadSchema = z.object({
    credential: z.string().min(1),
  });

  try {
    const payload = payloadSchema.parse(req.body || {});

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        error: "Google sign-in is not configured",
        code: "google_signin_not_configured",
      });
    }

    const verifyResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(payload.credential)}`,
    );

    if (!verifyResponse.ok) {
      return res.status(401).json({
        error: "Invalid Google credential",
        code: "google_signin_invalid_token",
      });
    }

    const googleProfile = await verifyResponse.json();
    if (
      String(googleProfile?.aud || "").trim() !== GOOGLE_CLIENT_ID ||
      String(googleProfile?.email_verified || "").toLowerCase() !== "true"
    ) {
      return res.status(401).json({
        error: "Google credential could not be verified",
        code: "google_signin_verification_failed",
      });
    }

    const session = createAuthSession({
      id: `google:${String(googleProfile.sub || "").trim()}`,
      email: googleProfile.email,
      full_name:
        googleProfile.name ||
        googleProfile.given_name ||
        String(googleProfile.email || "").split("@")[0] ||
        "StageCore User",
      role: isConfiguredAdminEmail(googleProfile.email) ? "admin" : "fan",
      auth_method: "google",
    });

    return res.status(201).json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid Google sign-in payload",
        issues: error.issues,
      });
    }

    return res.status(500).json({
      error: error?.message || "Google sign-in failed",
      code: "google_signin_failed",
    });
  }
});

app.post("/api/fan/session", (req, res) => {
  try {
    const payload = fanSessionRequestSchema.parse(req.body || {});
    const session = createFanSession(payload.display_name, payload.user_id);
    return res.status(201).json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid session payload", issues: error.issues });
    }
    throw error;
  }
});

app.get("/api/search", (req, res) => {
  return res.json(getGlobalSearchResults(req.query.q, req.query.limit));
});

app.get("/api/home/summary", (_req, res) => {
  try {
    return res.json(getHomeSummaryPayload());
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Failed to build home summary" });
  }
});

app.get("/api/home/view", (_req, res) => {
  try {
    const summary = getHomeSummaryPayload();
    const mode = _req.query.mode === "mobile" ? "mobile" : "desktop";
    return res.json(buildHomeViewModel(summary, { mode }));
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Failed to build home view" });
  }
});

app.get("/api/news/public", (req, res) => {
  try {
    const records = getPublishedNewsArticles(req.query);
    return res.json(records);
  } catch (error) {
    return res
      .status(400)
      .json({ error: error.message || "Invalid news query" });
  }
});

app.get("/api/news/public/:id", (req, res) => {
  const record = getRecord("NewsArticle", req.params.id);
  if (!record || record.publication_status !== "published") {
    return res.status(404).json({ error: "Not found" });
  }
  return res.json(record);
});

app.get("/api/admin/news/sources", (req, res) => {
  const auth = resolveRequestAuth(req);
  if (!auth.isAuthenticated) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  return res.json(
    NEWS_SOURCES.map((source) => ({
      id: source.id,
      name: source.name,
      type: source.type,
      url: source.url,
      category: source.category,
      game: source.game,
      enabled: Boolean(source.enabled),
      priority: source.priority || "routine",
    })),
  );
});

app.post("/api/admin/news/import", async (req, res) => {
  const auth = resolveRequestAuth(req);
  if (!auth.isAuthenticated) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const result = await importNewsFromSources({
      sourceIds: Array.isArray(req.body?.source_ids) ? req.body.source_ids : [],
      limitPerSource: Number.isFinite(Number(req.body?.limit_per_source))
        ? Number(req.body.limit_per_source)
        : 8,
      manualUrl: req.body?.manual_url,
      manualSourceName: req.body?.manual_source_name,
      manualSourceType: req.body?.manual_source_type,
      manualCategory: req.body?.manual_category,
      manualGame: req.body?.manual_game,
      manualPriority: req.body?.manual_priority,
    });
    return res.status(201).json(result);
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "News import failed" });
  }
});

app.post("/api/admin/news/backfill", (req, res) => {
  const auth = resolveRequestAuth(req);
  if (!auth.isAuthenticated) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    return res.status(200).json(backfillImportedNewsMetadata());
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "News metadata refresh failed" });
  }
});

app.get("/api/tournaments/:id/normalized", (req, res) => {
  const normalized = getNormalizedTournament(req.params.id);
  if (!normalized) {
    return res.status(404).json({ error: "Tournament not found" });
  }
  return res.json(normalized);
});

app.get("/api/entities/:entity", (req, res) => {
  const entityName = req.params.entity;
  const config = entityConfigs[entityName];
  if (!config) {
    return res.status(404).json({ error: "Unknown entity" });
  }
  let query = {};
  if (req.query.q) {
    try {
      query = JSON.parse(req.query.q);
    } catch {
      return res.status(400).json({ error: "Invalid q filter" });
    }
  }

  try {
    const records = applyListQuery(entityName, config, query, req.query);
    return res.json(records);
  } catch (error) {
    return res
      .status(400)
      .json({ error: error.message || "Invalid list query" });
  }
});

app.post("/api/entities/:entity", (req, res) => {
  const entityName = req.params.entity;
  if (!entityConfigs[entityName]) {
    return res.status(404).json({ error: "Unknown entity" });
  }
  if (!ensureEntityWriteAccess(req, res, entityName)) {
    return;
  }
  try {
    const payload = withFanOwnership(
      entityName,
      validateEntityPayload(entityName, req.body, "create"),
      req.fanSession,
    );
    const created = insertRecord(entityName, payload);
    if (
      entityName === "FanProfile" ||
      entityName === "FanPrediction" ||
      entityName === "FanPollVote" ||
      entityName === "FanChatMessage"
    ) {
      console.log(`[fan-write:done] ${entityName}`, created?.id || "no-id");
    }
    return res.status(201).json(created);
  } catch (error) {
    console.error(`[fan-write:error] ${entityName}`, error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid payload", issues: error.issues });
    }
    throw error;
  }
});

app.post("/api/entities/:entity/bulk", (req, res) => {
  const entityName = req.params.entity;
  if (!entityConfigs[entityName]) {
    return res.status(404).json({ error: "Unknown entity" });
  }
  if (!ensureEntityWriteAccess(req, res, entityName)) {
    return;
  }
  const payload = Array.isArray(req.body) ? req.body : [];
  try {
    const validatedPayload = payload.map((item) =>
      validateEntityPayload(entityName, item, "create"),
    );
    const created = validatedPayload.map((item) =>
      insertRecord(entityName, item),
    );
    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid bulk payload", issues: error.issues });
    }
    throw error;
  }
});

app.get("/api/entities/:entity/:id", (req, res) => {
  if (!entityConfigs[req.params.entity]) {
    return res.status(404).json({ error: "Unknown entity" });
  }
  const record = getRecord(req.params.entity, req.params.id);
  if (!record) {
    return res.status(404).json({ error: "Not found" });
  }
  return res.json(record);
});

app.put("/api/entities/:entity/:id", (req, res) => {
  const entityName = req.params.entity;
  if (!entityConfigs[entityName]) {
    return res.status(404).json({ error: "Unknown entity" });
  }
  if (!ensureEntityWriteAccess(req, res, entityName)) {
    return;
  }
  if (
    PUBLIC_WRITE_ENTITIES.has(entityName) &&
    !ensurePublicRecordOwnership(req, res, entityName, req.params.id)
  ) {
    return;
  }
  try {
    const payload = withFanOwnership(
      entityName,
      validateEntityPayload(entityName, req.body, "update"),
      req.fanSession,
    );
    const updated = updateRecord(entityName, req.params.id, payload);
    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid payload", issues: error.issues });
    }
    throw error;
  }
});

app.delete("/api/entities/:entity/:id", (req, res) => {
  if (!entityConfigs[req.params.entity]) {
    return res.status(404).json({ error: "Unknown entity" });
  }
  if (!ensureEntityWriteAccess(req, res, req.params.entity)) {
    return;
  }
  if (PUBLIC_WRITE_ENTITIES.has(req.params.entity)) {
    if (!PUBLIC_DELETE_ENTITIES.has(req.params.entity)) {
      return res.status(405).json({
        error: "Fan activity cannot be deleted from the client",
        code: "fan_delete_not_allowed",
      });
    }
    if (
      !ensurePublicRecordOwnership(req, res, req.params.entity, req.params.id)
    ) {
      return;
    }
  }
  const ok = deleteRecord(req.params.entity, req.params.id);
  return res.json({ ok });
});

app.use(express.static(distDir));

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
  return res.sendFile(indexHtmlPath, (error) => {
    if (error) {
      next(error);
    }
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: "Invalid payload",
      issues: error.issues,
    });
  }
  return res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`StageCore API running at http://localhost:${PORT}`);
});
