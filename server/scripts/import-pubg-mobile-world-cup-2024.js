import { randomUUID } from "node:crypto";
import { db } from "../db.js";

const now = new Date().toISOString();

const groupStageStandings = [
  [1, "Yoodo Alliance", 3, 43, 79, 122, "Main Tournament"],
  [2, "Tianba", 0, 29, 77, 106, "Main Tournament"],
  [3, "4Merical Vibes", 2, 29, 65, 94, "Main Tournament"],
  [4, "Team Liquid", 2, 37, 54, 91, "Main Tournament"],
  [5, "Alpha7 Esports", 1, 34, 57, 91, "Main Tournament"],
  [6, "Al Ula x IHC", 1, 30, 54, 84, "Main Tournament"],
  [7, "D'Xavier", 1, 39, 43, 82, "Main Tournament"],
  [8, "Talon Esports", 0, 21, 59, 80, "Main Tournament"],
  [9, "POWR Esports", 2, 33, 46, 79, "Main Tournament"],
  [10, "BOOM Esports", 1, 25, 51, 76, "Main Tournament"],
  [11, "Vampire Esports", 0, 28, 42, 70, "Main Tournament"],
  [12, "REJECT", 0, 20, 49, 69, "Main Tournament"],
  [13, "iNCO Gaming", 1, 28, 38, 66, "Survival Stage"],
  [14, "Dplus", 1, 14, 49, 63, "Survival Stage"],
  [15, "Falcons Force", 0, 15, 45, 60, "Survival Stage"],
  [16, "MadBulls", 0, 22, 38, 60, "Survival Stage"],
  [17, "Tong Jia Bao Esports", 1, 24, 32, 56, "Survival Stage"],
  [18, "Besiktas Black", 1, 30, 25, 55, "Survival Stage"],
  [19, "Brute Force", 0, 21, 32, 53, "Survival Stage"],
  [20, "Money Makers", 1, 14, 37, 51, "Survival Stage"],
  [21, "Harame Bro", 0, 13, 29, 42, "Survival Stage"],
  [22, "IW NRX", 0, 10, 32, 42, "Survival Stage"],
  [23, "CAG OSAKA", 0, 12, 19, 31, "Survival Stage"],
  [24, "DRX", 0, 5, 18, 23, "Survival Stage"],
];

const survivalStageStandings = [
  [1, "IW NRX", 2, 48, 74, 122, "Main Tournament"],
  [2, "DRX", 3, 41, 52, 93, "Main Tournament"],
  [3, "Tong Jia Bao Esports", 1, 33, 48, 81, "Main Tournament"],
  [4, "Twisted Minds", 1, 32, 48, 80, "Main Tournament"],
  [5, "Falcons Force", 1, 21, 56, 77, "Eliminated"],
  [6, "Dplus", 0, 21, 55, 76, "Eliminated"],
  [7, "Brute Force", 0, 26, 48, 74, "Eliminated"],
  [8, "Money Makers", 0, 22, 51, 73, "Eliminated"],
  [9, "Team Pandum", 1, 19, 53, 72, "Eliminated"],
  [10, "CAG OSAKA", 2, 28, 43, 71, "Eliminated"],
  [11, "MadBulls", 0, 17, 50, 67, "Eliminated"],
  [12, "Harame Bro", 1, 20, 29, 49, "Eliminated"],
  [13, "Besiktas Black", 0, 20, 25, 45, "Eliminated"],
  [14, "RUKH Esports", 0, 9, 33, 42, "Eliminated"],
  [15, "Team Spirit", 0, 12, 27, 39, "Eliminated"],
  [16, "iNCO Gaming", 0, 15, 23, 38, "Eliminated"],
];

const mainTournamentStandings = [
  [1, "Alpha7 Esports", 153, "Champion"],
  [2, "REJECT", 124, "Finalist"],
  [3, "Tianba", 124, "Finalist"],
  [4, "DRX", 111, "Finalist"],
  [5, "BOOM Esports", 108, "Finalist"],
  [6, "Talon Esports", 106, "Finalist"],
  [7, "Vampire Esports", 104, "Finalist"],
  [8, "Team Liquid", 101, "Finalist"],
  [9, "D'Xavier", 97, "Finalist"],
  [10, "Tong Jia Bao Esports", 94, "Finalist"],
  [11, "Al Ula x IHC", 93, "Finalist"],
  [12, "4Merical Vibes", 90, "Finalist"],
  [13, "Twisted Minds", 88, "Finalist"],
  [14, "IW NRX", 85, "Finalist"],
  [15, "Yoodo Alliance", 82, "Finalist"],
  [16, "POWR Esports", 65, "Finalist"],
];

function toStanding([placement, team, wwcd, pos, elimins, points, outcome]) {
  return {
    placement,
    rank: placement,
    team,
    fullTeam: team,
    matches: 12,
    wwcd,
    pos,
    place: pos,
    elimins,
    elims: elimins,
    points,
    pts: points,
    outcome,
  };
}

