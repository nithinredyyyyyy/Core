import { randomUUID } from "node:crypto";
import { db, recomputeTeamStats } from "../db.js";

const now = new Date().toISOString();

const tournament = {
  name: "Battlegrounds Mobile India International Cup 2025",
  game: "BGMI",
  tier: "A-Tier",
  status: "completed",
  prize_pool: "₹1,00,00,000",
  start_date: "2025-10-31",
  end_date: "2025-11-02",
  max_teams: 16,
  banner_url: "/images/bmic-2025.png",
  description:
    "Battlegrounds Mobile India International Cup 2025 was the first edition of BMIC, organized by KRAFTON with a ₹1,00,00,000 prize pool. The event brought together teams from India, South Korea, and Japan, and concluded with DRX winning the title and qualifying for PMGC 2025: The Gauntlet.",
  format_overview:
    "BMIC 2025 featured 16 teams: 8 from India's 2025 BMSD, 4 from South Korea's 2025 PMPS S2, and 4 from Japan's 2025 PMJL P2. The tournament was played over 18 matches across 3 matchdays.",
  rules:
    "Match scoring: 1st 10, 2nd 6, 3rd 5, 4th 4, 5th 3, 6th 2, 7th-8th 1, 9th-16th 0. Each finish gives 1 point. Tiebreakers: total WWCDs, then placement points, then elimination points, then the best placement in the most recent match. The champion qualified for PMGC 2025: The Gauntlet and the runner-up qualified for PMGC 2025 Group Stage.",
  calendar: [
    { week: "Oct 31", label: "Matchday 1" },
    { week: "Nov 1", label: "Matchday 2" },
    { week: "Nov 2", label: "Matchday 3" },
  ],
  prize_breakdown: [
    { placement: "1st", team: "DRX", inr: "3,000,000", usd: "33,793.22" },
    { placement: "2nd", team: "True Rippers", inr: "1,500,000", usd: "16,896.61" },
    { placement: "3rd", team: "CAG OSAKA", inr: "1,000,000", usd: "11,264.41" },
    { placement: "4th", team: "Nebula Esports", inr: "750,000", usd: "8,448.31" },
    { placement: "5th", team: "Nongshim RedForce", inr: "625,000", usd: "7,040.25" },
    { placement: "6th", team: "Dplus", inr: "450,000", usd: "5,068.98" },
    { placement: "7th", team: "MYSTERIOUS 4", inr: "375,000", usd: "4,224.15" },
    { placement: "8th", team: "K9 Esports", inr: "375,000", usd: "4,224.15" },
    { placement: "9th", team: "Team SouL", inr: "250,000", usd: "2,816.10" },
    { placement: "10th", team: "Orangutan", inr: "250,000", usd: "2,816.10" },
    { placement: "11th", team: "Jecheon Phalanx", inr: "200,000", usd: "2,252.88" },
    { placement: "12th", team: "REIGNITE", inr: "200,000", usd: "2,252.88" },
    { placement: "13th", team: "Madkings Esports", inr: "150,000", usd: "1,689.66" },
    { placement: "14th", team: "MAKING THE ROAD", inr: "150,000", usd: "1,689.66" },
    { placement: "15th", team: "Gods Reign", inr: "125,000", usd: "1,408.05" },
    { placement: "16th", team: "REJECT", inr: "125,000", usd: "1,408.05" },
  ],
  awards: [
    { title: "MVP", player: "HYUNBIN", team: "DRX", country: "South Korea", inr: "250,000", usd: "2,816.10" },
    { title: "Best IGL", player: "Qx", team: "DRX", country: "South Korea", inr: "125,000", usd: "1,408.05" },
    { title: "Best Clutch", player: "HEROO", team: "MYSTERIOUS 4", country: "India", inr: "100,000", usd: "1,126.44" },
  ],
  participants: [
    { placement: 1, team: "Orangutan", phase: "India Showdown", players: ["Aaru", "AKop", "WizzGOD", "Attanki"] },
    { placement: 2, team: "K9 Esports", phase: "India Showdown", players: ["Omega", "NinjaBoi", "Slug", "Beast"] },
    { placement: 3, team: "Team SouL", phase: "India Showdown", players: ["NakuL", "Goblin", "LEGIT", "Jokerr", "Thunder"] },
    { placement: 4, team: "True Rippers", phase: "India Showdown", players: ["Jelly", "KioLmao", "Harsh", "Hydro"] },
    { placement: 5, team: "Nebula Esports", phase: "India Showdown", players: ["Aadi", "KRATOS", "Phoenix", "KnowMe", "Ryu"] },
    { placement: 6, team: "Gods Reign", phase: "India Showdown", players: ["Destro", "Justin", "DeltaPG", "Neyo"] },
    { placement: 7, team: "MYSTERIOUS 4", phase: "India Showdown", players: ["Omega", "Bunny", "HEROO", "SnowJOD", "NAMAN"] },
    { placement: 8, team: "Madkings Esports", phase: "India Showdown", players: ["SHADOW", "ClutchGod", "Apollo", "PRO", "FRAGGER"] },
    { placement: 9, team: "Dplus", phase: "Pro Series Korea", players: ["chpz", "OSAL", "FAVIAN", "Nolbu", "FOREST"] },
    { placement: 10, team: "Nongshim RedForce", phase: "Pro Series Korea", players: ["DokC", "BINI", "XZY", "TIZ1"] },
    { placement: 11, team: "Jecheon Phalanx", phase: "Pro Series Korea", players: ["SPORTA", "SIxTa", "Hollywood", "Crazy"] },
    { placement: 12, team: "DRX", phase: "Pro Series Korea", players: ["Cyxae", "HYUNBIN", "Qx", "SOEZ"] },
    { placement: 13, team: "REJECT", phase: "Japan League", players: ["Apollo", "ReijiOcO", "Duelo", "Devine", "SaRa"] },
    { placement: 14, team: "REIGNITE", phase: "Japan League", players: ["Nagon", "TTP", "YamaK", "miz"] },
    { placement: 15, team: "MAKING THE ROAD", phase: "Japan League", players: ["ItsuQ", "REX", "Aibo", "PINE"] },
    { placement: 16, team: "CAG OSAKA", phase: "Japan League", players: ["Garnet", "Sheep", "Naoto", "Mattun"] },
  ],
  rankings: [
    {
      title: "Tournament MVP",
      columns: [
        { key: "points", label: "Points" },
        { key: "finishes", label: "Finishes" },
        { key: "damage", label: "Damage" },
        { key: "survivalTime", label: "Survival Time" },
        { key: "knocks", label: "Knocks" },
      ],
      entries: [
        { placement: 1, player: "HYUNBIN", team: "DRX", points: 318, finishes: 44, damage: 8157, survivalTime: "21:22", knocks: 46 },
        { placement: 2, player: "Hydro", team: "True Rippers", points: 261, finishes: 38, damage: 6253, survivalTime: "18:41", knocks: 33 },
        { placement: 3, player: "Nolbu", team: "Dplus", points: 256, finishes: 33, damage: 7092, survivalTime: "19:15", knocks: 36 },
        { placement: 4, player: "HEROO", team: "MYSTERIOUS 4", points: 227, finishes: 31, damage: 5921, survivalTime: "18:21", knocks: 27 },
        { placement: 5, player: "Qx", team: "DRX", points: 219, finishes: 29, damage: 5870, survivalTime: "19:59", knocks: 23 },
      ],
    },
    {
      title: "Best IGL",
      entries: [
        { placement: 1, player: "Qx", team: "DRX", rating: 1.3, avgPoints: 9.22, wwcd: 3, top5s: 8, teamSurvival: "20:58" },
        { placement: 2, player: "Garnet", team: "CAG OSAKA", rating: 1.12, avgPoints: 7.56, wwcd: 2, top5s: 6, teamSurvival: "18:30" },
        { placement: 3, player: "Jelly", team: "True Rippers", rating: 1.1, avgPoints: 7.61, wwcd: 1, top5s: 9, teamSurvival: "20:00" },
        { placement: 4, player: "NakuL", team: "Team SouL", rating: 0.91, avgPoints: 6.17, wwcd: 1, top5s: 5, teamSurvival: "18:46" },
        { placement: 5, player: "Aadi", team: "Nebula Esports", rating: 0.9, avgPoints: 7.06, wwcd: 1, top5s: 6, teamSurvival: "20:23" },
      ],
    },
  ],
  stages: [
    {
      name: "Grand Finals",
      order: 1,
      status: "completed",
      teamCount: 16,
      summary:
        "October 31st - November 2nd, 2025. 16 teams from India, South Korea, and Japan competed across 18 matches, with DRX winning the title and the direct PMGC 2025: The Gauntlet slot.",
      standings: [
        { placement: 1, team: "DRX", fullTeam: "DRX", matches: 18, wwcd: 3, pos: 55, elimins: 111, points: 166, outcome: "Champion" },
        { placement: 2, team: "TR", fullTeam: "Infinix TrueRippers", matches: 18, wwcd: 1, pos: 48, elimins: 89, points: 137, outcome: "Runner-up" },
        { placement: 3, team: "CAG", fullTeam: "CAG OSAKA", matches: 18, wwcd: 2, pos: 50, elimins: 86, points: 136, outcome: "3rd Place" },
        { placement: 4, team: "NBLA", fullTeam: "NEBULA ESPORTS", matches: 18, wwcd: 1, pos: 41, elimins: 86, points: 127, outcome: "Top 4" },
        { placement: 5, team: "NS", fullTeam: "Nongshim RedForce", matches: 18, wwcd: 1, pos: 37, elimins: 86, points: 123, outcome: "Top 8" },
        { placement: 6, team: "DK", fullTeam: "Dplus KIA", matches: 18, wwcd: 2, pos: 40, elimins: 82, points: 122, outcome: "Top 8" },
        { placement: 7, team: "M4", fullTeam: "mysterious4 Esports", matches: 18, wwcd: 2, pos: 40, elimins: 78, points: 118, outcome: "Top 8" },
        { placement: 8, team: "K9", fullTeam: "K9 Esports", matches: 18, wwcd: 0, pos: 29, elimins: 83, points: 112, outcome: "Top 8" },
        { placement: 9, team: "SOUL", fullTeam: "iQOO SOUL", matches: 18, wwcd: 1, pos: 32, elimins: 79, points: 111, outcome: "Finalist" },
        { placement: 10, team: "OG", fullTeam: "iQOO ORANGUTAN", matches: 18, wwcd: 1, pos: 38, elimins: 65, points: 103, outcome: "Finalist" },
        { placement: 11, team: "JPX", fullTeam: "Jecheon PhalanX", matches: 18, wwcd: 1, pos: 33, elimins: 52, points: 85, outcome: "Finalist" },
        { placement: 12, team: "RGT", fullTeam: "REIGNITE", matches: 18, wwcd: 0, pos: 30, elimins: 54, points: 84, outcome: "Finalist" },
        { placement: 13, team: "MAD", fullTeam: "Madkings", matches: 18, wwcd: 2, pos: 30, elimins: 53, points: 83, outcome: "Finalist" },
        { placement: 14, team: "MTR", fullTeam: "MAKING THE ROAD", matches: 18, wwcd: 1, pos: 30, elimins: 45, points: 75, outcome: "Finalist" },
        { placement: 15, team: "GDR", fullTeam: "OnePlus Gods Reign", matches: 18, wwcd: 0, pos: 23, elimins: 52, points: 75, outcome: "Finalist" },
        { placement: 16, team: "RJ", fullTeam: "REJECT", matches: 18, wwcd: 0, pos: 20, elimins: 55, points: 75, outcome: "Finalist" },
      ],
    },
  ],
};

