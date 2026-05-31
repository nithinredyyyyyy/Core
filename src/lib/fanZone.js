import {
  BMPS_2026_IGL_STATS,
  BMPS_2026_MVP_STATS,
  BMPS_2026_QUALIFIER_PLAYER_STATS,
} from "@/lib/bmps2026PlayerStats";
import { getBadgeForXp, normalizeBadgeName } from "@/lib/fanBadges";

export const FAN_REACTION_OPTIONS = [
  { key: "fire", emoji: "🔥", label: "Fire" },
  { key: "crown", emoji: "👑", label: "Crown" },
  { key: "shock", emoji: "😮", label: "Shock" },
  { key: "clutch", emoji: "⚡", label: "Clutch" },
];

export const FAN_POLL_TEMPLATES = [
  {
    pollKey: "who-wins-today",
    title: "Who will win today?",
    description: "Lock your read before the live slate shifts.",
    badgeLabel: "Match vote",
  },
  {
    pollKey: "best-clutch-week",
    title: "Best clutch this week?",
    description: "Spot the biggest round-changing moment from the circuit.",
    badgeLabel: "Community call",
  },
  {
    pollKey: "rate-roster-move",
    title: "Rate this roster move",
    description: "Give a quick fan verdict on the latest transfer or lineup change.",
    badgeLabel: "Roster heat",
  },
];

const qualifierStatsMap = new Map(
  BMPS_2026_QUALIFIER_PLAYER_STATS.map((entry) => [entry.player.toLowerCase(), entry]),
);
const mvpStatsMap = new Map(
  BMPS_2026_MVP_STATS.map((entry) => [entry.player.toLowerCase(), entry]),
);
const iglStatsMap = new Map(
  BMPS_2026_IGL_STATS.map((entry) => [entry.player.toLowerCase(), entry]),
);

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function parseSurvivalToMinutes(value) {
  const match = String(value || "").match(/(\d+):(\d+)/);
  if (!match) return 0;
  return Number(match[1]) + Number(match[2]) / 60;
}

function inferRevives(role, finishes) {
  const normalizedRole = normalizeKey(role);
  if (normalizedRole.includes("support")) return Math.max(2, Math.round(finishes * 0.18));
  if (normalizedRole.includes("igl")) return Math.max(1, Math.round(finishes * 0.12));
  return Math.max(0, Math.round(finishes * 0.08));
}

export function buildFantasyPlayerPool(players = [], teams = []) {
  const teamNameById = new Map(teams.map((team) => [team.id, team.name]));

  return players
    .map((player) => {
      const key = normalizeKey(player.ign);
      const qualifier = qualifierStatsMap.get(key);
      const mvp = mvpStatsMap.get(key);
      const igl = iglStatsMap.get(key);

      const finishes = Number(mvp?.finishes ?? qualifier?.finishes ?? player.total_kills ?? 0);
      const damage = Number(
        mvp?.damage ??
          (Number(player.avg_damage || 0) * Math.max(1, Number(player.matches_played || 1))),
      );
      const survival = parseSurvivalToMinutes(mvp?.avgSurvival) || Math.max(10, Number(player.matches_played || 0) * 1.25);
      const wwcd = Number(igl?.wwcd || 0);
      const revives = inferRevives(player.role, finishes);
      const fantasyPoints =
        finishes * 4 +
        Math.round(damage / 250) +
        Math.round(survival / 2) +
        wwcd * 10 +
        revives * 2;

      return {
        id: player.id,
        ign: player.ign,
        role: player.role || "Fragger",
        teamId: player.team_id || "",
        teamName:
          teamNameById.get(player.team_id) ||
          mvp?.teamName ||
          igl?.teamName ||
          "Open roster",
        finishes,
        damage,
        survival,
        wwcd,
        revives,
        fantasyPoints,
      };
    })
    .filter((player) => player.ign)
    .toSorted((left, right) => right.fantasyPoints - left.fantasyPoints)
    .slice(0, 40);
}

export function scoreFantasySquad(picks = [], playerPool = []) {
  const playerMap = new Map(playerPool.map((player) => [player.id, player]));
  return picks.reduce((total, pick) => {
    const player = playerMap.get(pick.playerId);
    if (!player) return total;
    const multiplier = pick.isCaptain ? 1.5 : 1;
    return total + Math.round(player.fantasyPoints * multiplier);
  }, 0);
}