function toFinalStanding([placement, team, points, outcome]) {
  return {
    placement,
    rank: placement,
    team,
    fullTeam: team,
    matches: 18,
    wwcd: "",
    pos: "",
    place: "",
    elimins: "",
    elims: "",
    points,
    pts: points,
    outcome,
  };
}

const groupStageTeams = [
  ["BOOM Esports", "Group Yellow"],
  ["D'Xavier", "Group Red"],
  ["Yoodo Alliance", "Group Red"],
  ["Talon Esports", "Group Green"],
  ["4Merical Vibes", "Group Red"],
  ["Falcons Force", "Group Green"],
  ["MadBulls", "Group Green"],
  ["Al Ula x IHC", "Group Green"],
  ["Brute Force", "Group Red"],
  ["IW NRX", "Group Yellow"],
  ["Besiktas Black", "Group Red"],
  ["Money Makers", "Group Yellow"],
  ["Team Liquid", "Group Green"],
  ["Alpha7 Esports", "Group Yellow"],
  ["iNCO Gaming", "Group Yellow"],
  ["Harame Bro", "Group Green"],
  ["REJECT", "Group Red"],
  ["CAG OSAKA", "Group Yellow"],
  ["DRX", "Group Yellow"],
  ["Dplus", "Group Red"],
  ["Tianba", "Group Red"],
  ["Tong Jia Bao Esports", "Group Green"],
  ["POWR Esports", "Group Yellow"],
  ["Vampire Esports", "Group Green"],
];

const survivalInviteTeams = [
  ["Team Pandum", "Survival Stage"],
  ["RUKH Esports", "Survival Stage"],
  ["Team Spirit", "Survival Stage"],
  ["Twisted Minds", "Survival Stage"],
];

const prizeBreakdown = [
  ["1st", "Alpha7 Esports", "467,312.50"],
  ["2nd", "REJECT", "259,312.50"],
  ["3rd", "Tianba", "212,312.50"],
  ["4th", "DRX", "162,312.50"],
  ["5th", "BOOM Esports", "151,312.50"],
  ["6th", "Talon Esports", "143,312.50"],
  ["7th", "Vampire Esports", "135,312.50"],
  ["8th", "Team Liquid", "133,812.50"],
  ["9th", "D'Xavier", "124,312.50"],
  ["10th", "Tong Jia Bao Esports", "110,312.50"],
  ["11th", "Al Ula x IHC", "115,812.50"],
  ["12th", "4Merical Vibes", "115,312.50"],
  ["13th", "Twisted Minds", "71,312.50"],
  ["14th", "IW NRX", "88,812.50"],
  ["15th", "Yoodo Alliance", "105,312.50"],
  ["16th", "POWR Esports", "87,312.50"],
  ["17th", "Falcons Force", "49,500"],
  ["18th", "Dplus", "50,000"],
  ["19th", "Brute Force", "47,000"],
  ["20th", "Money Makers", "46,000"],
  ["21st", "Team Pandum", "23,500"],
  ["22nd", "CAG OSAKA", "43,500"],
  ["23rd", "MadBulls", "47,000"],
  ["24th", "Harame Bro", "43,500"],
  ["25th", "Besiktas Black", "44,500"],
  ["26th", "RUKH Esports", "21,000"],
  ["27th", "Team Spirit", "20,500"],
  ["28th", "iNCO Gaming", "45,500"],
].map(([placement, team, usd]) => ({ placement, team, usd }));

