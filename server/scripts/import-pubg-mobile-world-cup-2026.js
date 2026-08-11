import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import {
  PMWC_2026_PARTICIPANTS as participants,
  PMWC_2026_PRIZE_BREAKDOWN as prizeBreakdown,
} from "../tournamentOverrides.js";

const now = new Date().toISOString();

const groupStageStandings = [];

const survivalStageStandings = [];

const grandFinalsStandings = [];

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

const mapRotation = [
  { match: 1, map: "Rondo" },
  { match: 2, map: "Erangel" },
  { match: 3, map: "Erangel" },
  { match: 4, map: "Erangel" },
  { match: 5, map: "Miramar" },
  { match: 6, map: "Miramar" },
];

const tournament = {
  name: "PUBG Mobile World Cup 2026",
  game: "PUBG Mobile",
  tier: "S-Tier",
  status: "upcoming",
  prize_pool: "$3,025,000",
  start_date: "2026-08-06",
  end_date: "2026-08-16",
  max_teams: 32,
  banner_url: "/images/pubg-mobile-world-cup-2026.webp",
  description:
    "PUBG Mobile World Cup 2026 is the mid-season international event of the 2026 PUBG Mobile competitive season. Originally planned for Riyadh, Saudi Arabia, the event was moved to Paris, France on May 20, 2026.",
  format_overview:
    "32 teams compete across three stages: Group Stage (August 6-9), Survival Stage (August 11-12), and Grand Finals (August 14-16). The Group Stage features 2 groups of 16 teams playing 12 matches each. Top 5 from each group advance to Grand Finals, while 6th-13th advance to Survival Stage. Survival Stage features 16 teams in 12 matches, with top 6 advancing to Grand Finals. Grand Finals features 16 teams in up to 18 matches with Smash Rule on Day 3.",
  rules:
    "Squads TPP on PUBG Mobile. Group Stage and Survival Stage use 12-match progression. Grand Finals uses up to 18 matches (6 per day) with Smash Rule applied on Day 3.",
  calendar: [
    { week: "Aug 6 - Aug 9", label: "Group Stage" },
    { week: "Aug 11 - Aug 12", label: "Survival Stage" },
    { week: "Aug 14 - Aug 16", label: "Grand Finals" },
  ],
  prize_breakdown: prizeBreakdown,
  awards: [
    { title: "FMVP", player: "TBD", team: "TBD", usd: "25,000" },
  ],
  participants,
  rankings: [],
  stages: [
    {
      name: "Group Stage",
      order: 1,
      status: "upcoming",
      teamCount: 32,
      summary:
        "August 6th - 9th, 2026. 32 teams divided into 2 groups of 16. Each group plays 12 matches. Top 5 teams from each group advance to Grand Finals. Teams placed 6th-13th advance to Survival Stage. Bottom 3 teams from each group are eliminated.",
      mapRotation,
      standings: groupStageStandings.map((entry) => standing(entry, 12)),
    },
    {
      name: "Survival Stage",
      order: 2,
      status: "upcoming",
      teamCount: 16,
      summary:
        "August 11th - 12th, 2026. 16 teams play 12 matches. Top 6 teams advance to Grand Finals. Bottom 10 teams are eliminated.",
      mapRotation,
      standings: survivalStageStandings.map((entry) => standing(entry, 12)),
    },
    {
      name: "Grand Finals",
      order: 3,
      status: "upcoming",
      teamCount: 16,
      summary:
        "August 14th - 16th, 2026. 16 teams compete across up to 18 matches (6 each day). Smash Rule is applied on Day 3. The champion receives $500,000 from the $1.7M Grand Finals prize pool.",
      mapRotation,
      standings: grandFinalsStandings.map((entry) => standing(entry, 18)),
    },
  ],
};

const articles = [
  {
    title: "PUBG Mobile World Cup 2026 moved to Paris",
    content:
      "PUBG Mobile World Cup 2026, originally planned to be hosted in Riyadh, Saudi Arabia, has been moved to Paris, France on May 20, 2026. The mid-season international event will feature 32 teams competing for a $3.025 million prize pool from August 6-16.",
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

console.log("Imported PUBG Mobile World Cup 2026 tournament.");
