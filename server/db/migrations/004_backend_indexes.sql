CREATE INDEX IF NOT EXISTS idx_teams_tag ON teams(tag);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_stage_group ON matches(tournament_id, stage, group_name);
CREATE INDEX IF NOT EXISTS idx_match_results_match_team ON match_results(match_id, team_id);
CREATE INDEX IF NOT EXISTS idx_match_results_tournament_stage ON match_results(tournament_id, stage);
CREATE INDEX IF NOT EXISTS idx_news_articles_category_created ON news_articles(category, created_date);

CREATE INDEX IF NOT EXISTS idx_team_aliases_team_id ON team_aliases(team_id);
CREATE INDEX IF NOT EXISTS idx_team_aliases_normalized_alias ON team_aliases(normalized_alias);

CREATE INDEX IF NOT EXISTS idx_player_aliases_player_id ON player_aliases(player_id);
CREATE INDEX IF NOT EXISTS idx_player_aliases_normalized_alias ON player_aliases(normalized_alias);

CREATE INDEX IF NOT EXISTS idx_player_team_history_player_id ON player_team_history(player_id);
CREATE INDEX IF NOT EXISTS idx_player_team_history_team_id ON player_team_history(team_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_stages_tournament_slug
  ON tournament_stages(tournament_id, slug);
CREATE INDEX IF NOT EXISTS idx_tournament_stages_tournament_order
  ON tournament_stages(tournament_id, stage_order);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_stage_groups_stage_name
  ON tournament_stage_groups(stage_id, group_name);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_participants_tournament_team
  ON tournament_participants(tournament_id, team_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_start_stage
  ON tournament_participants(start_stage_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_final_stage
  ON tournament_participants(final_stage_id);

CREATE INDEX IF NOT EXISTS idx_tournament_participant_stage_entries_participant
  ON tournament_participant_stage_entries(participant_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participant_stage_entries_stage_group
  ON tournament_participant_stage_entries(stage_id, group_id);

CREATE INDEX IF NOT EXISTS idx_tournament_participant_players_participant
  ON tournament_participant_players(participant_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participant_players_player
  ON tournament_participant_players(player_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participant_players_name
  ON tournament_participant_players(player_name);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stage_standings_stage_group_team
  ON stage_standings(stage_id, COALESCE(group_id, ''), team_id);
CREATE INDEX IF NOT EXISTS idx_stage_standings_tournament_stage
  ON stage_standings(tournament_id, stage_id);

CREATE INDEX IF NOT EXISTS idx_stage_match_breakdown_standing
  ON stage_match_breakdown(standing_id);
CREATE INDEX IF NOT EXISTS idx_stage_match_breakdown_match
  ON stage_match_breakdown(match_id);
