import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const migrationDir = path.join(__dirname, "db", "migrations");
const dbPath = path.join(dataDir, "stagecore.sqlite");

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(migrationDir, { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

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
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    thumbnail_url TEXT,
    featured INTEGER DEFAULT 0,
    game TEXT DEFAULT 'General',
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
  `CREATE TABLE IF NOT EXISTS fan_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    favorite_team TEXT,
    total_points INTEGER DEFAULT 0,
    accuracy_percent REAL DEFAULT 0,
    badge TEXT DEFAULT 'Bronze',
    predictions_count INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    created_date TEXT NOT NULL,
    updated_date TEXT NOT NULL,
    created_by TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS fan_predictions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    tournament_id TEXT,
    tournament_name TEXT,
    prediction_date TEXT,
    lock_time TEXT,
    winner_team TEXT,
    top_fragger TEXT,
    top_three TEXT,
    status TEXT DEFAULT 'pending',
    awarded_points INTEGER DEFAULT 0,
    created_date TEXT NOT NULL,
    updated_date TEXT NOT NULL,
    created_by TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS fan_poll_votes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    poll_key TEXT NOT NULL,
    option TEXT NOT NULL,
    created_date TEXT NOT NULL,
    updated_date TEXT NOT NULL,
    created_by TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS fan_chat_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    tournament_id TEXT,
    tournament_name TEXT,
    topic TEXT,
    body TEXT NOT NULL,
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
    const alreadyApplied = db.prepare("SELECT 1 FROM schema_migrations WHERE id = ?").get(file);
    if (alreadyApplied) continue;

    const sql = fs.readFileSync(path.join(migrationDir, file), "utf8").trim();
    if (!sql) continue;

    const transaction = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (id, applied_date) VALUES (?, ?)").run(file, new Date().toISOString());
    });

    transaction();
  }
}

applySqlMigrations();

const ensureColumn = (table, column, definition) => {
  const existing = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!existing.some((entry) => entry.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
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
ensureColumn("fan_profiles", "favorite_team", "TEXT");
ensureColumn("fan_profiles", "badge", "TEXT DEFAULT 'Bronze'");
ensureColumn("fan_profiles", "predictions_count", "INTEGER DEFAULT 0");
ensureColumn("fan_profiles", "correct_predictions", "INTEGER DEFAULT 0");
ensureColumn("fan_predictions", "top_three", "TEXT");
ensureColumn("fan_predictions", "status", "TEXT DEFAULT 'pending'");
ensureColumn("fan_predictions", "awarded_points", "INTEGER DEFAULT 0");

const parseJsonField = (value, fallback = []) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeLookupValue = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const TEAM_ALIAS_KEY_MAP = {
  godlike: "godlikeesports",
  godlikeesports: "godlikeesports",
  heroxtremegodlike: "godlikeesports",
  heroxtremegodlikeesports: "godlikeesports",
  godsreign: "godsreign",
  gladiatorsesports: "gladiatorsesports",
  gdr: "gladiatorsesports",
  gods: "godsreign",
  "8bitxcsesports": "8bit",
  "8bit": "8bit",
  aryanxtmggaming: "teamaryan",
  teamax: "teamaryan",
  teamaryan: "teamaryan",
  nsredforce: "nongshimredforce",
  nongshimredforce: "nongshimredforce",
  nongshimredforceesports: "nongshimredforce",
  thwxnonxesports: "nonxesports",
  nonxesports: "nonxesports",
  teamxspark: "revenantxspark",
  tx: "revenantxspark",
  revenantesports: "revenantxspark",
  revenantxspark: "revenantxspark",
  rnt: "revenantxspark",
  orangutan: "orangutan",
  soul: "teamsoul",
  teamsoul: "teamsoul",
  iqoosoul: "teamsoul",
  teamsoul: "teamsoul",
  iqooreckoningesports: "reckoningesports",
  reckoningesports: "reckoningesports",
  iqoorevenantxspark: "revenantxspark",
  iqoo8bit: "8bit",
  iqooorangutan: "orangutan",
  truerippersxinfinix: "truerippers",
  infinixtruerippers: "truerippers",
  truerippers: "truerippers",
  dpluskia: "dplus",
  dplus: "dplus",
  mysterious4esports: "mysterious4",
  mysterious4: "mysterious4",
  madkings: "madkingsesports",
  madkingsesports: "madkingsesports",
  blind: "blindesports",
  blindesports: "blindesports",
  bb: "bigbrotheresports",
  bigbrotheresports: "bigbrotheresports",
  mdl: "medalesports",
  medalesports: "medalesports",
  me: "midwaveesports",
  midwaveesports: "midwaveesports",
  or: "oresports",
  oresports: "oresports",
  gxr: "glitchxreborn",
  glitchxreborn: "glitchxreborn",
  mici: "miciesports",
  miciesports: "miciesports",
  gs: "growingstrong",
  growingstrong: "growingstrong",
  "4am": "4aggressiveman",
  "4aggressiveman": "4aggressiveman",
  no: "nightowls",
  nightowls: "nightowls",
  ge: "globalesports",
  globalesports: "globalesports",
  rge: "reckoningesports",
  fs: "fsesports",
  fsesports: "fsesports",
  tt: "teamtamilas",
  teamaaru: "teamaaru",
  aaru: "teamaaru",
  vst: "vasistaesports",
  vasistaesports: "vasistaesports",
  mogo: "mogoesports",
  mogoesports: "mogoesports",
  cg: "carnivalgaming",
  carnivalgaming: "carnivalgaming",
  inferno: "infernosquad",
  entity: "entitygaming",
  entitygaming: "entitygaming",
  numen: "numenesports",
  numenesports: "numenesports",
  hydra: "hydra",
  tte: "teamtogetheresports",
  teamtogetheresports: "teamtogetheresports",
  auto: "autobotzesports",
  autobotzesports: "autobotzesports",
  psyche: "teampsyche",
  teampsyche: "teampsyche",
  troytamilanesports: "troytamilianesports",
  troytamilans: "troytamilianesports",
  troytamilansesports: "troytamilianesports",
  troytamilianesports: "troytamilianesports",
  k9esports: "k9esports",
  cincinnatikids: "cincinnatikids",
  infernosquad: "risingesports",
  hailinfernosquad: "risingesports",
  risingesports: "risingesports",
  rse: "risingesports",
  rie: "risingesports",
  versatileesports: "teamversatile",
  teamversatile: "teamversatile",
  "4everxredxross": "teamredxross",
  redxross: "teamredxross",
  teamredxross: "teamredxross",
  teaminsaneesports: "teaminsane",
  teaminsane: "teaminsane",
  loshermanos: "loshermanosesports",
  loshermanosesports: "loshermanosesports",
  learnfrompast: "learnfrompast",
  hadesh4k: "teamh4k",
  teamtamilas: "teamtamilas",
  teamtamillas: "teamtamilas",
  godscentesports: "godsentesports",
  godsentesports: "godsentesports",
  godsentlegions: "godsentlegions",
  apexgaming: "teamapexgaming",
  teamapexgaming: "teamapexgaming",
  teamvanguard: "teamvanguard",
  t7xorionesports: "t7xorionesports",
  genxfmesports: "genxfmesports",
  genxfm: "genxfmesports",
  likithaesports: "likithaesports",
  rapidchaosesports: "rapidchaosesports",
  higgboson: "higgbosonesports",
  higgbosonesports: "higgbosonesports",
  esportsocial: "esportsocial",
  esportssocial: "esportsocial",
  quantumsparks: "quantumsparks",
  jaapiesports: "jaapiesports",
  teamdoxy: "teamdoxy",
  someonesdream: "someonesdream",
  zeroarkofficial: "zeroarkofficial",
  santaesp: "santaesports",
  santaesports: "santaesports",
  thundergodsxtortugagaming: "thundergodsxtortugagaming",
  thundergodstortugagaming: "thundergodsxtortugagaming",
  thundergodsesports: "thundergodsxtortugagaming",
  divinegaming: "divinegaming",
  blinkesports: "blinkesports",
  jaguaresports: "jaguaresports",
  windgodesports: "windgodesports",
  naqshesports: "naqshesports",
  m4xnaqshesports: "naqshesports",
  riotnationz: "riotnationz",
  riotnations: "riotnationz",
  hadxesports: "hadxesports",
  hadx: "hadxesports",
  lastadeesports: "lastadeesports",
  sevengodsesports: "7godsesports",
  "7godsesports": "7godsesports",
  auraxesports: "auraxesports",
  auraxesport: "auraxesports",
  aresesport: "aresesport",
  aresesports: "aresesport",
  oopsofficial: "oopsofficial",
};
const TEAM_ALIAS_VARIANTS = Object.entries(TEAM_ALIAS_KEY_MAP).reduce((acc, [alias, canonical]) => {
  const list = acc.get(canonical) || new Set();
  list.add(alias);
  acc.set(canonical, list);
  return acc;
}, new Map());
const canonicalizeTeamLookupValue = (value) => {
  const compact = normalizeLookupValue(value);
  if (!compact) return "";
  const withoutSponsors = compact.replace(/^(iqoo|oneplus|heroxtreme|infinix)+/g, "");
  return TEAM_ALIAS_KEY_MAP[withoutSponsors] || withoutSponsors;
};
const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "stage";

const getPhaseStageName = (phase) => String(phase || "").split(/\s+-\s+Group\s+/i)[0]?.trim() || null;
const getPhaseGroupName = (phase) => {
  const match = String(phase || "").match(/group\s+([a-z0-9]+)/i);
  return match ? `Group ${String(match[1]).toUpperCase()}` : null;
};

const inferStageType = (stageName) => {
  const normalized = String(stageName || "").toLowerCase();
  if (normalized.includes("grand finals")) return "grand_finals";
  if (normalized.includes("semi")) return "semi_finals";
  if (normalized.includes("quarter")) return "quarter_finals";
  if (normalized.includes("wildcard")) return "wildcards";
  if (normalized.includes("last chance")) return "last_chance";
  if (normalized.includes("survival")) return "survival";
  if (normalized.includes("round")) return "round";
  if (normalized.includes("league")) return "league";
  return "stage";
};

const buildTeamLookup = () => {
  const teams = db.prepare("SELECT id, name, tag FROM teams").all();
  const map = new Map();

  const register = (key, team) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, team);
  };

  for (const team of teams) {
    register(normalizeLookupValue(team.name), team);
    register(normalizeLookupValue(team.tag), team);
    register(canonicalizeTeamLookupValue(team.name), team);
    register(canonicalizeTeamLookupValue(team.tag), team);
  }

  return map;
};

const buildPlayerLookup = () => {
  const players = db.prepare("SELECT id, ign, team_id, role FROM players").all();
  const exactMap = new Map();
  const anyTeamMap = new Map();

  for (const player of players) {
    const ignKey = normalizeLookupValue(player.ign);
    if (!ignKey) continue;
    if (player.team_id) exactMap.set(`${ignKey}:${player.team_id}`, player);
    if (!anyTeamMap.has(ignKey)) anyTeamMap.set(ignKey, player);
  }

  return { exactMap, anyTeamMap, rows: players };
};

const resolveTeamRecord = (teamLookup, rawName) => {
  const normalized = normalizeLookupValue(rawName);
  return teamLookup.get(normalized) || teamLookup.get(canonicalizeTeamLookupValue(rawName)) || null;
};

const resolvePlayerRecord = (playerLookup, rawName, teamId) => {
  const normalized = normalizeLookupValue(rawName);
  if (!normalized) return null;
  if (teamId) {
    const exact = playerLookup.exactMap.get(`${normalized}:${teamId}`);
    if (exact) return exact;
  }
  return playerLookup.anyTeamMap.get(normalized) || null;
};

function backfillNormalizedData() {
  const tournaments = db.prepare("SELECT id, name, tier, start_date, end_date, stages, participants, rankings, created_date, updated_date FROM tournaments").all();
  const teamLookup = buildTeamLookup();
  const playerLookup = buildPlayerLookup();
  const now = new Date().toISOString();

  const clearTables = [
    "stage_match_breakdown",
    "stage_standings",
    "tournament_participant_players",
    "tournament_participant_stage_entries",
    "tournament_participants",
    "tournament_stage_groups",
    "tournament_stages",
    "player_team_history",
    "player_aliases",
    "team_aliases",
  ];

  const insertTeamAlias = db.prepare(`
    INSERT INTO team_aliases (id, team_id, alias, normalized_alias, alias_type, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPlayerAlias = db.prepare(`
    INSERT INTO player_aliases (id, player_id, alias, normalized_alias, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertPlayerTeamHistory = db.prepare(`
    INSERT INTO player_team_history (id, player_id, team_id, joined_date, left_date, role, source, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertStage = db.prepare(`
    INSERT INTO tournament_stages (id, tournament_id, name, slug, stage_order, stage_type, status, summary, rules, map_rotation, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertGroup = db.prepare(`
    INSERT INTO tournament_stage_groups (id, stage_id, group_name, group_order, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertParticipant = db.prepare(`
    INSERT INTO tournament_participants (id, tournament_id, team_id, seed, invite_status, start_stage_id, final_stage_id, final_rank, prize_amount, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertParticipantStageEntry = db.prepare(`
    INSERT INTO tournament_participant_stage_entries (id, participant_id, stage_id, group_id, phase_label, placement, qualified, eliminated, notes, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertParticipantPlayer = db.prepare(`
    INSERT INTO tournament_participant_players (id, participant_id, player_id, player_name, country, role, is_captain, is_substitute, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertStageStanding = db.prepare(`
    INSERT INTO stage_standings (id, tournament_id, stage_id, group_id, team_id, rank, matches_played, wins, place_points, elim_points, total_points, progression_status, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    const seenTeamAliases = new Set();
    const seenPlayerAliases = new Set();
    const seenPlayerTeamHistory = new Set();

    for (const table of clearTables) {
      db.prepare(`DELETE FROM ${table}`).run();
    }

    const teams = db.prepare("SELECT id, name, tag, created_date, updated_date FROM teams").all();
    for (const team of teams) {
      const canonicalKey = canonicalizeTeamLookupValue(team.name || team.tag);
      const entries = new Map([
        [normalizeLookupValue(team.name), { alias: team.name, type: "canonical_name" }],
        [normalizeLookupValue(team.tag), { alias: team.tag, type: "canonical_tag" }],
      ]);
      const variantAliases = TEAM_ALIAS_VARIANTS.get(canonicalKey) || new Set();
      for (const variant of variantAliases) {
        if (!variant) continue;
        entries.set(normalizeLookupValue(variant), { alias: variant, type: "canonical_variant" });
      }
      for (const [normalizedAlias, value] of entries.entries()) {
        if (!normalizedAlias || !value.alias) continue;
        const aliasKey = `${team.id}:${normalizedAlias}`;
        if (seenTeamAliases.has(aliasKey)) continue;
        seenTeamAliases.add(aliasKey);
        insertTeamAlias.run(randomUUID(), team.id, value.alias, normalizedAlias, value.type, team.created_date || now, team.updated_date || now);
      }
    }

    for (const player of playerLookup.rows) {
      const normalizedIgn = normalizeLookupValue(player.ign);
      if (normalizedIgn) {
        const aliasKey = `${player.id}:${normalizedIgn}`;
        if (!seenPlayerAliases.has(aliasKey)) {
          seenPlayerAliases.add(aliasKey);
          insertPlayerAlias.run(randomUUID(), player.id, player.ign, normalizedIgn, now, now);
        }
      }
      if (player.team_id) {
        const historyKey = `${player.id}:${player.team_id}:current_player_record`;
        if (!seenPlayerTeamHistory.has(historyKey)) {
          seenPlayerTeamHistory.add(historyKey);
          insertPlayerTeamHistory.run(randomUUID(), player.id, player.team_id, null, null, player.role || null, "current_player_record", now, now);
        }
      }
    }

    for (const tournament of tournaments) {
      const stages = parseJsonField(tournament.stages);
      const participants = parseJsonField(tournament.participants);
      const rankings = parseJsonField(tournament.rankings);

      const stageRows = [];
      const stageMetaByName = new Map();
      const knownStageNames = new Set();

      stages.forEach((stage, index) => {
        const stageName = stage?.name || `Stage ${index + 1}`;
        knownStageNames.add(stageName);
        stageRows.push({
          name: stageName,
          order: Number(stage?.order || index + 1),
          status: stage?.status || null,
          summary: stage?.summary || null,
          rules: stage?.rules || null,
          mapRotation: Array.isArray(stage?.mapRotation) ? stage.mapRotation : [],
          standings: Array.isArray(stage?.standings) ? stage.standings : [],
        });
      });

      participants.forEach((participant) => {
        const phaseStageName = getPhaseStageName(participant?.phase);
        if (phaseStageName && !knownStageNames.has(phaseStageName)) {
          knownStageNames.add(phaseStageName);
          stageRows.push({
            name: phaseStageName,
            order: stageRows.length + 1,
            status: null,
            summary: null,
            rules: null,
            mapRotation: [],
            standings: [],
          });
        }
      });

      stageRows.sort((a, b) => a.order - b.order);

      for (const stage of stageRows) {
        const stageId = randomUUID();
        stageMetaByName.set(stage.name, { id: stageId, name: stage.name });
        insertStage.run(
          stageId,
          tournament.id,
          stage.name,
          slugify(stage.name),
          stage.order,
          inferStageType(stage.name),
          stage.status,
          stage.summary,
          stage.rules,
          JSON.stringify(stage.mapRotation || []),
          tournament.created_date || now,
          tournament.updated_date || now
        );

        const groupNames = new Set();
        participants.forEach((participant) => {
          if (getPhaseStageName(participant?.phase) === stage.name) {
            const phaseGroup = getPhaseGroupName(participant?.phase);
            if (phaseGroup) groupNames.add(phaseGroup);
          }
        });
        (stage.mapRotation || []).forEach((rotationRow) => {
          ["day1", "day2", "day3", "day4"].forEach((dayKey) => {
            const value = rotationRow?.[dayKey];
            if (value) groupNames.add(`Group ${String(value).toUpperCase()}`);
          });
        });
        (stage.standings || []).forEach((entry) => {
          if (entry?.grp) groupNames.add(`Group ${String(entry.grp).toUpperCase()}`);
          if (entry?.group) groupNames.add(String(entry.group).startsWith("Group ") ? entry.group : `Group ${String(entry.group).toUpperCase()}`);
        });

        [...groupNames]
          .sort((a, b) => a.localeCompare(b))
          .forEach((groupName, groupIndex) => {
            const groupId = randomUUID();
            insertGroup.run(groupId, stageId, groupName, groupIndex + 1, tournament.created_date || now, tournament.updated_date || now);
          });
      }

      const stageGroups = db.prepare(`
        SELECT g.id, g.group_name, g.stage_id, s.name AS stage_name
        FROM tournament_stage_groups g
        JOIN tournament_stages s ON s.id = g.stage_id
        WHERE s.tournament_id = ?
      `).all(tournament.id);
      const groupIdByStageAndName = new Map(
        stageGroups.map((group) => [`${group.stage_name}::${group.group_name}`, group.id])
      );

      const rankingMap = new Map();
      rankings.forEach((entry, index) => {
        const key = normalizeLookupValue(entry?.team || entry?.name);
        if (!key) return;
        rankingMap.set(key, {
          rank: Number(entry?.placement || entry?.rank || index + 1),
          prize: entry?.prize || entry?.prize_amount || null,
          stageName: entry?.stage || entry?.phase || null,
        });
      });

      const participantIdByTeamKey = new Map();
      const participantStageSeen = new Set();
      const participantPlayerSeen = new Set();

      participants.forEach((participant, participantIndex) => {
        const teamRecord = resolveTeamRecord(teamLookup, participant?.team);
        if (!teamRecord) return;

        const participantKey = normalizeLookupValue(participant.team);
        const canonicalParticipantKey = `team:${teamRecord.id}`;
        let participantId = participantIdByTeamKey.get(canonicalParticipantKey);
        if (!participantId) {
          const phaseStageName = getPhaseStageName(participant?.phase);
          const ranking = rankingMap.get(participantKey);
          participantId = randomUUID();
          participantIdByTeamKey.set(canonicalParticipantKey, participantId);
          insertParticipant.run(
            participantId,
            tournament.id,
            teamRecord.id,
            Number.isFinite(Number(participant?.placement)) ? Number(participant.placement) : participantIndex + 1,
            participant?.invite_status || participant?.status || null,
            phaseStageName ? stageMetaByName.get(phaseStageName)?.id || null : null,
            ranking?.stageName ? stageMetaByName.get(ranking.stageName)?.id || null : null,
            ranking?.rank || (Number.isFinite(Number(participant?.placement)) ? Number(participant.placement) : null),
            ranking?.prize || null,
            tournament.created_date || now,
            tournament.updated_date || now
          );
        }

        if (participantKey) {
          const aliasKey = `${teamRecord.id}:${participantKey}`;
          if (!seenTeamAliases.has(aliasKey)) {
            seenTeamAliases.add(aliasKey);
            insertTeamAlias.run(
              randomUUID(),
              teamRecord.id,
              participant.team,
              participantKey,
              "tournament_participant",
              tournament.created_date || now,
              tournament.updated_date || now
            );
          }
        }

        const phaseStageName = getPhaseStageName(participant?.phase);
        const phaseGroupName = getPhaseGroupName(participant?.phase);
        const stageId = phaseStageName ? stageMetaByName.get(phaseStageName)?.id || null : null;
        const groupId = phaseStageName && phaseGroupName ? groupIdByStageAndName.get(`${phaseStageName}::${phaseGroupName}`) || null : null;
        const stageEntryKey = `${participantId}:${stageId || "none"}:${groupId || "none"}`;
        if (stageId && !participantStageSeen.has(stageEntryKey)) {
          participantStageSeen.add(stageEntryKey);
          insertParticipantStageEntry.run(
            randomUUID(),
            participantId,
            stageId,
            groupId,
            participant?.phase || null,
            Number.isFinite(Number(participant?.placement)) ? Number(participant.placement) : null,
            0,
            0,
            null,
            tournament.created_date || now,
            tournament.updated_date || now
          );
        }

        (Array.isArray(participant?.players) ? participant.players : []).forEach((playerEntry) => {
          const playerName = typeof playerEntry === "string"
            ? playerEntry
            : playerEntry?.name || playerEntry?.ign || playerEntry?.player_name || null;
          if (!playerName) return;
          const playerKey = `${participantId}:${normalizeLookupValue(playerName)}`;
          if (participantPlayerSeen.has(playerKey)) return;
          participantPlayerSeen.add(playerKey);

          const playerRecord = resolvePlayerRecord(playerLookup, playerName, teamRecord.id);
          const normalizedPlayerName = normalizeLookupValue(playerName);
          if (playerRecord?.id && normalizedPlayerName) {
            const aliasKey = `${playerRecord.id}:${normalizedPlayerName}`;
            if (!seenPlayerAliases.has(aliasKey)) {
              seenPlayerAliases.add(aliasKey);
              insertPlayerAlias.run(
                randomUUID(),
                playerRecord.id,
                playerName,
                normalizedPlayerName,
                tournament.created_date || now,
                tournament.updated_date || now
              );
            }
            const historyKey = `${playerRecord.id}:${teamRecord.id}:tournament_participant:${tournament.id}`;
            if (!seenPlayerTeamHistory.has(historyKey)) {
              seenPlayerTeamHistory.add(historyKey);
              insertPlayerTeamHistory.run(
                randomUUID(),
                playerRecord.id,
                teamRecord.id,
                tournament.start_date || null,
                tournament.end_date || null,
                typeof playerEntry === "object" ? playerEntry?.role || playerRecord?.role || null : playerRecord?.role || null,
                `tournament_participant:${tournament.id}`,
                tournament.created_date || now,
                tournament.updated_date || now
              );
            }
          }
          insertParticipantPlayer.run(
            randomUUID(),
            participantId,
            playerRecord?.id || null,
            playerName,
            typeof playerEntry === "object" ? playerEntry?.country || null : null,
            typeof playerEntry === "object" ? playerEntry?.role || null : null,
            typeof playerEntry === "object" && playerEntry?.is_captain ? 1 : 0,
            typeof playerEntry === "object" && playerEntry?.is_substitute ? 1 : 0,
            tournament.created_date || now,
            tournament.updated_date || now
          );
        });
      });

      stageRows.forEach((stage) => {
        const stageId = stageMetaByName.get(stage.name)?.id;
        if (!stageId || !Array.isArray(stage.standings)) return;

        stage.standings.forEach((entry) => {
          const teamRecord = resolveTeamRecord(teamLookup, entry?.team);
          if (!teamRecord) return;
          const groupName = entry?.grp
            ? `Group ${String(entry.grp).toUpperCase()}`
            : entry?.group
              ? (String(entry.group).startsWith("Group ") ? entry.group : `Group ${String(entry.group).toUpperCase()}`)
              : null;
          const groupId = groupName ? groupIdByStageAndName.get(`${stage.name}::${groupName}`) || null : null;
          insertStageStanding.run(
            randomUUID(),
            tournament.id,
            stageId,
            groupId,
            teamRecord.id,
            Number.isFinite(Number(entry?.placement)) ? Number(entry.placement) : null,
            Number(entry?.matches || entry?.m || 0),
            Number(entry?.wwcd || entry?.wins || 0),
            Number(entry?.pos || entry?.place || entry?.place_points || 0),
            Number(entry?.elimins || entry?.elims || entry?.kills || entry?.elim_points || 0),
            Number(entry?.points || entry?.pts || entry?.total_points || 0),
            entry?.outcome || null,
            tournament.created_date || now,
            tournament.updated_date || now
          );
        });
      });
    }
  });

  transaction();
}

backfillNormalizedData();

export const entityConfigs = {
  Tournament: {
    table: "tournaments",
    fields: ["name", "game", "tier", "status", "prize_pool", "start_date", "end_date", "stages", "description", "banner_url", "rules", "max_teams", "format_overview", "calendar", "prize_breakdown", "awards", "participants", "rankings", "created_by"],
    jsonFields: ["stages", "calendar", "prize_breakdown", "awards", "participants", "rankings"],
  },
  Team: {
    table: "teams",
    fields: ["name", "tag", "logo_url", "game", "region", "total_kills", "total_points", "matches_played", "wins", "created_by"],
    jsonFields: [],
  },
  Player: {
    table: "players",
    fields: ["ign", "real_name", "team_id", "role", "photo_url", "total_kills", "matches_played", "avg_damage", "created_by"],
    jsonFields: [],
  },
  Match: {
    table: "matches",
    fields: ["tournament_id", "stage", "group_name", "match_number", "map", "status", "scheduled_time", "stream_url", "day", "created_by"],
    jsonFields: [],
  },
  MatchResult: {
    table: "match_results",
    fields: ["match_id", "tournament_id", "team_id", "placement", "kill_points", "placement_points", "total_points", "matches_count", "wins_count", "stage", "created_by"],
    jsonFields: [],
  },
  NewsArticle: {
    table: "news_articles",
    fields: ["title", "content", "category", "thumbnail_url", "featured", "game", "created_date", "created_by"],
    jsonFields: [],
  },
  TransferWindow: {
    table: "transfer_windows",
    fields: ["window", "date", "country", "players", "oldTeam", "newTeam", "created_by"],
    jsonFields: ["players"],
  },
  FanProfile: {
    table: "fan_profiles",
    fields: ["user_id", "display_name", "favorite_team", "total_points", "accuracy_percent", "badge", "predictions_count", "correct_predictions", "created_by"],
    jsonFields: [],
  },
  FanPrediction: {
    table: "fan_predictions",
    fields: ["user_id", "display_name", "tournament_id", "tournament_name", "prediction_date", "lock_time", "winner_team", "top_fragger", "top_three", "status", "awarded_points", "created_by"],
    jsonFields: ["top_three"],
  },
  FanPollVote: {
    table: "fan_poll_votes",
    fields: ["user_id", "display_name", "poll_key", "option", "created_by"],
    jsonFields: [],
  },
  FanChatMessage: {
    table: "fan_chat_messages",
    fields: ["user_id", "display_name", "tournament_id", "tournament_name", "topic", "body", "created_by"],
    jsonFields: [],
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
    fields: ["tournament_id", "name", "slug", "stage_order", "stage_type", "status", "summary", "rules", "map_rotation"],
    jsonFields: ["map_rotation"],
  },
  TournamentStageGroup: {
    table: "tournament_stage_groups",
    fields: ["stage_id", "group_name", "group_order"],
    jsonFields: [],
  },
  TournamentParticipant: {
    table: "tournament_participants",
    fields: ["tournament_id", "team_id", "seed", "invite_status", "start_stage_id", "final_stage_id", "final_rank", "prize_amount"],
    jsonFields: [],
  },
  TournamentParticipantStageEntry: {
    table: "tournament_participant_stage_entries",
    fields: ["participant_id", "stage_id", "group_id", "phase_label", "placement", "qualified", "eliminated", "notes"],
    jsonFields: [],
  },
  TournamentParticipantPlayer: {
    table: "tournament_participant_players",
    fields: ["participant_id", "player_id", "player_name", "country", "role", "is_captain", "is_substitute"],
    jsonFields: [],
  },
  StageStanding: {
    table: "stage_standings",
    fields: ["tournament_id", "stage_id", "group_id", "team_id", "rank", "matches_played", "wins", "place_points", "elim_points", "total_points", "progression_status"],
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
    normalized[key] = normalized[key] ? JSON.parse(normalized[key]) : [];
  }
  if (Object.prototype.hasOwnProperty.call(normalized, "featured")) {
    normalized.featured = Boolean(normalized.featured);
  }
  return normalized;
}

export function serializePayload(config, payload) {
  const serialized = {};
  for (const field of config.fields) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      const value = payload[field];
      serialized[field] = config.jsonFields.includes(field) ? JSON.stringify(value ?? []) : value;
    }
  }
  return serialized;
}

export function recomputeTeamStats() {
  db.prepare(`
    UPDATE teams
    SET total_kills = 0,
        total_points = 0,
        matches_played = 0,
        wins = 0,
        updated_date = ?
  `).run(new Date().toISOString());

  db.prepare(`
    UPDATE teams
    SET total_kills = COALESCE((
          SELECT SUM(mr.kill_points) FROM match_results mr WHERE mr.team_id = teams.id
        ), 0),
        total_points = COALESCE((
          SELECT SUM(mr.total_points) FROM match_results mr WHERE mr.team_id = teams.id
        ), 0),
        matches_played = COALESCE((
          SELECT SUM(COALESCE(mr.matches_count, 1)) FROM match_results mr WHERE mr.team_id = teams.id
        ), 0),
        wins = COALESCE((
          SELECT SUM(
            CASE
              WHEN mr.wins_count IS NOT NULL AND mr.wins_count > 0 THEN mr.wins_count
              WHEN mr.placement = 1 THEN 1
              ELSE 0
            END
          ) FROM match_results mr WHERE mr.team_id = teams.id
        ), 0),
        updated_date = ?
  `).run(new Date().toISOString());
}
