export function getRequestedTournamentId(searchParams) {
  return searchParams?.get("id") || searchParams?.get("tournament") || "";
}

export function buildFanHubLink({ tournamentId = "", stage = "" } = {}) {
  const params = new URLSearchParams();
  if (tournamentId) params.set("id", tournamentId);
  if (stage) params.set("stage", stage);
  const query = params.toString();
  return query ? `/fans?${query}` : "/fans";
}

export function buildContextualFanHubLink(location) {
  const pathname = location?.pathname || "";
  if (!["/tournaments", "/leaderboard", "/fans"].includes(pathname)) {
    return "/fans";
  }

  const searchParams = new URLSearchParams(location?.search || "");
  const tournamentId = getRequestedTournamentId(searchParams);
  const stage = searchParams.get("stage") || "";
  return buildFanHubLink({ tournamentId, stage });
}
