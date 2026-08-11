import { GLOBAL_LEADERBOARD, PLAYER_RANKINGS } from "../src/lib/globalLeaderboard.js";

const EWC_CLUB_RANKINGS = [
  { rank: 1, clubName: "AG.AL", ccPoints: 3350, goldMedals: 1, silverMedals: 2, bronzeMedals: 1, place: "1st Place", prize: "$7,000,000", trend: 0 },
  { rank: 2, clubName: "Team Falcons", ccPoints: 2900, goldMedals: 1, silverMedals: 0, bronzeMedals: 0, place: "2nd Place", prize: "$5,000,000", trend: 0 },
  { rank: 3, clubName: "Natus Vincere", ccPoints: 2250, goldMedals: 1, silverMedals: 1, bronzeMedals: 1, place: "3rd Place", prize: "$4,000,000", trend: 0 },
  { rank: 4, clubName: "Virtus.Pro", ccPoints: 2200, goldMedals: 1, silverMedals: 1, bronzeMedals: 0, place: "4th Place", prize: "$3,000,000", trend: 0 },
  { rank: 5, clubName: "Team Vitality", ccPoints: 2200, goldMedals: 1, silverMedals: 0, bronzeMedals: 0, place: "5th Place", prize: "$2,000,000", trend: 0 },
  { rank: 6, clubName: "Team Vision", ccPoints: 1750, goldMedals: 1, silverMedals: 1, bronzeMedals: 0, place: "6th Place", prize: "$1,400,000", trend: 0 },
  { rank: 7, clubName: "T1", ccPoints: 1750, goldMedals: 0, silverMedals: 1, bronzeMedals: 1, place: "7th Place", prize: "$1,150,000", trend: 0 },
  { rank: 8, clubName: "Twisted Minds", ccPoints: 1700, goldMedals: 0, silverMedals: 1, bronzeMedals: 0, place: "8th Place", prize: "$950,000", trend: 0 },
  { rank: 9, clubName: "100 Thieves", ccPoints: 1500, goldMedals: 1, silverMedals: 0, bronzeMedals: 1, place: "9th Place", prize: "$800,000", trend: 0 },
  { rank: 10, clubName: "ZETA DIVISION", ccPoints: 1500, goldMedals: 1, silverMedals: 0, bronzeMedals: 0, place: "10th place", prize: "$650,000", trend: 0 },
  { rank: 11, clubName: "Team Spirit", ccPoints: 1200, goldMedals: 1, silverMedals: 0, bronzeMedals: 0, place: "11th Place", prize: "$550,000", trend: 0 },
  { rank: 12, clubName: "Aurora Gaming", ccPoints: 1150, goldMedals: 0, silverMedals: 1, bronzeMedals: 0, place: "12th Place", prize: "$500,000", trend: 0 },
  { rank: 13, clubName: "Weibo Gaming", ccPoints: 1100, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, place: "13th Place", prize: "$450,000", trend: 0 },
  { rank: 14, clubName: "REJECT", ccPoints: 1000, goldMedals: 0, silverMedals: 0, bronzeMedals: 1, place: "14th Place", prize: "$400,000", trend: 0 },
  { rank: 15, clubName: "Team Heretics", ccPoints: 950, goldMedals: 0, silverMedals: 1, bronzeMedals: 0, place: "15th Place", prize: "$350,000", trend: 0 },
  { rank: 16, clubName: "KIWOOM DRX", ccPoints: 950, goldMedals: 0, silverMedals: 1, bronzeMedals: 0, place: "16th Place", prize: "$300,000", trend: 0 },
  { rank: 17, clubName: "Geekay Esports", ccPoints: 850, goldMedals: 0, silverMedals: 0, bronzeMedals: 1, place: "17th Place", prize: "$275,000", trend: 0 },
  { rank: 18, clubName: "JD Gaming", ccPoints: 700, goldMedals: 0, silverMedals: 0, bronzeMedals: 1, place: "18th Place", prize: "$250,000", trend: 0 },
  { rank: 19, clubName: "ONIC", ccPoints: 700, goldMedals: 0, silverMedals: 0, bronzeMedals: 1, place: "19th Place", prize: "$225,000", trend: 0 },
  { rank: 20, clubName: "Saishunkan Sol Kumamoto", ccPoints: 700, goldMedals: 0, silverMedals: 0, bronzeMedals: 1, place: "20th Place", prize: "$200,000", trend: 0 },
  { rank: 21, clubName: "Gen.G Esports", ccPoints: 600, goldMedals: 0, silverMedals: 0, bronzeMedals: 1, place: "21st Place", prize: "$175,000", trend: 0 },
  { rank: 22, clubName: "Gentle Mates", ccPoints: 600, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, place: "22nd Place", prize: "$150,000", trend: 0 },
  { rank: 23, clubName: "FaZe Clan", ccPoints: 400, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, place: "23rd Place", prize: "$125,000", trend: 0 },
  { rank: 24, clubName: "MIBR.LOS", ccPoints: 250, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, place: "24th Place", prize: "$100,000", trend: 0 },
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
    trend: 0,
  }));
}

function buildOrganizationRankings() {
  return EWC_CLUB_RANKINGS.map((entry, index) => ({
    ...entry,
    id: `org-${index + 1}`,
  }));
}

function buildChartData(teamRankings) {
  const topTeams = teamRankings.slice(0, 3);
  const months = ["Jan", "Feb", "Mar", "Apr", "May"];
  return months.map((name, monthIndex) => {
    const row = { name };
    for (const team of topTeams) {
      const progress = (monthIndex + 1) / months.length;
      row[team.teamName] = Math.round(team.rating * (0.65 + progress * 0.35));
    }
    return row;
  });
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
    time: `${index + 1}h ago`,
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
