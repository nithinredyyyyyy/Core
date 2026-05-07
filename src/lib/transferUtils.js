function normalizePlayers(players = []) {
  return [...players].map((player) => String(player || "").trim()).filter(Boolean).sort();
}

function buildTransferKey(entry) {
  const oldTeam = String(entry.oldTeam || "").trim().toLowerCase();
  const newTeam = String(entry.newTeam || "").trim().toLowerCase();
  const window = String(entry.window || "").trim().toLowerCase();
  const date = String(entry.date || "").trim();
  const players = normalizePlayers(entry.players).map((player) => player.toLowerCase()).join("|");
  return [window, date, oldTeam, newTeam, players].join("::");
}

export function mergeTransferEntries(staticEntries = [], dbEntries = []) {
  const merged = new Map();

  for (const entry of staticEntries) {
    merged.set(buildTransferKey(entry), { ...entry });
  }

  for (const entry of dbEntries) {
    merged.set(buildTransferKey(entry), { ...entry });
  }

  return [...merged.values()].sort((a, b) => {
    const dateDiff = new Date(b.date || 0) - new Date(a.date || 0);
    if (dateDiff !== 0) return dateDiff;
    return String(a.window || "").localeCompare(String(b.window || ""));
  });
}
