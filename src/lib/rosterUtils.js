function normalizePlayerKey(player) {
  return String(player || "").trim().toLowerCase();
}

export function getNormalizedTransferEntries(transferEntries = []) {
  return transferEntries
    .map((entry) => ({
      ...entry,
      oldTeam: entry.oldTeam ? String(entry.oldTeam) : null,
      newTeam: entry.newTeam ? String(entry.newTeam) : null,
    }))
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
}

export function dedupeRosterCaseInsensitive(roster = []) {
  const byKey = new Map();

  for (const player of roster) {
    const normalized = String(player || "").trim();
    if (!normalized) continue;

    const key = normalizePlayerKey(normalized);
    const existing = byKey.get(key);

    if (!existing || normalized.length > existing.length) {
      byKey.set(key, normalized);
    }
  }

  return [...byKey.values()];
}

export function applyTransferMovesToRoster(baseRoster = [], transferMoves = [], normalizedTeam) {
  const rosterMap = new Map(
    dedupeRosterCaseInsensitive(baseRoster).map((player) => [normalizePlayerKey(player), player])
  );

  for (const move of transferMoves) {
    const players = Array.isArray(move.players) ? move.players : [];
    const normalizedOld = move.oldTeam ? move.oldTeam : null;
    const normalizedNew = move.newTeam ? move.newTeam : null;

    if (normalizedOld === normalizedTeam) {
      for (const player of players) {
        rosterMap.delete(normalizePlayerKey(player));
      }
    }

    if (normalizedNew === normalizedTeam) {
      for (const player of players) {
        const normalized = String(player || "").trim();
        if (!normalized) continue;
        rosterMap.set(normalizePlayerKey(normalized), normalized);
      }
    }
  }

  return [...rosterMap.values()];
}

export function buildLiveRoster({
  teamName,
  normalizedTeam,
  teamIds = [],
  players = [],
  transferEntries = [],
  applyOverride,
}) {
  const baseRoster = dedupeRosterCaseInsensitive(
    players
      .filter((player) => teamIds.includes(player.team_id))
      .map((player) => player.ign)
  );

  const teamTransfers = getNormalizedTransferEntries(transferEntries)
    .filter((entry) => {
      const normalizedOld = entry.oldTeam ? normalizedTeam(entry.oldTeam) : null;
      const normalizedNew = entry.newTeam ? normalizedTeam(entry.newTeam) : null;
      const current = normalizedTeam(teamName);
      return normalizedOld === current || normalizedNew === current;
    })
    .map((entry) => ({
      ...entry,
      oldTeam: entry.oldTeam ? normalizedTeam(entry.oldTeam) : null,
      newTeam: entry.newTeam ? normalizedTeam(entry.newTeam) : null,
    }));

  const adjustedRoster = applyTransferMovesToRoster(
    baseRoster,
    teamTransfers,
    normalizedTeam(teamName)
  );

  return typeof applyOverride === "function"
    ? applyOverride(teamName, adjustedRoster)
    : adjustedRoster;
}

export function buildRosterFromSnapshot({
  teamName,
  normalizedTeam,
  baseRoster = [],
  transferEntries = [],
  applyOverride,
}) {
  const teamTransfers = getNormalizedTransferEntries(transferEntries)
    .filter((entry) => {
      const normalizedOld = entry.oldTeam ? normalizedTeam(entry.oldTeam) : null;
      const normalizedNew = entry.newTeam ? normalizedTeam(entry.newTeam) : null;
      const current = normalizedTeam(teamName);
      return normalizedOld === current || normalizedNew === current;
    })
    .map((entry) => ({
      ...entry,
      oldTeam: entry.oldTeam ? normalizedTeam(entry.oldTeam) : null,
      newTeam: entry.newTeam ? normalizedTeam(entry.newTeam) : null,
    }));

  const adjustedRoster = applyTransferMovesToRoster(
    dedupeRosterCaseInsensitive(baseRoster),
    teamTransfers,
    normalizedTeam(teamName)
  );

  return typeof applyOverride === "function"
    ? applyOverride(teamName, adjustedRoster)
    : adjustedRoster;
}
