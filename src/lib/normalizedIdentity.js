import {
  getOrganizationMeta as getFallbackOrganizationMeta,
  normalizeOrganizationName as fallbackNormalizeOrganizationName,
} from "@/lib/organizationIdentity";

function normalizeLookupValue(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function buildTeamAliasIndex(teams = [], teamAliases = []) {
  const byTeamId = new Map((teams || []).map((team) => [team.id, team]));
  const byNormalized = new Map();

  const register = (normalizedAlias, team) => {
    if (!normalizedAlias || !team || byNormalized.has(normalizedAlias)) return;
    byNormalized.set(normalizedAlias, team);
  };

  (teamAliases || []).forEach((alias) => {
    register(alias.normalized_alias || normalizeLookupValue(alias.alias), byTeamId.get(alias.team_id));
  });

  (teams || []).forEach((team) => {
    register(normalizeLookupValue(team.name), team);
    register(normalizeLookupValue(team.tag), team);
  });

  return { byTeamId, byNormalized };
}

export function resolveTeamByAlias(teamLike, teamAliasIndex) {
  const rawName = typeof teamLike === "string" ? teamLike : teamLike?.name;
  const normalized = normalizeLookupValue(rawName);
  return teamAliasIndex?.byNormalized?.get(normalized) || null;
}

export function getOrganizationMetaFromAliases(teamLike, teamAliasIndex) {
  const rawName = typeof teamLike === "string" ? teamLike : teamLike?.name;
  const liveTag = typeof teamLike === "string" ? null : teamLike?.tag;
  const resolvedTeam = resolveTeamByAlias(teamLike, teamAliasIndex);

  if (resolvedTeam) {
    const fallbackMeta = getFallbackOrganizationMeta(resolvedTeam);
    return {
      key: resolvedTeam.id || fallbackMeta.key,
      name: resolvedTeam.name || fallbackMeta.name,
      tag: liveTag || resolvedTeam.tag || fallbackMeta.tag,
    };
  }

  return getFallbackOrganizationMeta(teamLike);
}

export function buildPlayerAliasIndex(players = [], playerAliases = []) {
  const byPlayerId = new Map((players || []).map((player) => [player.id, player]));
  const byNormalized = new Map();

  const register = (normalizedAlias, player) => {
    if (!normalizedAlias || !player) return;
    const current = byNormalized.get(normalizedAlias) || [];
    if (!current.some((entry) => entry.id === player.id)) {
      current.push(player);
      byNormalized.set(normalizedAlias, current);
    }
  };

  (playerAliases || []).forEach((alias) => {
    register(alias.normalized_alias || normalizeLookupValue(alias.alias), byPlayerId.get(alias.player_id));
  });

  (players || []).forEach((player) => {
    register(normalizeLookupValue(player.ign), player);
  });

  return { byPlayerId, byNormalized };
}

export function resolvePlayerRowsByAlias(ign, playerAliasIndex, players = []) {
  const normalized = normalizeLookupValue(ign);
  if (!normalized) return [];
  return playerAliasIndex?.byNormalized?.get(normalized) || (players || []).filter((player) => normalizeLookupValue(player.ign) === normalized);
}

function getHistoryRecency(entry) {
  return new Date(entry?.left_date || entry?.joined_date || entry?.updated_date || 0).getTime() || 0;
}

function getPlayerRecency(player) {
  return new Date(player?.updated_date || player?.created_date || 0).getTime() || 0;
}

export function pickBestPlayerRowForTeamContext(
  ign,
  preferredTeamLike,
  playerAliasIndex,
  players = [],
  playerTeamHistoryMap = new Map(),
  teamAliasIndex
) {
  const candidates = resolvePlayerRowsByAlias(ign, playerAliasIndex, players);
  if (!preferredTeamLike || candidates.length <= 1) {
    return candidates[0] || null;
  }

  const preferredTeam = resolveTeamByAlias(preferredTeamLike, teamAliasIndex);
  if (!preferredTeam?.id) {
    return candidates[0] || null;
  }

  const scored = candidates
    .map((player) => {
      const histories = playerTeamHistoryMap.get(player.id) || [];
      const matchingHistories = histories.filter((entry) => entry.team_id === preferredTeam.id);
      const openHistory = matchingHistories.find((entry) => !entry.left_date);
      const latestMatchingHistory = matchingHistories.reduce(
        (best, entry) => Math.max(best, getHistoryRecency(entry)),
        0
      );

      let score = 0;
      if (player.team_id === preferredTeam.id) score += 120;
      if (openHistory) score += 100;
      if (matchingHistories.length > 0) score += 60;

      return {
        player,
        score,
        latestMatchingHistory,
        latestPlayerUpdate: getPlayerRecency(player),
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.latestMatchingHistory !== left.latestMatchingHistory) {
        return right.latestMatchingHistory - left.latestMatchingHistory;
      }
      return right.latestPlayerUpdate - left.latestPlayerUpdate;
    });

  return scored[0]?.player || candidates[0] || null;
}

export function buildPlayerTeamHistoryMap(playerTeamHistory = []) {
  const byPlayerId = new Map();

  (playerTeamHistory || []).forEach((entry) => {
    const current = byPlayerId.get(entry.player_id) || [];
    current.push(entry);
    byPlayerId.set(entry.player_id, current);
  });

  for (const [playerId, entries] of byPlayerId.entries()) {
    entries.sort((left, right) => {
      const leftOpen = !left.left_date ? 1 : 0;
      const rightOpen = !right.left_date ? 1 : 0;
      if (leftOpen !== rightOpen) return rightOpen - leftOpen;
      return new Date(right.joined_date || right.updated_date || 0) - new Date(left.joined_date || left.updated_date || 0);
    });
    byPlayerId.set(playerId, entries);
  }

  return byPlayerId;
}

export function normalizeOrganizationKeyWithAliases(teamLike, teamAliasIndex) {
  const resolved = resolveTeamByAlias(teamLike, teamAliasIndex);
  if (resolved?.id) return resolved.id;
  return fallbackNormalizeOrganizationName(typeof teamLike === "string" ? teamLike : teamLike?.name);
}
