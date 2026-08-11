import { randomUUID } from "node:crypto";
import { db } from "../db.js";

const now = new Date().toISOString();

const groupStageStandings = [
  [1, "Alter Ego Ares", 121, "Grand Finals"],
  [2, "4thrives Esports", 111, "Grand Finals"],
  [3, "DRX", 89, "Grand Finals"],
  [4, "Weibo Gaming", 89, "Grand Finals"],
  [5, "Alpha Gaming", 86, "Grand Finals"],
  [6, "Team Secret", 86, "Grand Finals"],
  [7, "ThunderTalk Gaming", 83, "Grand Finals"],
  [8, "IDA Esports", 83, "Grand Finals"],
  [9, "Regnum Carya Esports", 81, "Survival Stage"],
  [10, "Nongshim RedForce", 76, "Survival Stage"],
  [11, "Yangon Galacticos", 75, "Survival Stage"],
  [12, "Alpha7 Esports", 70, "Survival Stage"],
  [13, "Horaa Esports", 70, "Survival Stage"],
  [14, "POWR Esports", 63, "Survival Stage"],
  [15, "Team Aryan", 62, "Survival Stage"],
  [16, "Team Vision", 59, "Survival Stage"],
  [17, "eArena", 58, "Survival Stage"],
  [18, "INFLUENCE RAGE", 54, "Survival Stage"],
  [19, "R8 Esports", 50, "Survival Stage"],
  [20, "INTENSE GAME", 45, "Survival Stage"],
  [21, "Fire Flux Esports", 38, "Survival Stage"],
  [22, "Team Falcons", 37, "Survival Stage"],
  [23, "KINOTROPE gaming", 36, "Survival Stage"],
  [24, "Team GAMAX", 26, "Survival Stage"],
];

const survivalStageStandings = [
  [1, "Horaa Esports", 108, "Grand Finals"],
  [2, "Fire Flux Esports", 104, "Grand Finals"],
  [3, "POWR Esports", 104, "Grand Finals"],
  [4, "Regnum Carya Esports", 100, "Grand Finals"],
  [5, "eArena", 92, "Grand Finals"],
  [6, "Nongshim RedForce", 92, "Grand Finals"],
  [7, "Team Falcons", 71, "Grand Finals"],
  [8, "Yangon Galacticos", 70, "Grand Finals"],
  [9, "INFLUENCE RAGE", 69, "Eliminated"],
  [10, "R8 Esports", 55, "Eliminated"],
  [11, "Team Vision", 50, "Eliminated"],
  [12, "INTENSE GAME", 48, "Eliminated"],
  [13, "Alpha7 Esports", 45, "Eliminated"],
  [14, "Team Aryan", 37, "Eliminated"],
  [15, "KINOTROPE gaming", 30, "Eliminated"],
  [16, "Team GAMAX", 27, "Eliminated"],
];

const grandFinalsStandings = [
  [1, "Yangon Galacticos", 157, "Champion"],
  [2, "Weibo Gaming", 142, "Finalist"],
  [3, "Alpha Gaming", 141, "Finalist"],
  [4, "DRX", 117, "Finalist"],
  [5, "Regnum Carya Esports", 112, "Finalist"],
  [6, "Nongshim RedForce", 110, "Finalist"],
  [7, "4thrives Esports", 109, "Finalist"],
  [8, "Alter Ego Ares", 104, "Finalist"],
  [9, "Horaa Esports", 100, "Finalist"],
  [10, "Team Falcons", 95, "Finalist"],
  [11, "IDA Esports", 92, "Finalist"],
  [12, "POWR Esports", 89, "Finalist"],
  [13, "Team Secret", 83, "Finalist"],
  [14, "Fire Flux Esports", 82, "Finalist"],
  [15, "eArena", 57, "Finalist"],
  [16, "ThunderTalk Gaming", 54, "Finalist"],
];

