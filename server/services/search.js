import { db, entityConfigs, normalizeRecord } from "../db.js";
import { normalizeTournamentPayload } from "./tournaments.js";

function normalizeSearchValue(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

function buildAcronym(value) {
  const parts = String(value || "")
    .replace(/[:()/.-]/g, " ")
    .split(/\s+/)
    .flatMap((part) => {
      const normalized = part.trim();
      return normalized ? [normalized] : [];
    });
  const letters = parts.reduce((result, part) => {
    if (/^\d+$/.test(part)) return result;
    const initial = part[0]?.toUpperCase();
    return initial ? `${result}${initial}` : result;
  }, "");
  const year = parts.find((part) => /^\d{4}$/.test(part));
  return year ? `${letters} ${year}` : letters;
}

function getTournamentSearchAliases(tournament) {
  const name = String(tournament?.name || "");
  const lower = name.toLowerCase();
  const yearMatch = name.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : "";
  const aliases = [
    tournament?.short_name,
    tournament?.shortName,
    tournament?.tag,
    tournament?.code,
    buildAcronym(name),
    buildAcronym(name).replace(/\s+/g, ""),
  ].filter(Boolean);

  const knownSeries = [
    ["battlegrounds mobile india pro series", "BMPS"],
    ["battlegrounds mobile india series", "BGIS"],
    ["battlegrounds mobile india showdown", "BMSD"],
    ["battlegrounds mobile india international cup", "BMIC"],
    ["esl snapdragon pro series", "ESL SPS"],
  ];

  knownSeries.forEach(([pattern, code]) => {
    if (lower.includes(pattern)) {
      aliases.push(code, code.replace(/\s+/g, ""));
      if (year) {
        aliases.push(`${code} ${year}`, `${code}${year}`);
      }
    }
  });

  return [...new Set(aliases.filter(Boolean))];
}

function scoreTextMatch(value, query) {
  if (!value) return -1;
  const normalized = String(value).toLowerCase().trim();
  const compact = normalizeSearchValue(value);
  const compactQuery = normalizeSearchValue(query);
  if (normalized === query || compact === compactQuery) return 160;
  if (normalized.startsWith(query) || compact.startsWith(compactQuery))
    return 120;
  if (normalized.includes(query) || compact.includes(compactQuery)) return 75;
  return -1;
}

function isShortCodeQuery(query) {
  const compact = normalizeSearchValue(query);
  return compact.length >= 2 && compact.length <= 8;
}

export function getGlobalSearchResults(rawQuery, rawLimit = 10) {
  const query = String(rawQuery || "")
    .toLowerCase()
    .trim();
  if (query.length < 2) return [];

  const limit = Number.isFinite(Number(rawLimit))
    ? Math.min(Math.max(Number(rawLimit), 1), 20)
    : 10;
  const compactQuery = normalizeSearchValue(query);
  const shortCodeQuery = isShortCodeQuery(query);
  const tournaments = db
    .prepare("SELECT * FROM tournaments")
    .all()
    .map(normalizeTournamentPayload);
  const teams = db
    .prepare("SELECT * FROM teams")
    .all()
    .map((row) => normalizeRecord(entityConfigs.Team, row));
  const teamAliases = db
    .prepare("SELECT * FROM team_aliases")
    .all()
    .map((row) => normalizeRecord(entityConfigs.TeamAlias, row));
  const players = db
    .prepare("SELECT * FROM players")
    .all()
    .map((row) => normalizeRecord(entityConfigs.Player, row));
  const playerAliases = db
    .prepare("SELECT * FROM player_aliases")
    .all()
    .map((row) => normalizeRecord(entityConfigs.PlayerAlias, row));
  const matches = db
    .prepare("SELECT * FROM matches")
    .all()
    .map((row) => normalizeRecord(entityConfigs.Match, row));
  const news = db
    .prepare(
      "SELECT * FROM news_articles WHERE publication_status = 'published'",
    )
    .all()
    .map((row) => normalizeRecord(entityConfigs.NewsArticle, row));

  const teamById = new Map(teams.map((team) => [team.id, team]));
  const tournamentById = new Map(
    tournaments.map((tournament) => [tournament.id, tournament]),
  );

  const organizations = new Map();
  teams.forEach((team) => {
    const key = normalizeSearchValue(team.name || team.tag || team.id);
    organizations.set(key, {
      label: team.name,
      sub: team.tag || "Team profile",
      aliases: new Set([team.name, team.tag].filter(Boolean)),
      path: `/teams?team=${encodeURIComponent(team.name)}`,
    });
  });

  teamAliases.forEach((alias) => {
    const team = teamById.get(alias.team_id);
    if (!team) return;
    const key = normalizeSearchValue(team.name || team.tag || team.id);
    const organization = organizations.get(key);
    if (!organization) return;
    organization.aliases.add(alias.alias);
    organization.aliases.add(alias.normalized_alias);
  });

  const playerAliasMap = new Map();
  players.forEach((player) => {
    playerAliasMap.set(
      player.id,
      new Set([player.ign, player.real_name].filter(Boolean)),
    );
  });
  playerAliases.forEach((alias) => {
    const existing = playerAliasMap.get(alias.player_id);
    if (!existing) return;
    existing.add(alias.alias);
    existing.add(alias.normalized_alias);
  });

  const results = [];

  tournaments.forEach((tournament) => {
    const aliases = [
      tournament.name,
      tournament.game,
      tournament.status,
      ...getTournamentSearchAliases(tournament),
    ].filter(Boolean);
    let score = Math.max(
      ...aliases.map((alias) => scoreTextMatch(alias, query)),
    );
    const exactAliasHit = aliases.some(
      (alias) => normalizeSearchValue(alias) === compactQuery,
    );
    if (exactAliasHit) score = Math.max(score, 280);
    if (score < 0) return;
    results.push({
      type: "tournament",
      label: tournament.name,
      sub: `${tournament.game || "Tournament"}${tournament.status ? ` · ${tournament.status}` : ""}`,
      path: `/tournaments?id=${tournament.id}`,
      score: score + 60,
    });
  });

  [...organizations.values()].forEach((organization) => {
    const aliases = [...organization.aliases].filter(Boolean);
    let score = Math.max(
      scoreTextMatch(organization.label, query),
      scoreTextMatch(organization.sub, query),
      ...aliases.map((alias) => scoreTextMatch(alias, query)),
    );
    const compactTag = normalizeSearchValue(organization.sub);
    const exactAliasHit = aliases.some(
      (alias) => normalizeSearchValue(alias) === compactQuery,
    );
    if (compactTag && compactTag === compactQuery) score = Math.max(score, 250);
    if (exactAliasHit) score = Math.max(score, 220);
    if (score < 0) return;
    results.push({
      type: "team",
      label: organization.label,
      sub: organization.sub,
      path: organization.path,
      score: score + 70,
    });
  });

  players.forEach((player) => {
    const aliases = [...(playerAliasMap.get(player.id) || [])].filter(Boolean);
    const team = teamById.get(player.team_id);
    let score = Math.max(
      scoreTextMatch(player.ign, query),
      scoreTextMatch(player.real_name, query),
      scoreTextMatch(team?.name, query),
      ...aliases.map((alias) => scoreTextMatch(alias, query)),
    );
    const exactAliasHit = aliases.some(
      (alias) => normalizeSearchValue(alias) === compactQuery,
    );
    if (exactAliasHit) score = Math.max(score, 210);
    if (score < 0) return;
    results.push({
      type: "player",
      label: player.ign,
      sub: team?.name || player.real_name || "Player",
      path: `/players/${encodeURIComponent(player.ign)}${team?.name ? `?team=${encodeURIComponent(team.name)}` : ""}`,
      score: score + 20,
    });
  });

  matches.forEach((match) => {
    const tournament = tournamentById.get(match.tournament_id);
    const stageLabel = `${match.stage || ""}${match.group_name ? ` · ${match.group_name}` : ""}`;
    const score = Math.max(
      scoreTextMatch(stageLabel, query),
      scoreTextMatch(match.map, query),
      scoreTextMatch(tournament?.name, query),
      scoreTextMatch(`match ${match.match_number || ""}`, query),
    );
    if (score < 0) return;
    results.push({
      type: "match",
      label: tournament?.name || "Match",
      sub: `${stageLabel || "Stage pending"}${match.map ? ` · ${match.map}` : ""}${match.match_number ? ` · Match ${match.match_number}` : ""}`,
      path: tournament ? `/tournaments?id=${tournament.id}` : "/tournaments",
      score,
    });
  });

  news.forEach((article) => {
    let score = Math.max(
      scoreTextMatch(article.title, query),
      scoreTextMatch(article.category?.replace(/_/g, " "), query),
      scoreTextMatch(article.game, query),
    );
    if (score < 0) return;
    if (shortCodeQuery) {
      score -= 70;
    }
    results.push({
      type: "news",
      label: article.title,
      sub: article.category?.replace(/_/g, " ") || article.game || "Story",
      path: `/news/${article.id}`,
      score: score - 20,
    });
  });

  return results
    .filter((result) => result.label && result.path)
    .sort(
      (left, right) =>
        right.score - left.score || left.label.localeCompare(right.label),
    )
    .filter((result, index, list) => {
      const duplicateIndex = list.findIndex(
        (item) =>
          item.type === result.type &&
          item.path === result.path &&
          normalizeSearchValue(item.label) ===
            normalizeSearchValue(result.label),
      );
      return duplicateIndex === index;
    })
    .slice(0, limit)
    .map(({ score, ...result }) => result);
}
