import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { db, entityConfigs, normalizeRecord, recomputeTeamStats, serializePayload } from "./db.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "..", "dist");
const indexHtmlPath = path.join(distDir, "index.html");
const LOCAL_ADMIN_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const LOCAL_ADMIN_IPS = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const PUBLIC_WRITE_ENTITIES = new Set(["FanProfile", "FanPrediction", "FanPollVote", "FanChatMessage"]);
const ADMIN_WRITE_ENTITIES = new Set(Object.keys(entityConfigs).filter((entityName) => !PUBLIC_WRITE_ENTITIES.has(entityName)));
const CONFIGURED_CORS_ORIGINS = [
  ...String(process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  ...String(process.env.CORS_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
];
const ALLOWED_CORS_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://localhost:5173",
  "https://127.0.0.1:5173",
  ...CONFIGURED_CORS_ORIGINS,
]);

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
  })
);
app.use(express.json({ limit: "2mb" }));

const ORDERABLE_COLUMNS = {
  Tournament: new Set(["created_date", "updated_date", "name", "start_date", "end_date", "status", "tier"]),
  Team: new Set(["created_date", "updated_date", "name", "tag", "total_points", "wins", "matches_played"]),
  Player: new Set(["created_date", "updated_date", "ign", "team_id", "total_kills", "matches_played", "avg_damage"]),
  Match: new Set(["created_date", "updated_date", "scheduled_time", "stage", "group_name", "day", "match_number", "status"]),
  MatchResult: new Set(["created_date", "updated_date", "placement", "total_points", "kill_points", "placement_points", "stage"]),
  NewsArticle: new Set(["created_date", "updated_date", "title", "category", "featured", "game"]),
  TransferWindow: new Set(["created_date", "updated_date", "window", "date", "country"]),
  FanProfile: new Set(["created_date", "updated_date", "display_name", "favorite_team", "total_points", "accuracy_percent", "badge"]),
  FanPrediction: new Set(["created_date", "updated_date", "prediction_date", "status", "awarded_points", "tournament_name"]),
  FanPollVote: new Set(["created_date", "updated_date", "poll_key", "option", "display_name"]),
  FanChatMessage: new Set(["created_date", "updated_date", "topic", "display_name", "tournament_name"]),
  TeamAlias: new Set(["created_date", "updated_date", "alias", "normalized_alias", "alias_type"]),
  PlayerAlias: new Set(["created_date", "updated_date", "alias", "normalized_alias"]),
  PlayerTeamHistory: new Set(["created_date", "updated_date", "joined_date", "left_date", "role", "source"]),
  TournamentStage: new Set(["created_date", "updated_date", "name", "slug", "stage_order", "stage_type", "status"]),
  TournamentStageGroup: new Set(["created_date", "updated_date", "group_name", "group_order"]),
  TournamentParticipant: new Set(["created_date", "updated_date", "seed", "invite_status", "final_rank", "prize_amount"]),
  TournamentParticipantStageEntry: new Set(["created_date", "updated_date", "phase_label", "placement", "qualified", "eliminated"]),
  TournamentParticipantPlayer: new Set(["created_date", "updated_date", "player_name", "country", "role", "is_captain", "is_substitute"]),
  StageStanding: new Set(["created_date", "updated_date", "rank", "matches_played", "wins", "place_points", "elim_points", "total_points", "progression_status"]),
  StageMatchBreakdown: new Set(["created_date", "updated_date", "placement", "kills", "total_points"]),
};

const stringField = (min = 1) => z.string().trim().min(min);
const numberField = () => z.number().finite();
const intField = () => z.number().int();

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
    content: stringField(),
    category: z.string().optional(),
    thumbnail_url: z.string().optional(),
    featured: z.number().int().min(0).max(1).optional(),
    game: z.string().optional(),
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
    total_points: intField().optional(),
    accuracy_percent: numberField().optional(),
    badge: z.string().optional(),
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
  Object.entries(createSchemas).map(([entity, schema]) => [entity, schema.partial()])
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
    params.push(config.jsonFields.includes(key) ? JSON.stringify(value) : value);
  }

  const safeLimit = Number.isFinite(Number(options.limit)) ? Math.min(Number(options.limit), 500) : null;
  const safeSkip = Number.isFinite(Number(options.skip)) ? Math.max(Number(options.skip), 0) : 0;

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

  return db.prepare(sql).all(...params).map((row) => normalizeRecord(config, row));
}

