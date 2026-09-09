import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../services/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
const migrationDir = path.join(__dirname, "migrations");
const dbPath = path.join(dataDir, "stagecore.sqlite");
fs.mkdirSync(migrationDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

export const runInTransaction = (fn) => {
  const transaction = db.transaction(fn);
  return transaction();
};

const tableDefinitions = [
  `CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    game TEXT NOT NULL,
    tier TEXT,
    status TEXT DEFAULT 'upcoming',
    prize_pool TEXT,
    start_date TEXT,
    end_date TEXT,
    stages TEXT,
    description TEXT,
    banner_url TEXT,
    rules TEXT,
    max_teams INTEGER DEFAULT 16,
    format_overview TEXT,
    calendar TEXT,
    prize_breakdown TEXT,
    awards TEXT,
    participants TEXT,
    rankings TEXT,
    created_date TEXT NOT NULL,
    updated_date TEXT NOT NULL,
    created_by TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tag TEXT NOT NULL,
    logo_url TEXT,
    game TEXT,
    region TEXT,
    total_kills INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    created_date TEXT NOT NULL,
    updated_date TEXT NOT NULL,
    created_by TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    ign TEXT NOT NULL,
    real_name TEXT,
    team_id TEXT,
    role TEXT,
    photo_url TEXT,
    total_kills INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    avg_damage REAL DEFAULT 0,
    created_date TEXT NOT NULL,
    updated_date TEXT NOT NULL,
    created_by TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    stage TEXT NOT NULL,
    group_name TEXT,
    match_number INTEGER,
    map TEXT,
    status TEXT DEFAULT 'scheduled',
    scheduled_time TEXT,
    stream_url TEXT,
    day INTEGER,
    created_date TEXT NOT NULL,
    updated_date TEXT NOT NULL,
    created_by TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS match_results (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL,
    tournament_id TEXT,
    team_id TEXT NOT NULL,
    placement INTEGER,
    kill_points INTEGER DEFAULT 0,
    placement_points INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    matches_count INTEGER DEFAULT 1,
    wins_count INTEGER DEFAULT 0,
    stage TEXT,
    created_date TEXT NOT NULL,
    updated_date TEXT NOT NULL,
    created_by TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS news_articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    ai_summary TEXT,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    tags TEXT,
    thumbnail_url TEXT,
    featured INTEGER DEFAULT 0,
    game TEXT DEFAULT 'General',
    source_name TEXT,
    source_url TEXT,
    source_type TEXT DEFAULT 'manual',
    verification_status TEXT DEFAULT 'verified',
    publication_status TEXT DEFAULT 'published',
    priority TEXT DEFAULT 'routine',
    is_auto_ingested INTEGER DEFAULT 0,
    import_hash TEXT,
    created_date TEXT NOT NULL,
    updated_date TEXT NOT NULL,
    created_by TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS transfer_windows (
    id TEXT PRIMARY KEY,
    window TEXT NOT NULL,
    date TEXT,
    country TEXT,
    players TEXT,
    oldTeam TEXT,
    newTeam TEXT,
    created_date TEXT NOT NULL,
    updated_date TEXT NOT NULL,
    created_by TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    created_date TEXT NOT NULL,
    updated_date TEXT NOT NULL,
    created_by TEXT
  )`,
];

for (const definition of tableDefinitions) {
  db.exec(definition);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    applied_date TEXT NOT NULL
  )
`);

function applySqlMigrations() {
  const files = fs
    .readdirSync(migrationDir)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const alreadyApplied = db
      .prepare("SELECT 1 FROM schema_migrations WHERE id = ?")
      .get(file);
    if (alreadyApplied) continue;

    const sql = fs.readFileSync(path.join(migrationDir, file), "utf8").trim();
    if (!sql) continue;

    runInTransaction(() => {
      db.exec(sql);
      db.prepare(
        "INSERT INTO schema_migrations (id, applied_date) VALUES (?, ?)",
      ).run(file, new Date().toISOString());
    });
  }
}

try {
  applySqlMigrations();
} catch (migrationError) {
  logger.error("Migration warning (non-fatal)", { error: migrationError?.message || migrationError });
}

const ensureColumn = (table, column, definition) => {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table) || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
    logger.warn(`ensureColumn: invalid identifier (${table}.${column})`);
    return;
  }
  try {
    const existing = db.prepare(`PRAGMA table_info("${table}")`).all();
    if (!existing.some((entry) => entry.name === column)) {
      db.exec(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
    }
  } catch (e) {
    logger.warn(`ensureColumn warning (${table}.${column})`, { error: e?.message });
  }
};

ensureColumn("tournaments", "format_overview", "TEXT");
ensureColumn("tournaments", "calendar", "TEXT");
ensureColumn("tournaments", "prize_breakdown", "TEXT");
ensureColumn("tournaments", "awards", "TEXT");
ensureColumn("tournaments", "participants", "TEXT");
ensureColumn("tournaments", "rankings", "TEXT");
ensureColumn("tournaments", "tier", "TEXT");
ensureColumn("matches", "group_name", "TEXT");
ensureColumn("match_results", "matches_count", "INTEGER DEFAULT 1");
ensureColumn("match_results", "wins_count", "INTEGER DEFAULT 0");
ensureColumn("match_results", "publication_status", "TEXT DEFAULT 'published'");
ensureColumn("news_articles", "source_name", "TEXT");
ensureColumn("news_articles", "summary", "TEXT");
ensureColumn("news_articles", "ai_summary", "TEXT");
ensureColumn("news_articles", "tags", "TEXT");
ensureColumn("news_articles", "source_url", "TEXT");
ensureColumn("news_articles", "source_type", "TEXT DEFAULT 'manual'");
ensureColumn("news_articles", "verification_status", "TEXT DEFAULT 'verified'");
ensureColumn("news_articles", "publication_status", "TEXT DEFAULT 'published'");
ensureColumn("news_articles", "priority", "TEXT DEFAULT 'routine'");
ensureColumn("news_articles", "is_auto_ingested", "INTEGER DEFAULT 0");
ensureColumn("news_articles", "import_hash", "TEXT");
try {
  db.exec(`
    UPDATE news_articles
    SET source_type = COALESCE(NULLIF(source_type, ''), 'manual'),
        verification_status = COALESCE(NULLIF(verification_status, ''), 'verified'),
        publication_status = COALESCE(NULLIF(publication_status, ''), 'published'),
        priority = COALESCE(NULLIF(priority, ''), 'routine'),
        is_auto_ingested = COALESCE(is_auto_ingested, 0)
  `);
} catch (e) {
  logger.warn("news_articles update warning (non-fatal)", { error: e?.message });
}

export const entityConfigs = {
  Tournament: {
    table: "tournaments",
    fields: [
      "name", "game", "tier", "status", "prize_pool", "start_date", "end_date",
      "stages", "description", "banner_url", "rules", "max_teams",
      "format_overview", "calendar", "prize_breakdown", "awards", "participants",
      "rankings", "created_by",
    ],
    jsonFields: ["stages", "calendar", "prize_breakdown", "awards", "participants", "rankings"],
  },
  Team: {
    table: "teams",
    fields: [
      "name", "tag", "logo_url", "game", "region", "total_kills",
      "total_points", "matches_played", "wins", "created_by",
    ],
    jsonFields: [],
  },
  Player: {
    table: "players",
    fields: [
      "ign", "real_name", "team_id", "role", "photo_url", "total_kills",
      "matches_played", "avg_damage", "created_by",
    ],
    jsonFields: [],
  },
  Match: {
    table: "matches",
    fields: [
      "tournament_id", "stage", "group_name", "match_number", "map",
      "status", "scheduled_time", "stream_url", "day", "created_by",
    ],
    jsonFields: [],
  },
  MatchResult: {
    table: "match_results",
    fields: [
      "match_id", "tournament_id", "team_id", "placement", "kill_points",
      "placement_points", "total_points", "matches_count", "wins_count",
      "stage", "publication_status", "created_by",
    ],
    jsonFields: [],
  },
  NewsArticle: {
    table: "news_articles",
    fields: [
      "title", "summary", "ai_summary", "content", "category", "tags",
      "thumbnail_url", "featured", "game", "source_name", "source_url",
      "source_type", "verification_status", "publication_status", "priority",
      "is_auto_ingested", "import_hash", "created_date", "created_by",
    ],
    jsonFields: ["tags"],
  },
  TransferWindow: {
    table: "transfer_windows",
    fields: ["window", "date", "country", "players", "oldTeam", "newTeam", "created_by"],
    jsonFields: ["players"],
  },
  TeamAlias: {
    table: "team_aliases",
    fields: ["team_id", "alias", "normalized_alias", "alias_type"],
    jsonFields: [],
  },
  PlayerAlias: {
    table: "player_aliases",
    fields: ["player_id", "alias", "normalized_alias"],
    jsonFields: [],
  },
  PlayerTeamHistory: {
    table: "player_team_history",
    fields: ["player_id", "team_id", "joined_date", "left_date", "role", "source"],
    jsonFields: [],
  },
  TournamentStage: {
    table: "tournament_stages",
    fields: [
      "tournament_id", "name", "slug", "stage_order", "stage_type",
      "status", "summary", "rules", "map_rotation",
    ],
    jsonFields: ["map_rotation"],
  },
  TournamentStageGroup: {
    table: "tournament_stage_groups",
    fields: ["stage_id", "group_name", "group_order"],
    jsonFields: [],
  },
  TournamentParticipant: {
    table: "tournament_participants",
    fields: [
      "tournament_id", "team_id", "seed", "invite_status",
      "start_stage_id", "final_stage_id", "final_rank", "prize_amount",
    ],
    jsonFields: [],
  },
  TournamentParticipantStageEntry: {
    table: "tournament_participant_stage_entries",
    fields: [
      "participant_id", "stage_id", "group_id", "phase_label",
      "placement", "qualified", "eliminated", "notes",
    ],
    jsonFields: [],
  },
  TournamentParticipantPlayer: {
    table: "tournament_participant_players",
    fields: [
      "participant_id", "player_id", "player_name", "country",
      "role", "is_captain", "is_substitute",
    ],
    jsonFields: [],
  },
  StageStanding: {
    table: "stage_standings",
    fields: [
      "tournament_id", "stage_id", "group_id", "team_id", "rank",
      "matches_played", "wins", "place_points", "elim_points",
      "total_points", "progression_status",
    ],
    jsonFields: [],
  },
  StageMatchBreakdown: {
    table: "stage_match_breakdown",
    fields: ["standing_id", "match_id", "placement", "kills", "total_points"],
    jsonFields: [],
  },
};

export function normalizeRecord(config, row) {
  if (!row) return null;
  const normalized = { ...row };
  for (const key of config.jsonFields) {
    if (normalized[key]) {
      try {
        normalized[key] = JSON.parse(normalized[key]);
      } catch {
        normalized[key] = [];
      }
    } else {
      normalized[key] = [];
    }
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "featured")) {
    normalized.featured = Boolean(normalized.featured);
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "is_auto_ingested")) {
    normalized.is_auto_ingested = Boolean(normalized.is_auto_ingested);
  }
  return normalized;
}

export function serializePayload(config, payload) {
  const serialized = {};
  const jsonFieldSet = new Set(config.jsonFields);
  for (const field of config.fields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      const value = payload[field];
      serialized[field] = jsonFieldSet.has(field)
        ? JSON.stringify(value ?? [])
        : value;
    }
  }
  return serialized;
}

export function recomputeTeamStats() {
  runInTransaction(() => {
    db.prepare(
      `
      UPDATE teams
      SET total_kills = 0,
          total_points = 0,
          matches_played = 0,
          wins = 0,
          updated_date = ?
    `,
    ).run(new Date().toISOString());

    db.prepare(
      `
      UPDATE teams
      SET total_kills = COALESCE((
            SELECT SUM(mr.kill_points) FROM match_results mr
            WHERE mr.team_id = teams.id
              AND COALESCE(NULLIF(mr.publication_status, ''), 'published') = 'published'
          ), 0),
          total_points = COALESCE((
            SELECT SUM(mr.total_points) FROM match_results mr
            WHERE mr.team_id = teams.id
              AND COALESCE(NULLIF(mr.publication_status, ''), 'published') = 'published'
          ), 0),
          matches_played = COALESCE((
            SELECT SUM(COALESCE(mr.matches_count, 1)) FROM match_results mr
            WHERE mr.team_id = teams.id
              AND COALESCE(NULLIF(mr.publication_status, ''), 'published') = 'published'
          ), 0),
          wins = COALESCE((
            SELECT SUM(
              CASE
                WHEN mr.wins_count IS NOT NULL AND mr.wins_count > 0 THEN mr.wins_count
                WHEN mr.placement = 1 THEN 1
                ELSE 0
              END
            ) FROM match_results mr
            WHERE mr.team_id = teams.id
              AND COALESCE(NULLIF(mr.publication_status, ''), 'published') = 'published'
          ), 0),
          updated_date = ?
    `,
    ).run(new Date().toISOString());
  });
}