const teams = [
  { name: "Orangutan", tag: "OG", players: ["Aaru", "AKop", "WizzGOD", "Attanki"] },
  { name: "K9 Esports", tag: "K9", players: ["Omega", "NinjaBoi", "Slug", "Beast"] },
  { name: "Team SouL", tag: "SOUL", players: ["NakuL", "Goblin", "LEGIT", "Jokerr", "Thunder"] },
  { name: "True Rippers", tag: "TR", players: ["Jelly", "KioLmao", "Harsh", "Hydro"] },
  { name: "Nebula Esports", tag: "NBLA", players: ["Aadi", "KRATOS", "Phoenix", "KnowMe", "Ryu"] },
  { name: "Gods Reign", tag: "GDR", players: ["Destro", "Justin", "DeltaPG", "Neyo"] },
  { name: "MYSTERIOUS 4", tag: "M4", players: ["Omega", "Bunny", "HEROO", "SnowJOD", "NAMAN"] },
  { name: "Madkings Esports", tag: "MAD", players: ["SHADOW", "ClutchGod", "Apollo", "PRO", "FRAGGER"] },
  { name: "Dplus", tag: "DK", players: ["chpz", "OSAL", "FAVIAN", "Nolbu", "FOREST"] },
  { name: "Nongshim RedForce", tag: "NS", players: ["DokC", "BINI", "XZY", "TIZ1"] },
  { name: "Jecheon Phalanx", tag: "JPX", players: ["SPORTA", "SIxTa", "Hollywood", "Crazy"] },
  { name: "DRX", tag: "DRX", players: ["Cyxae", "HYUNBIN", "Qx", "SOEZ"] },
  { name: "REJECT", tag: "RJ", players: ["Apollo", "ReijiOcO", "Duelo", "Devine", "SaRa"] },
  { name: "REIGNITE", tag: "RGT", players: ["Nagon", "TTP", "YamaK", "miz"] },
  { name: "MAKING THE ROAD", tag: "MTR", players: ["ItsuQ", "REX", "Aibo", "PINE"] },
  { name: "CAG OSAKA", tag: "CAG", players: ["Garnet", "Sheep", "Naoto", "Mattun"] },
];

