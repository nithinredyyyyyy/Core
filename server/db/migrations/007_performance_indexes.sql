-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_match_results_team_id ON match_results(team_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_publication_status ON news_articles(publication_status);
CREATE INDEX IF NOT EXISTS idx_news_articles_import_hash ON news_articles(import_hash);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_stages_tournament_id ON tournament_stages(tournament_id);