const tournament = {
  name: "PUBG Mobile World Cup 2024",
  game: "PUBG Mobile",
  tier: "S-Tier",
  status: "completed",
  prize_pool: "$3,050,000",
  start_date: "2024-07-19",
  end_date: "2024-07-28",
  max_teams: 28,
  banner_url: "/images/pubg-mobile-world-cup-2024.png",
  description:
    "PUBG Mobile World Cup 2024 was the mid-season international event of the 2024 PUBG Mobile competitive season, held offline at Boulevard Riyadh City in Riyadh, Saudi Arabia.",
  format_overview:
    "The event featured 28 teams. A 24-team Group Stage sent the top 12 to the Main Tournament and the bottom 12 to Survival Stage, where four wildcard teams joined and the top four advanced. The 16-team Main Tournament ran across 18 matches.",
  rules:
    "Squads TPP on PUBG Mobile. The champion granted its region an extra qualifying spot at PUBG Mobile Global Championship 2024.",
  calendar: [
    { week: "Jul 19 - Jul 21", label: "Group Stage" },
    { week: "Jul 23 - Jul 24", label: "Survival Stage" },
    { week: "Jul 26 - Jul 28", label: "Main Tournament" },
  ],
  prize_breakdown: prizeBreakdown,
  awards: [
    { title: "MVP", player: "Reiji", team: "REJECT", country: "Japan", usd: "50,000" },
    { title: "Gunslinger", player: "Mafioso", team: "Alpha7 Esports", country: "Brazil", usd: "-" },
    { title: "Grenade Master", player: "Revo", team: "Alpha7 Esports", country: "Brazil", usd: "-" },
    { title: "Field Medic", player: "Frentzy", team: "BOOM Esports", country: "Indonesia", usd: "-" },
  ],
  participants: [...groupStageTeams, ...survivalInviteTeams].map(
    ([team, phase], index) => ({
      placement: index + 1,
      team,
      phase,
      players: [],
    }),
  ),
  rankings: [
    {
      title: "Dream Squad",
      entries: [
        { placement: 1, player: "Reiji", team: "REJECT", country: "Japan" },
        { placement: 2, player: "Qzz", team: "Tianba", country: "China" },
        { placement: 3, player: "Mafioso", team: "Alpha7 Esports", country: "Brazil" },
        { placement: 4, player: "Revo", team: "Alpha7 Esports", country: "Brazil" },
      ],
    },
  ],
  stages: [
    {
      name: "Group Stage",
      order: 1,
      status: "completed",
      teamCount: 24,
      summary:
        "July 19th - 21st, 2024. 24 teams played 18 total matches with each group playing 12 matches. The top 12 advanced to Main Tournament and the bottom 12 moved to Survival Stage.",
      mapRotation: [
        { match: 1, map: "Sanhok" },
        { match: 2, map: "Erangel" },
        { match: 3, map: "Erangel" },
        { match: 4, map: "Erangel" },
        { match: 5, map: "Miramar" },
        { match: 6, map: "Miramar" },
      ],
      standings: groupStageStandings.map(toStanding),
    },
    {
      name: "Survival Stage",
      order: 2,
      status: "completed",
      teamCount: 16,
      summary:
        "July 23rd - 24th, 2024. The bottom 12 teams from Group Stage were joined by four PMSL wildcard teams. The top four advanced to Main Tournament.",
      mapRotation: [
        { match: 1, map: "Sanhok" },
        { match: 2, map: "Erangel" },
        { match: 3, map: "Erangel" },
        { match: 4, map: "Erangel" },
        { match: 5, map: "Miramar" },
        { match: 6, map: "Miramar" },
      ],
      standings: survivalStageStandings.map(toStanding),
    },
    {
      name: "Main Tournament",
      order: 3,
      status: "completed",
      teamCount: 16,
      summary:
        "July 26th - 28th, 2024. 16 teams played 18 matches across three matchdays, with Alpha7 Esports winning the World Cup.",
      mapRotation: [
        { match: 1, map: "Sanhok" },
        { match: 2, map: "Erangel" },
        { match: 3, map: "Erangel" },
        { match: 4, map: "Erangel" },
        { match: 5, map: "Miramar" },
        { match: 6, map: "Miramar" },
      ],
      standings: mainTournamentStandings.map(toFinalStanding),
    },
  ],
};

const articles = [
  {
    title: "Alpha7 Esports win PUBG Mobile World Cup 2024",
    content:
      "Alpha7 Esports won PUBG Mobile World Cup 2024 in Riyadh with 153 points in the Main Tournament, ahead of REJECT and Tianba. The S-Tier event featured 28 teams and a $3.05 million prize pool.",
    category: "tournament",
    game: "PUBG Mobile",
    featured: 0,
  },
];

const tx = db.transaction(() => {
  const existingTournament = db
    .prepare("SELECT id FROM tournaments WHERE name = ?")
    .get(tournament.name);
  if (existingTournament) {
    db.prepare("DELETE FROM match_results WHERE tournament_id = ?").run(
      existingTournament.id,
    );
    db.prepare("DELETE FROM matches WHERE tournament_id = ?").run(
      existingTournament.id,
    );
    db.prepare("DELETE FROM tournaments WHERE id = ?").run(
      existingTournament.id,
    );
  }

  db.prepare(
    `
    INSERT INTO tournaments (
      id, name, game, tier, status, prize_pool, start_date, end_date, stages,
      description, banner_url, rules, max_teams, format_overview, calendar,
      prize_breakdown, awards, participants, rankings, created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    randomUUID(),
    tournament.name,
    tournament.game,
    tournament.tier,
    tournament.status,
    tournament.prize_pool,
    tournament.start_date,
    tournament.end_date,
    JSON.stringify(tournament.stages),
    tournament.description,
    tournament.banner_url,
    tournament.rules,
    tournament.max_teams,
    tournament.format_overview,
    JSON.stringify(tournament.calendar),
    JSON.stringify(tournament.prize_breakdown),
    JSON.stringify(tournament.awards),
    JSON.stringify(tournament.participants),
    JSON.stringify(tournament.rankings),
    now,
    now,
    "admin@stagecore.local",
  );

  const deleteArticle = db.prepare("DELETE FROM news_articles WHERE title = ?");
  const insertArticle = db.prepare(`
    INSERT INTO news_articles (
      id, title, content, category, thumbnail_url, featured, game, created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const article of articles) {
    deleteArticle.run(article.title);
    insertArticle.run(
      randomUUID(),
      article.title,
      article.content,
      article.category,
      tournament.banner_url,
      article.featured,
      article.game,
      now,
      now,
      "admin@stagecore.local",
    );
  }
});

tx();

console.log("Imported PUBG Mobile World Cup 2024 tournament.");