const finalsStandings = tournament.stages[0].standings.map((entry) => ({
  teamName: entry.fullTeam,
  placement: entry.placement,
  matches: entry.matches,
  wwcd: entry.wwcd,
  placementPoints: entry.pos,
  killPoints: entry.elimins,
  totalPoints: entry.points,
}));

const grandFinalSchedule = [
  "2025-10-31T15:30:00+05:30",
  "2025-10-31T16:15:00+05:30",
  "2025-10-31T17:00:00+05:30",
  "2025-10-31T17:40:00+05:30",
  "2025-10-31T18:20:00+05:30",
  "2025-10-31T19:05:00+05:30",
  "2025-11-01T15:30:00+05:30",
  "2025-11-01T16:15:00+05:30",
  "2025-11-01T17:00:00+05:30",
  "2025-11-01T17:40:00+05:30",
  "2025-11-01T18:20:00+05:30",
  "2025-11-01T19:05:00+05:30",
  "2025-11-02T15:30:00+05:30",
  "2025-11-02T16:15:00+05:30",
  "2025-11-02T17:00:00+05:30",
  "2025-11-02T17:40:00+05:30",
  "2025-11-02T18:20:00+05:30",
  "2025-11-02T19:05:00+05:30",
];

const mapRotation = ["Rondo", "Erangel", "Erangel", "Erangel", "Miramar", "Miramar"];

