CREATE TABLE IF NOT EXISTS team_aliases (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  alias_type TEXT,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_aliases (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_team_history (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  joined_date TEXT,
  left_date TEXT,
  role TEXT,
  source TEXT,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);
