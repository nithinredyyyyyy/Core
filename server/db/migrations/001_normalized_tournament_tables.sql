CREATE TABLE IF NOT EXISTS tournament_stages (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  stage_type TEXT,
  status TEXT,
  summary TEXT,
  rules TEXT,
  map_rotation TEXT,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tournament_stage_groups (
  id TEXT PRIMARY KEY,
  stage_id TEXT NOT NULL,
  group_name TEXT NOT NULL,
  group_order INTEGER NOT NULL,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tournament_participants (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  seed INTEGER,
  invite_status TEXT,
  start_stage_id TEXT,
  final_stage_id TEXT,
  final_rank INTEGER,
  prize_amount TEXT,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tournament_participant_stage_entries (
  id TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  group_id TEXT,
  phase_label TEXT,
  placement INTEGER,
  qualified INTEGER DEFAULT 0,
  eliminated INTEGER DEFAULT 0,
  notes TEXT,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tournament_participant_players (
  id TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL,
  player_id TEXT,
  player_name TEXT NOT NULL,
  country TEXT,
  role TEXT,
  is_captain INTEGER DEFAULT 0,
  is_substitute INTEGER DEFAULT 0,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);
