import { GLOBAL_LEADERBOARD, PLAYER_RANKINGS } from "./shared/globalLeaderboard.js";

const EWC_CLUB_RANKINGS = [
  { rank: 1, clubName: "AG.AL International", ccPoints: 5300, goldMedals: 2, silverMedals: 3, bronzeMedals: 1, place: "1st", prize: "$7,000,000", trend: 0 },
  { rank: 2, clubName: "Team Falcons", ccPoints: 4600, goldMedals: 2, silverMedals: 0, bronzeMedals: 1, place: "2nd", prize: "$5,000,000", trend: 0 },
  { rank: 3, clubName: "Team Vitality", ccPoints: 3300, goldMedals: 1, silverMedals: 0, bronzeMedals: 1, place: "3rd", prize: "$4,000,000", trend: 0 },
  { rank: 4, clubName: "Natus Vincere", ccPoints: 2950, goldMedals: 1, silverMedals: 1, bronzeMedals: 1, place: "4th", prize: "$3,000,000", trend: 0 },
  { rank: 5, clubName: "Team Liquid", ccPoints: 2700, goldMedals: 1, silverMedals: 2, bronzeMedals: 0, place: "5th", prize: "$2,000,000", trend: 0 },
  { rank: 6, clubName: "Team Spirit", ccPoints: 2200, goldMedals: 2, silverMedals: 0, bronzeMedals: 0, place: "6th", prize: "$1,275,000", trend: 0 },
  { rank: 7, clubName: "Virtus.pro", ccPoints: 2200, goldMedals: 1, silverMedals: 1, bronzeMedals: 0, place: "7th", prize: "$1,275,000", trend: 0 },
  { rank: 8, clubName: "Aurora Gaming", ccPoints: 2150, goldMedals: 0, silverMedals: 1, bronzeMedals: 2, place: "8th", prize: "$950,000", trend: 0 },
  { rank: 9, clubName: "Twisted Minds", ccPoints: 1900, goldMedals: 0, silverMedals: 1, bronzeMedals: 0, place: "9th", prize: "$800,000", trend: 0 },
  { rank: 10, clubName: "T1", ccPoints: 1800, goldMedals: 0, silverMedals: 1, bronzeMedals: 1, place: "10th", prize: "$650,000", trend: 0 },
  { rank: 11, clubName: "Team Vision", ccPoints: 1750, goldMedals: 2, silverMedals: 0, bronzeMedals: 0, place: "11th", prize: "$550,000", trend: 0 },
  { rank: 12, clubName: "100 Thieves", ccPoints: 1500, goldMedals: 1, silverMedals: 0, bronzeMedals: 1, place: "12th", prize: "$475,000", trend: 0 },
  { rank: 13, clubName: "ZETA DIVISION", ccPoints: 1500, goldMedals: 1, silverMedals: 0, bronzeMedals: 0, place: "13th", prize: "$475,000", trend: 0 },
  { rank: 14, clubName: "Nongshim RedForce", ccPoints: 1250, goldMedals: 0, silverMedals: 1, bronzeMedals: 1, place: "14th", prize: "$400,000", trend: 0 },
  { rank: 15, clubName: "G2 Esports", ccPoints: 1200, goldMedals: 1, silverMedals: 0, bronzeMedals: 0, place: "15th", prize: "$308,333", trend: 0 },
  { rank: 16, clubName: "FaZe Clan", ccPoints: 1200, goldMedals: 1, silverMedals: 0, bronzeMedals: 0, place: "16th", prize: "$308,333", trend: 0 },
  { rank: 17, clubName: "BIG", ccPoints: 1200, goldMedals: 1, silverMedals: 0, bronzeMedals: 0, place: "17th", prize: "$308,333", trend: 0 },
  { rank: 18, clubName: "Weibo Gaming", ccPoints: 1100, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, place: "18th", prize: "$250,000", trend: 0 },
  { rank: 19, clubName: "Karmine Corp", ccPoints: 1050, goldMedals: 0, silverMedals: 1, bronzeMedals: 0, place: "19th", prize: "$212,500", trend: 0 },
  { rank: 20, clubName: "FURIA", ccPoints: 1050, goldMedals: 0, silverMedals: 1, bronzeMedals: 0, place: "20th", prize: "$212,500", trend: 0 },
  { rank: 21, clubName: "REJECT", ccPoints: 1000, goldMedals: 0, silverMedals: 0, bronzeMedals: 1, place: "21st", prize: "$175,000", trend: 0 },
  { rank: 22, clubName: "Team Heretics", ccPoints: 950, goldMedals: 0, silverMedals: 1, bronzeMedals: 0, place: "22nd", prize: "$125,000", trend: 0 },
  { rank: 23, clubName: "DRX", ccPoints: 950, goldMedals: 0, silverMedals: 1, bronzeMedals: 0, place: "23rd", prize: "$125,000", trend: 0 },
  { rank: 24, clubName: "Spacestation Gaming", ccPoints: 950, goldMedals: 0, silverMedals: 1, bronzeMedals: 0, place: "24th", prize: "$125,000", trend: 0 },
];