function validateEntityPayload(entityName, payload, mode = "create") {
  const schema = mode === "update" ? updateSchemas[entityName] : createSchemas[entityName];
  if (!schema) return payload || {};
  return schema.parse(payload || {});
}

function normalizeTournamentPayload(row) {
  return normalizeRecord(entityConfigs.Tournament, row);
}

function getRequestHostname(req) {
  const forwardedHost = req.headers["x-forwarded-host"];
  const hostHeader = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host || "";
  return String(hostHeader).split(":")[0].toLowerCase();
}

function getRequestIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (firstForwarded) {
    return String(firstForwarded).split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "";
}

function isLocalAdminRequest(req) {
  const hostname = getRequestHostname(req);
  const ip = getRequestIp(req);
  return LOCAL_ADMIN_HOSTS.has(hostname) || LOCAL_ADMIN_IPS.has(ip);
}

function resolveRequestAuth(req) {
  const configuredAdminKey = String(process.env.CORE_ADMIN_KEY || "").trim();
  const providedAdminKey = String(req.headers["x-core-admin-key"] || "").trim();
  const authenticatedByKey = Boolean(configuredAdminKey && providedAdminKey && configuredAdminKey === providedAdminKey);
  const authenticatedLocally = isLocalAdminRequest(req);

  if (authenticatedLocally || authenticatedByKey) {
    return {
      isAuthenticated: true,
      user: {
        id: authenticatedLocally ? "local-admin" : "token-admin",
        email: authenticatedLocally ? "admin@core.local" : "admin@core.remote",
        full_name: authenticatedLocally ? "Local Admin" : "Remote Admin",
        role: "admin",
        auth_method: authenticatedLocally ? "local_machine" : "admin_key",
      },
    };
  }

  return {
    isAuthenticated: false,
    user: null,
  };
}

function ensureEntityWriteAccess(req, res, entityName) {
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
    .filter(Boolean);
  const letters = parts
    .filter((part) => !/^\d+$/.test(part))
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .join("");
  const year = parts.find((part) => /^\d{4}$/.test(part));
  return year ? `${letters} ${year}` : letters;
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
  if (normalized.startsWith(query) || compact.startsWith(compactQuery)) return 120;
  if (normalized.includes(query) || compact.includes(compactQuery)) return 75;
  return -1;
}

function isShortCodeQuery(query) {
  const compact = normalizeSearchValue(query);
  return compact.length >= 2 && compact.length <= 8;
}