const articles = [
  {
    title: "DRX win the inaugural BMIC 2025",
    content:
      "DRX won BMIC 2025 with 166 total points in the Grand Finals, finishing ahead of True Rippers and CAG OSAKA. The title secured PMGC 2025: The Gauntlet qualification, while runner-up True Rippers advanced to PMGC 2025 Group Stage.",
    category: "tournament",
    game: "BGMI",
    featured: 1,
  },
];

const tx = db.transaction(() => {
  const existingTournament = db.prepare("SELECT id FROM tournaments WHERE name = ?").get(tournament.name);
  if (existingTournament) {
    db.prepare("DELETE FROM match_results WHERE tournament_id = ?").run(existingTournament.id);
    db.prepare("DELETE FROM matches WHERE tournament_id = ?").run(existingTournament.id);
    db.prepare("DELETE FROM tournaments WHERE id = ?").run(existingTournament.id);
  }

  const tournamentId = randomUUID();
  db.prepare(`
    INSERT INTO tournaments (
      id, name, game, tier, status, prize_pool, start_date, end_date, stages,
      description, banner_url, rules, max_teams, format_overview, calendar, prize_breakdown, awards, participants, rankings,
      created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tournamentId,
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
    "admin@stagecore.local"
  );

  const findTeamByName = db.prepare("SELECT id FROM teams WHERE name = ?");
  const upsertTeam = db.prepare(`
    INSERT INTO teams (
      id, name, tag, logo_url, game, region, total_kills, total_points, matches_played, wins, created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      tag=excluded.tag,
      game=excluded.game,
      region=excluded.region,
      updated_date=excluded.updated_date
  `);
  const deletePlayersByTeam = db.prepare("DELETE FROM players WHERE team_id = ?");
  const insertPlayer = db.prepare(`
    INSERT INTO players (
      id, ign, real_name, team_id, role, photo_url, total_kills, matches_played, avg_damage,
      created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const teamIds = new Map();
  for (const team of teams) {
    const existing = findTeamByName.get(team.name);
    const teamId = existing?.id || randomUUID();
    upsertTeam.run(teamId, team.name, team.tag, null, "BGMI", "International", 0, 0, 0, 0, now, now, "admin@stagecore.local");
    deletePlayersByTeam.run(teamId);
    for (const ign of team.players) {
      insertPlayer.run(randomUUID(), ign, null, teamId, "Assaulter", null, 0, 0, 0, now, now, "admin@stagecore.local");
    }
    teamIds.set(team.name, teamId);
  }

  const aliasToTeamName = new Map([
    ["DRX", "DRX"],
    ["Infinix TrueRippers", "True Rippers"],
    ["CAG OSAKA", "CAG OSAKA"],
    ["NEBULA ESPORTS", "Nebula Esports"],
    ["Nongshim RedForce", "Nongshim RedForce"],
    ["Dplus KIA", "Dplus"],
    ["mysterious4 Esports", "MYSTERIOUS 4"],
    ["K9 Esports", "K9 Esports"],
    ["iQOO SOUL", "Team SouL"],
    ["iQOO ORANGUTAN", "Orangutan"],
    ["Jecheon PhalanX", "Jecheon Phalanx"],
    ["REIGNITE", "REIGNITE"],
    ["Madkings", "Madkings Esports"],
    ["MAKING THE ROAD", "MAKING THE ROAD"],
    ["OnePlus Gods Reign", "Gods Reign"],
    ["REJECT", "REJECT"],
  ]);

  const insertMatch = db.prepare(`
    INSERT INTO matches (
      id, tournament_id, stage, match_number, map, status, scheduled_time, stream_url, day, created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  grandFinalSchedule.forEach((scheduledTime, index) => {
    insertMatch.run(
      randomUUID(),
      tournamentId,
      "Grand Finals",
      index + 1,
      mapRotation[index % mapRotation.length],
      "completed",
      scheduledTime,
      null,
      Math.floor(index / 6) + 1,
      now,
      now,
      "admin@stagecore.local"
    );
  });

  const standingsMatchId = randomUUID();
  insertMatch.run(
    standingsMatchId,
    tournamentId,
    "Grand Finals Standings",
    0,
    "Other",
    "completed",
    "2025-11-02T19:05:00+05:30",
    null,
    3,
    now,
    now,
    "admin@stagecore.local"
  );

  const insertResult = db.prepare(`
    INSERT INTO match_results (
      id, match_id, tournament_id, team_id, placement, kill_points, placement_points, total_points, matches_count, wins_count, stage,
      created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const standing of finalsStandings) {
    const canonicalName = aliasToTeamName.get(standing.teamName);
    const teamId = canonicalName ? teamIds.get(canonicalName) : null;
    if (!teamId) continue;
    insertResult.run(
      randomUUID(),
      standingsMatchId,
      tournamentId,
      teamId,
      standing.placement,
      standing.killPoints,
      standing.placementPoints,
      standing.totalPoints,
      standing.matches,
      standing.wwcd,
      "Grand Finals",
      now,
      now,
      "admin@stagecore.local"
    );
  }

  const deleteArticle = db.prepare("DELETE FROM news_articles WHERE title = ?");
  const insertArticle = db.prepare(`
    INSERT INTO news_articles (
      id, title, content, category, thumbnail_url, featured, game, created_date, updated_date, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const article of articles) {
    deleteArticle.run(article.title);
    insertArticle.run(randomUUID(), article.title, article.content, article.category, null, article.featured, article.game, now, now, "admin@stagecore.local");
  }

  recomputeTeamStats();
});

tx();

console.log("Imported BMIC 2025 tournament, participants, schedule, standings, rankings, and article.");