function buildTeamRankings() {
  return GLOBAL_LEADERBOARD.map((entry, index) => ({
    id: `team-${index + 1}`,
    rank: entry.rank,
    teamName: entry.teamName,
    pts24BGIS: entry.pts24BGIS || 0,
    pts24BMPS: entry.pts24BMPS || 0,
    pts25BGIS: entry.pts25BGIS || 0,
    pts25BMPS: entry.pts25BMPS || 0,
    pts25BMSD: entry.pts25BMSD || 0,
    pts26BGIS: entry.pts26BGIS || 0,
    pts26BMPS: entry.pts26BMPS || 0,
    rating: entry.rating,
    trend: 0,
    status: entry.status || "Active",
  }));
}

function buildPlayerRankings() {
  return PLAYER_RANKINGS.map((entry, index) => ({
    id: `player-${index + 1}`,
    rank: entry.rank || index + 1,
    playerName: entry.playerName,
    teamName: entry.teamName,
    rating: entry.pts,
    eliminations: entry.finishes,
    photo: entry.photo || null,
    trend: 0,
  }));
}

function buildChartData(teamRankings) {
  const topTeams = teamRankings.slice(0, 3);
  const seasons = ["BGIS '24", "BMPS '24", "BGIS '25", "BMPS '25", "BMSD '25", "BGIS '26", "BMPS '26"];
  const keys = ["pts24BGIS", "pts24BMPS", "pts25BGIS", "pts25BMPS", "pts25BMSD", "pts26BGIS", "pts26BMPS"];
  return seasons.map((name, seasonIndex) => {
    const row = { name };
    let cumulative = {};
    for (const team of topTeams) {
      if (!cumulative[team.teamName]) cumulative[team.teamName] = 0;
      cumulative[team.teamName] += team[keys[seasonIndex]] || 0;
      row[team.teamName] = cumulative[team.teamName];
    }
    return row;
  });
}

function buildOrganizationRankings() {
  return EWC_CLUB_RANKINGS.map((entry, index) => ({
    ...entry,
    id: `org-${index + 1}`,
  }));
}

function seasonPoints(entry) {
  return (entry.pts26BGIS || 0) + (entry.pts26BMPS || 0);
}

function buildInsights(teamRankings, playerRankings) {
  const topTeam = teamRankings[0];
  const topFinisher = [...playerRankings].sort(
    (left, right) => right.eliminations - left.eliminations,
  )[0];
  const topSeason =
    [...teamRankings]
      .sort((left, right) => seasonPoints(right) - seasonPoints(left))
      .find((entry) => entry.teamName !== topTeam?.teamName) || teamRankings[0];

  return [
    {
      title: "Top Rated Team",
      value: topTeam?.teamName || "—",
      sub: `${topTeam?.rating || 0} rating points`,
      tone: "green",
    },
    {
      title: "Highest Finishes",
      value: topFinisher?.playerName || "—",
      sub: `${topFinisher?.eliminations || 0} eliminations`,
      tone: "amber",
    },
    {
      title: "Best 2026 Season",
      value: topSeason?.teamName || "—",
      sub: `${seasonPoints(topSeason) || 0} season points`,
      tone: "blue",
    },
  ];
}

function buildRecentUpdates(teamRankings) {
  return teamRankings.slice(0, 4).map((entry, index) => ({
    id: index + 1,
    text: `${entry.teamName} holds #${entry.rank} with ${entry.rating} points`,
    type: index % 3 === 0 ? "up" : index % 3 === 1 ? "down" : "neutral",
    time: "Current",
  }));
}

export function buildRankingsPagePayload() {
  const teams = buildTeamRankings();
  const players = buildPlayerRankings();
  const organizations = buildOrganizationRankings();
  const totalPoints = teams.reduce((sum, entry) => sum + (entry.rating || 0), 0);
  const avgRating = teams.length
    ? Math.round(totalPoints / teams.length)
    : 0;

  return {
    teams,
    players,
    organizations,
    chartData: buildChartData(teams),
    insights: buildInsights(teams, players),
    recentUpdates: buildRecentUpdates(teams),
    stats: {
      rankedTeams: teams.length,
      rankedPlayers: players.length,
      avgRating,
      totalPoints,
    },
    updatedAt: new Date().toISOString(),
  };
}