function getGlobalSearchResults(rawQuery, rawLimit = 10) {
  const query = String(rawQuery || "").toLowerCase().trim();
  if (query.length < 2) return [];

  const limit = Number.isFinite(Number(rawLimit)) ? Math.min(Math.max(Number(rawLimit), 1), 20) : 10;
  const compactQuery = normalizeSearchValue(query);
  const shortCodeQuery = isShortCodeQuery(query);
  const tournaments = db.prepare("SELECT * FROM tournaments").all().map(normalizeTournamentPayload);
  const teams = db.prepare("SELECT * FROM teams").all().map((row) => normalizeRecord(entityConfigs.Team, row));
  const teamAliases = db.prepare("SELECT * FROM team_aliases").all().map((row) => normalizeRecord(entityConfigs.TeamAlias, row));
  const players = db.prepare("SELECT * FROM players").all().map((row) => normalizeRecord(entityConfigs.Player, row));
  const playerAliases = db.prepare("SELECT * FROM player_aliases").all().map((row) => normalizeRecord(entityConfigs.PlayerAlias, row));
  const matches = db.prepare("SELECT * FROM matches").all().map((row) => normalizeRecord(entityConfigs.Match, row));
  const news = db.prepare("SELECT * FROM news_articles").all().map((row) => normalizeRecord(entityConfigs.NewsArticle, row));

  const teamById = new Map(teams.map((team) => [team.id, team]));
  const tournamentById = new Map(tournaments.map((tournament) => [tournament.id, tournament]));

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
    playerAliasMap.set(player.id, new Set([player.ign, player.real_name].filter(Boolean)));
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
    let score = Math.max(...aliases.map((alias) => scoreTextMatch(alias, query)));
    const exactAliasHit = aliases.some((alias) => normalizeSearchValue(alias) === compactQuery);
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
      ...aliases.map((alias) => scoreTextMatch(alias, query))
    );
    const compactTag = normalizeSearchValue(organization.sub);
    const exactAliasHit = aliases.some((alias) => normalizeSearchValue(alias) === compactQuery);
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
      ...aliases.map((alias) => scoreTextMatch(alias, query))
    );
    const exactAliasHit = aliases.some((alias) => normalizeSearchValue(alias) === compactQuery);
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
      scoreTextMatch(`match ${match.match_number || ""}`, query)
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
      scoreTextMatch(article.game, query)
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
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
    .filter((result, index, list) => {
      const duplicateIndex = list.findIndex(
        (item) =>
          item.type === result.type &&
          item.path === result.path &&
          normalizeSearchValue(item.label) === normalizeSearchValue(result.label)
      );
      return duplicateIndex === index;
    })
    .slice(0, limit)
    .map(({ score, ...result }) => result);
}