export function buildFantasyLeaderboard(squads = []) {
  return squads
    .map((squad) => ({
      ...squad,
      total_points: Number(squad.total_points || 0),
    }))
    .toSorted((left, right) => right.total_points - left.total_points)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

export function aggregateCommentReactions(messages = [], reactions = []) {
  const grouped = new Map();
  for (const reaction of reactions) {
    const current = grouped.get(reaction.comment_id) || {
      upvotes: 0,
      downvotes: 0,
      emojis: {},
    };
    if (Number(reaction.vote_value || 0) > 0) current.upvotes += 1;
    if (Number(reaction.vote_value || 0) < 0) current.downvotes += 1;
    if (reaction.reaction) {
      current.emojis[reaction.reaction] = (current.emojis[reaction.reaction] || 0) + 1;
    }
    grouped.set(reaction.comment_id, current);
  }

  return messages.map((message) => ({
    ...message,
    reactionSummary: grouped.get(message.id) || { upvotes: 0, downvotes: 0, emojis: {} },
  }));
}

export function buildFanClubRows(teams = [], follows = [], profiles = []) {
  const followCounts = new Map();
  for (const follow of follows) {
    if (follow.target_type !== "team") continue;
    followCounts.set(follow.target_label, (followCounts.get(follow.target_label) || 0) + 1);
  }
  for (const profile of profiles) {
    if (!profile.favorite_team) continue;
    followCounts.set(
      profile.favorite_team,
      (followCounts.get(profile.favorite_team) || 0) + 1,
    );
  }

  return teams
    .map((team) => ({
      id: team.id,
      name: team.name,
      tag: team.tag,
      totalFans: followCounts.get(team.name) || 0,
      totalPoints: Number(team.total_points || 0),
    }))
    .toSorted((left, right) => {
      if (right.totalFans !== left.totalFans) return right.totalFans - left.totalFans;
      return right.totalPoints - left.totalPoints;
    })
    .slice(0, 8);
}

export function buildTrendingArticles(articles = [], comments = [], reactions = []) {
  const commentCounts = new Map();
  for (const comment of comments) {
    if (!String(comment.topic || "").startsWith("news:")) continue;
    const articleId = String(comment.topic).slice(5);
    commentCounts.set(articleId, (commentCounts.get(articleId) || 0) + 1);
  }

  const reactionCounts = new Map();
  for (const reaction of reactions) {
    const current = reactionCounts.get(reaction.comment_id) || 0;
    reactionCounts.set(reaction.comment_id, current + 1);
  }

  return articles
    .map((article) => {
      const articleCommentCount = commentCounts.get(article.id) || 0;
      const boost = article.featured ? 8 : 0;
      const recencyBoost = article.created_date
        ? Math.max(
            0,
            12 - Math.floor((Date.now() - new Date(article.created_date).getTime()) / (1000 * 60 * 60 * 12)),
          )
        : 0;
      return {
        ...article,
        trendScore: boost + recencyBoost + articleCommentCount * 2,
      };
    })
    .toSorted((left, right) => right.trendScore - left.trendScore);
}

export function nextProfileProgress(profile, deltas = {}) {
  const xp = Number(profile?.xp_points || 0) + Number(deltas.xp || 0);
  const totalPoints = Number(profile?.total_points || 0) + Number(deltas.points || 0);
  const streak = Number(profile?.login_streak || 0) + Number(deltas.streak || 0);
  const badgeInventory = Array.isArray(profile?.badge_inventory)
    ? profile.badge_inventory.map(normalizeBadgeName)
    : [];
  const rankBadge = getBadgeForXp(xp);
  const earnedBadges = new Set([...badgeInventory, rankBadge]);
  if (streak >= 5) earnedBadges.add("Streak");
  if (totalPoints >= 100) earnedBadges.add("Predictor");

  return {
    xp_points: xp,
    total_points: totalPoints,
    login_streak: streak,
    rank_badge: rankBadge,
    badge_inventory: [...earnedBadges],
    badge: rankBadge,
  };
}
