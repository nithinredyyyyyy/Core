CREATE TABLE IF NOT EXISTS stage_standings (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  group_id TEXT,
  team_id TEXT NOT NULL,
  rank INTEGER,
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  place_points INTEGER DEFAULT 0,
  elim_points INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  progression_status TEXT,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stage_match_breakdown (
  id TEXT PRIMARY KEY,
  standing_id TEXT NOT NULL,
  match_id TEXT NOT NULL,
  placement INTEGER,
  kills INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  created_date TEXT NOT NULL,
  updated_date TEXT NOT NULL
);
