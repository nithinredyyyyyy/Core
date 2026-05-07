function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function buildMatchResultCountMap(matchResults = []) {
  const map = new Map();
  for (const row of matchResults || []) {
    if (!row?.match_id) continue;
    map.set(row.match_id, (map.get(row.match_id) || 0) + 1);
  }
  return map;
}

export function deriveMatchStatus(match, options = {}) {
  const now = options.now || new Date();
  const resultCount =
    options.resultCount ??
    (options.resultCountMap && match?.id ? options.resultCountMap.get(match.id) || 0 : 0);
  const explicitStatus = String(match?.status || "").trim().toLowerCase();
  const scheduled = parseDate(match?.scheduled_time);

  if (explicitStatus === "completed" || resultCount > 0) return "completed";
  if (explicitStatus === "live") return "live";

  if (scheduled) {
    if (scheduled.getTime() > now.getTime()) return "scheduled";
    return "live";
  }

  if (explicitStatus === "ongoing") return "live";
  return explicitStatus || "scheduled";
}

export function deriveTournamentStatus(tournament, options = {}) {
  const now = options.now || new Date();
  const matches = (options.matches || []).filter(
    (match) => match?.tournament_id === tournament?.id
  );
  const resultCountMap = options.resultCountMap || new Map();
  const derivedMatchStatuses = matches.map((match) =>
    deriveMatchStatus(match, { now, resultCountMap })
  );

  if (derivedMatchStatuses.includes("live")) return "ongoing";
  if (
    derivedMatchStatuses.length > 0 &&
    derivedMatchStatuses.every((status) => status === "completed")
  ) {
    return "completed";
  }

  const start = parseDate(tournament?.start_date);
  const end = parseDate(tournament?.end_date);
  const explicitStatus = String(tournament?.status || "").trim().toLowerCase();

  if (start && start.getTime() > now.getTime()) return "upcoming";
  if (end && end.getTime() < now.getTime()) return "completed";
  if (start && start.getTime() <= now.getTime() && (!end || end.getTime() >= now.getTime())) {
    return "ongoing";
  }

  if (derivedMatchStatuses.some((status) => status === "scheduled")) return "upcoming";
  if (explicitStatus === "live") return "ongoing";
  return explicitStatus || "upcoming";
}

export function decorateMatchesWithLiveStatus(matches = [], matchResults = [], now = new Date()) {
  const resultCountMap = buildMatchResultCountMap(matchResults);
  return matches.map((match) => ({
    ...match,
    status: deriveMatchStatus(match, { now, resultCountMap }),
  }));
}

export function decorateTournamentsWithLiveStatus(
  tournaments = [],
  matches = [],
  matchResults = [],
  now = new Date()
) {
  const resultCountMap = buildMatchResultCountMap(matchResults);
  return tournaments.map((tournament) => ({
    ...tournament,
    status: deriveTournamentStatus(tournament, {
      now,
      matches,
      resultCountMap,
    }),
  }));
}
