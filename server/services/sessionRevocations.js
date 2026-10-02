/** SQLite-backed revocations share the lifetime of the persistent application DB. */
export function createSessionRevocationStore(db, { now = Date.now } = {}) {
  const pruneStatement = db.prepare("DELETE FROM session_revocations WHERE expires_at <= ?");
  const findStatement = db.prepare(
    "SELECT 1 FROM session_revocations WHERE token_hash = ? AND expires_at > ?",
  );
  const insertStatement = db.prepare(`
    INSERT INTO session_revocations (token_hash, expires_at) VALUES (?, ?)
    ON CONFLICT(token_hash) DO UPDATE SET expires_at = MAX(expires_at, excluded.expires_at)
  `);
  let nextCleanup = 0;

  function pruneExpired() {
    const timestamp = now();
    const result = pruneStatement.run(timestamp);
    nextCleanup = timestamp + 60_000;
    return result.changes;
  }

  // Cleanup on reload and, while serving requests, at most once a minute.
  // No interval survives a closed DB or keeps the process alive.
  pruneExpired();

  return {
    pruneExpired,
    revoke(tokenHash, expiresAt) {
      if (!/^[a-f0-9]{64}$/.test(tokenHash) || !Number.isSafeInteger(expiresAt)) {
        throw new TypeError("Invalid session revocation");
      }
      if (now() >= nextCleanup) pruneExpired();
      if (expiresAt > now()) insertStatement.run(tokenHash, expiresAt);
    },
    isRevoked(tokenHash) {
      if (now() >= nextCleanup) pruneExpired();
      return Boolean(findStatement.get(tokenHash, now()));
    },
  };
}
