-- Additive only: existing product records and session cookies are unchanged.
-- Store digests, never raw bearer tokens. Expiry uses Unix milliseconds.
CREATE TABLE IF NOT EXISTS session_revocations (
  token_hash TEXT PRIMARY KEY NOT NULL CHECK (length(token_hash) = 64),
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_revocations_expiry
  ON session_revocations (expires_at);