function deriveStandingsFromMatchResults(tournamentId, stages, stageGroups) {
  if (!stages.length) return [];

  const rows = db
    .prepare(`
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
    `)
    .all(tournamentId);

  if (!rows.length) return [];

  const stageIdByName = new Map(stages.map((stage) => [stage.name, stage.id]));
  const groupIdByStageAndName = new Map(
    stageGroups.map((group) => [`${group.stage_id}::${group.group_name}`, group.id])
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
          : `Group ${String(row.group_name).replace(/^group\s+/i, "").toUpperCase()}`
        : null;
    const groupId = normalizedGroupName ? groupIdByStageAndName.get(`${stageId}::${normalizedGroupName}`) || null : null;
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
          (entry.matches_played || 0) > 0 ? entry.placement_sum / entry.matches_played : null,
      }))
      .sort((a, b) => {
        if ((b.total_points || 0) !== (a.total_points || 0)) return (b.total_points || 0) - (a.total_points || 0);
        if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
        if ((b.place_points || 0) !== (a.place_points || 0)) return (b.place_points || 0) - (a.place_points || 0);
        const aAverage = Number.isFinite(a.average_elimination_position) ? a.average_elimination_position : Number.POSITIVE_INFINITY;
        const bAverage = Number.isFinite(b.average_elimination_position) ? b.average_elimination_position : Number.POSITIVE_INFINITY;
        if (aAverage !== bAverage) return aAverage - bAverage;
        if ((b.elim_points || 0) !== (a.elim_points || 0)) return (b.elim_points || 0) - (a.elim_points || 0);
        return String(a.team?.name || "").localeCompare(String(b.team?.name || ""));
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
  const tournamentRow = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(id);
  if (!tournamentRow) return null;

  const tournament = normalizeTournamentPayload(tournamentRow);
  const stages = db
    .prepare("SELECT * FROM tournament_stages WHERE tournament_id = ? ORDER BY stage_order ASC, name ASC")
    .all(id)
    .map((row) => normalizeRecord(entityConfigs.TournamentStage, row));

  const stageIds = stages.map((stage) => stage.id);
  const stageGroups = stageIds.length
    ? db
        .prepare(`SELECT * FROM tournament_stage_groups WHERE stage_id IN (${stageIds.map(() => "?").join(", ")}) ORDER BY group_order ASC, group_name ASC`)
        .all(...stageIds)
        .map((row) => normalizeRecord(entityConfigs.TournamentStageGroup, row))
    : [];

  const participants = db
    .prepare(`
      SELECT tp.*, tm.name AS team_name, tm.tag AS team_tag, tm.logo_url AS team_logo_url
      FROM tournament_participants tp
      JOIN teams tm ON tm.id = tp.team_id
      WHERE tp.tournament_id = ?
      ORDER BY COALESCE(tp.final_rank, 9999), tm.name ASC
    `)
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
        .prepare(`
          SELECT tse.*, ts.name AS stage_name, tsg.group_name
          FROM tournament_participant_stage_entries tse
          JOIN tournament_stages ts ON ts.id = tse.stage_id
          LEFT JOIN tournament_stage_groups tsg ON tsg.id = tse.group_id
          WHERE tse.participant_id IN (${participantIds.map(() => "?").join(", ")})
          ORDER BY ts.stage_order ASC, COALESCE(tsg.group_order, 999), tse.placement ASC
        `)
        .all(...participantIds)
        .map((row) => normalizeRecord(entityConfigs.TournamentParticipantStageEntry, row))
    : [];

  const participantPlayers = participantIds.length
    ? db
        .prepare(`
          SELECT tpp.*, p.ign AS player_ign, p.role AS player_role, p.photo_url AS player_photo_url
          FROM tournament_participant_players tpp
          LEFT JOIN players p ON p.id = tpp.player_id
          WHERE tpp.participant_id IN (${participantIds.map(() => "?").join(", ")})
          ORDER BY tpp.player_name ASC
        `)
        .all(...participantIds)
        .map((row) => normalizeRecord(entityConfigs.TournamentParticipantPlayer, row))
    : [];

  const standings = stageIds.length
    ? db
        .prepare(`
          SELECT ss.*, ts.name AS stage_name, tsg.group_name, tm.name AS team_name, tm.tag AS team_tag, tm.logo_url AS team_logo_url
          FROM stage_standings ss
          JOIN tournament_stages ts ON ts.id = ss.stage_id
          LEFT JOIN tournament_stage_groups tsg ON tsg.id = ss.group_id
          JOIN teams tm ON tm.id = ss.team_id
          WHERE ss.tournament_id = ?
          ORDER BY ts.stage_order ASC, COALESCE(tsg.group_order, 999), COALESCE(ss.rank, 9999), tm.name ASC
        `)
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

  const derivedStandings = deriveStandingsFromMatchResults(id, stages, stageGroups);
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
    if (persistedList.length === 0 || derivedList.length > persistedList.length) {
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
          ])
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
    const matchIds = db.prepare("SELECT id FROM matches WHERE tournament_id = ?").all(id).map((row) => row.id);
    if (matchIds.length > 0) {
      const placeholders = matchIds.map(() => "?").join(", ");
      db.prepare(`DELETE FROM match_results WHERE match_id IN (${placeholders})`).run(...matchIds);
    }
    db.prepare("DELETE FROM matches WHERE tournament_id = ?").run(id);
    db.prepare("DELETE FROM match_results WHERE tournament_id = ?").run(id);
  }
  if (entityName === "Match") {
    db.prepare("DELETE FROM match_results WHERE match_id = ?").run(id);
  }

  const result = db.prepare(`DELETE FROM ${config.table} WHERE id = ?`).run(id);
  if (entityName === "MatchResult" || entityName === "Team" || entityName === "Tournament" || entityName === "Match") {
    recomputeTeamStats();
  }
  return result.changes > 0;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  const auth = resolveRequestAuth(req);
  if (!auth.isAuthenticated) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json(auth.user);
});

app.get("/api/search", (req, res) => {
  return res.json(getGlobalSearchResults(req.query.q, req.query.limit));
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
    return res.status(400).json({ error: error.message || "Invalid list query" });
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
    const payload = validateEntityPayload(entityName, req.body, "create");
    const created = insertRecord(entityName, payload);
    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid payload", issues: error.issues });
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
    const validatedPayload = payload.map((item) => validateEntityPayload(entityName, item, "create"));
    const created = validatedPayload.map((item) => insertRecord(entityName, item));
    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid bulk payload", issues: error.issues });
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
  try {
    const payload = validateEntityPayload(entityName, req.body, "update");
    const updated = updateRecord(entityName, req.params.id, payload);
    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid payload", issues: error.issues });
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
  return res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`StageCore API running at http://localhost:${PORT}`);
});