function standing([placement, team, points, outcome], matches) {
  return {
    placement,
    rank: placement,
    team,
    fullTeam: team,
    matches,
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

const participants = [
  ["R8 Esports", "Group Stage"],
  ["eArena", "Group Stage"],
  ["Alter Ego Ares", "Group Stage"],
  ["Team Secret", "Group Stage"],
  ["Alpha Gaming", "Group Stage"],
  ["Horaa Esports", "Group Stage"],
  ["4thrives Esports", "Group Stage"],
  ["Team Falcons", "Group Stage"],
  ["Fire Flux Esports", "Group Stage"],
  ["IDA Esports", "Group Stage"],
  ["Regnum Carya Esports", "Group Stage"],
  ["Team Vision", "Group Stage"],
  ["POWR Esports", "Group Stage"],
  ["Team GAMAX", "Group Stage"],
  ["INTENSE GAME", "Group Stage"],
  ["INFLUENCE RAGE", "Group Stage"],
  ["Alpha7 Esports", "Group Stage"],
  ["Yangon Galacticos", "Group Stage"],
  ["Weibo Gaming", "Group Stage"],
  ["ThunderTalk Gaming", "Group Stage"],
  ["DRX", "Group Stage"],
  ["KINOTROPE gaming", "Group Stage"],
  ["Nongshim RedForce", "Group Stage"],
  ["Team Aryan", "Group Stage"],
].map(([team, phase], index) => ({
  placement: index + 1,
  team,
  phase,
  players: [],
}));

const prizeBreakdown = [
  ["1st", "Yangon Galacticos", "547,000"],
  ["2nd", "Weibo Gaming", "323,500"],
  ["3rd", "Alpha Gaming", "222,000"],
  ["4th", "DRX", "195,000"],
  ["5th", "Regnum Carya Esports", "153,000"],
  ["6th", "Nongshim RedForce", "140,000"],
  ["7th", "4thrives Esports", "157,000"],
  ["8th", "Alter Ego Ares", "150,000"],
  ["9th", "Horaa Esports", "127,500"],
  ["10th", "Team Falcons", "97,000"],
  ["11th", "IDA Esports", "118,000"],
  ["12th", "POWR Esports", "95,000"],
  ["13th", "Team Secret", "110,500"],
  ["14th", "Fire Flux Esports", "87,500"],
  ["15th", "eArena", "76,500"],
  ["16th", "ThunderTalk Gaming", "94,000"],
  ["17th", "INFLUENCE RAGE", "42,000"],
  ["18th", "R8 Esports", "40,500"],
  ["19th", "Team Vision", "41,000"],
  ["20th", "INTENSE GAME", "38,000"],
  ["21st", "Alpha7 Esports", "41,000"],
  ["22nd", "Team Aryan", "38,500"],
  ["23rd", "KINOTROPE gaming", "33,500"],
  ["24th", "Team GAMAX", "32,000"],
].map(([placement, team, usd]) => ({ placement, team, usd }));

const mapRotation = [
  { match: 1, map: "Sanhok" },
  { match: 2, map: "Erangel" },
  { match: 3, map: "Erangel" },
  { match: 4, map: "Erangel" },
  { match: 5, map: "Miramar" },
  { match: 6, map: "Miramar" },
];

const tournament = {
  name: "PUBG Mobile World Cup 2025",
  game: "PUBG Mobile",
  tier: "S-Tier",
  status: "completed",
  prize_pool: "$3,050,000",
  start_date: "2025-07-25",
  end_date: "2025-08-03",
  max_teams: 24,
  banner_url: "/images/pubg-mobile-world-cup-2024.webp",
  description:
    "PUBG Mobile World Cup 2025 was the mid-season international event of the 2025 PUBG Mobile competitive season, held offline at Qiddiya Esports Arena in Riyadh, Saudi Arabia.",
  format_overview:
    "The event featured 24 teams split into three groups. The Group Stage sent the top eight to Grand Finals and the bottom 16 to Survival Stage. The Survival Stage advanced eight more teams into an 18-match Grand Finals with Smash Rule applied on Day 3.",
  rules:
    "Squads TPP on PUBG Mobile. Group Stage and Survival Stage used 12-match progression, while Grand Finals used 18 matches across August 1-3, 2025.",
  calendar: [
    { week: "Jul 25 - Jul 27", label: "Group Stage" },
    { week: "Jul 29 - Jul 30", label: "Survival Stage" },
    { week: "Aug 1 - Aug 3", label: "Grand Finals" },
  ],
  prize_breakdown: prizeBreakdown,
  awards: [
    { title: "FMVP", player: "DOK", team: "Alpha Gaming", country: "Mongolia", usd: "50,000" },
    { title: "Best IGL", player: "Smile", team: "Yangon Galacticos", country: "Myanmar", usd: "-" },
    { title: "Grenade Master", player: "DOK", team: "Alpha Gaming", country: "Mongolia", usd: "-" },
    { title: "Field Medic", player: "DOK", team: "Alpha Gaming", country: "Mongolia", usd: "-" },
    { title: "Eagle Eye", player: "NoFear", team: "Horaa Esports", country: "Nepal", usd: "-" },
  ],
  participants,
  rankings: [
    {
      title: "Awards",
      entries: [
        { placement: 1, player: "DOK", team: "Alpha Gaming", award: "FMVP" },
        { placement: 2, player: "Smile", team: "Yangon Galacticos", award: "Best IGL" },
        { placement: 3, player: "NoFear", team: "Horaa Esports", award: "Eagle Eye" },
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
        "July 25th - 27th, 2025. 24 teams were divided into three groups of eight, with each group playing 12 matches. The top eight advanced to Grand Finals and the remaining 16 moved to Survival Stage.",
      mapRotation,
      standings: groupStageStandings.map((entry) => standing(entry, 12)),
    },
    {
      name: "Survival Stage",
      order: 2,
      status: "completed",
      teamCount: 16,
      summary:
        "July 29th - 30th, 2025. 16 teams played 12 matches, with the top eight advancing to Grand Finals and the bottom eight eliminated.",
      mapRotation,
      standings: survivalStageStandings.map((entry) => standing(entry, 12)),
    },
    {
      name: "Grand Finals",
      order: 3,
      status: "completed",
      teamCount: 16,
      summary:
        "August 1st - 3rd, 2025. 16 teams played 18 matches, with Yangon Galacticos winning the World Cup.",
      mapRotation,
      standings: grandFinalsStandings.map((entry) => standing(entry, 18)),
    },
  ],
};

const articles = [
  {
    title: "Yangon Galacticos win PUBG Mobile World Cup 2025",
    content:
      "Yangon Galacticos won PUBG Mobile World Cup 2025 in Riyadh with 157 points in the Grand Finals, finishing ahead of Weibo Gaming and Alpha Gaming. The S-Tier event featured 24 teams and a $3.05 million prize pool.",
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

console.log("Imported PUBG Mobile World Cup 2025 tournament.");
