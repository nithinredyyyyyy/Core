function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const MATCH_LIVE_LEAD_MS = 30 * 60 * 1000;
const MATCH_LIVE_TAIL_MS = 6 * 60 * 60 * 1000;

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
    (options.resultCountMap && match?.id
      ? options.resultCountMap.get(match.id) || 0
      : 0);
  const explicitStatus = String(match?.status || "")
    .trim()
    .toLowerCase();
  const scheduled = parseDate(match?.scheduled_time);

  if (explicitStatus === "completed" || resultCount > 0) return "completed";

  if (scheduled) {
    const delta = now.getTime() - scheduled.getTime();
    const isInsideLiveWindow =
      delta >= -MATCH_LIVE_LEAD_MS && delta <= MATCH_LIVE_TAIL_MS;
    if (explicitStatus === "live" || explicitStatus === "ongoing") {
      if (isInsideLiveWindow) return "live";
      return delta > MATCH_LIVE_TAIL_MS ? "completed" : "scheduled";
    }
    if (scheduled.getTime() > now.getTime()) return "scheduled";
    return delta <= MATCH_LIVE_TAIL_MS ? "live" : "completed";
  }

  if (explicitStatus === "live") return "live";
  if (explicitStatus === "ongoing") return "live";
  return explicitStatus || "scheduled";
}

export function deriveTournamentStatus(tournament, options = {}) {
  const now = options.now || new Date();
  const matches = (options.matches || []).filter(
    (match) => match?.tournament_id === tournament?.id,
  );
  const resultCountMap = options.resultCountMap || new Map();
  const derivedMatchStatuses = matches.map((match) =>
    deriveMatchStatus(match, { now, resultCountMap }),
  );
  const start = parseDate(tournament?.start_date);
  const end = parseDate(tournament?.end_date);
  const explicitStatus = String(tournament?.status || "")
    .trim()
    .toLowerCase();

  if (explicitStatus === "completed") return "completed";
  if (explicitStatus === "live") return "ongoing";
  if (derivedMatchStatuses.includes("live")) return "ongoing";

  if (start && start.getTime() > now.getTime()) return "upcoming";
  if (end && end.getTime() < now.getTime()) return "completed";
  if (
    start &&
    start.getTime() <= now.getTime() &&
    (!end || end.getTime() >= now.getTime())
  ) {
    return "ongoing";
  }
  if (explicitStatus === "ongoing") return "ongoing";

  if (derivedMatchStatuses.some((status) => status === "scheduled"))
    return "upcoming";
  if (
    derivedMatchStatuses.length > 0 &&
    derivedMatchStatuses.every((status) => status === "completed")
  ) {
    return "completed";
  }

  if (explicitStatus === "live") return "ongoing";
  return explicitStatus || "upcoming";
}

export function decorateMatchesWithLiveStatus(
  matches = [],
  matchResults = [],
  now = new Date(),
) {
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
  now = new Date(),
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
