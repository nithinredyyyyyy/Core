import { randomUUID } from "node:crypto";
import { db, recomputeTeamStats } from "../db.js";

const now = new Date().toISOString();

const tournament = {
  name: "Battlegrounds Mobile India Pro Series 2023",
  game: "BGMI",
  tier: "A-Tier",
  status: "completed",
  prize_pool: "₹1,00,00,000",
  start_date: "2023-11-22",
  end_date: "2023-12-17",
  max_teams: 96,
  banner_url: "/images/bmps-2023.png",
  description:
    "Battlegrounds Mobile India Pro Series 2023 was the flagship BGMI professional tournament series in late 2023. The event ran from November 22 to December 17, 2023 and ended with Blind Esports winning the Grand Finals.",
  format_overview:
    "BMPS 2023 featured a 96-team League Stage split into Blue and Red groups, each containing six sub-groups across three competitive weeks. The top 16 teams overall advanced to a 16-team Grand Finals played over 18 matches.",
  rules:
    "Grand Finals scoring follows standard BGMI event rules with elimination points plus placement points. The finals leaderboard shown here tracks finish points, position points, total points, and WWCDs across all 18 Grand Finals matches.",
  calendar: [
    { week: "Nov 22 - Nov 30", label: "League Week 1" },
    { week: "Dec 1 - Dec 6", label: "League Week 2" },
    { week: "Dec 7 - Dec 9", label: "League Week 3" },
    { week: "Dec 15 - Dec 17", label: "Grand Finals" },
  ],
  prize_breakdown: [
    { placement: "1st", team: "Blind eSports", inr: "4,000,000", usd: "48,168.43" },
    { placement: "2nd", team: "Gladiators Esports", inr: "2,000,000", usd: "24,084.21" },
    { placement: "3rd", team: "TEAM iNSANE", inr: "1,000,000", usd: "12,042.11" },
    { placement: "4th", team: "Entity", inr: "500,000", usd: "6,021.05" },
    { placement: "5th", team: "Team SouL", inr: "300,000", usd: "3,612.63" },
    { placement: "6th", team: "8Bit x CS Esports", inr: "300,000", usd: "3,612.63" },
    { placement: "7th", team: "GlitchXReborn", inr: "200,000", usd: "2,408.42" },
    { placement: "8th", team: "Revenant Esports", inr: "200,000", usd: "2,408.42" },
    { placement: "9th", team: "Numen Esports", inr: "150,000", usd: "1,806.32" },
    { placement: "10th", team: "Hydra", inr: "150,000", usd: "1,806.32" },
    { placement: "11th", team: "TeamXSpark", inr: "150,000", usd: "1,806.32" },
    { placement: "12th", team: "GENxFM Esports", inr: "150,000", usd: "1,806.32" },
    { placement: "13th", team: "Team Together Esports", inr: "100,000", usd: "1,204.21" },
    { placement: "14th", team: "Growing Strong", inr: "100,000", usd: "1,204.21" },
    { placement: "15th", team: "Autobotz Esports", inr: "100,000", usd: "1,204.21" },
    { placement: "16th", team: "Team Psyche", inr: "100,000", usd: "1,204.21" },
  ],
  awards: [
    { title: "MVP", player: "Spower", team: "Blind eSports", country: "India", inr: "300,000", usd: "3,612.63" },
    { title: "Best IGL", player: "Aadi", team: "TEAM iNSANE", country: "India", inr: "200,000", usd: "2,408.42" },
  ],
  participants: [
    { placement: 1, team: "TEAM iNSANE", phase: "League Stage", players: ["Aadi", "Tsunami", "Jazzyy", "Darklord", "Skipz"] },
    { placement: 2, team: "Blind eSports", phase: "League Stage", players: ["Spower", "Manya", "Rony", "NakuL", "Jokerr", "Ayogi"] },
    { placement: 3, team: "Growing Strong", phase: "League Stage", players: ["Faith", "EclipseOP", "Sparkey", "Godbott"] },
    { placement: 4, team: "Team SouL", phase: "League Stage", players: ["Goblin", "Omega", "AkshaT", "Hector", "Neyo", "Amit"] },
    { placement: 5, team: "Hydra", phase: "League Stage", players: ["DuoraOP", "SparshOP", "Spraygod", "Starboy"] },
    { placement: 6, team: "Autobotz Esports", phase: "League Stage", players: ["Seervi", "CarryOP", "Rico", "MrSpray", "Skrilzz", "Orlo", "Kilua"] },
    { placement: 7, team: "GENxFM Esports", phase: "League Stage", players: ["Insidious", "Moksh", "Madwreck", "Vishu", "Crypto", "Storm99", "Atwood"] },
    { placement: 8, team: "Team Psyche", phase: "League Stage", players: ["Vampire", "Orva", "Orzi", "Saad", "Striker", "Ravan"] },
    { placement: 9, team: "GlitchXReborn", phase: "League Stage", players: ["Roman", "Ralph", "Scuba", "Duke", "Kris"] },
    { placement: 10, team: "TeamXSpark", phase: "League Stage", players: ["Pukar", "Sarang", "DreamS", "SPRAYGOD", "ScoutOP", "Osmium"] },
    { placement: 11, team: "Team Together Esports", phase: "League Stage", players: ["ParaBTC", "SeviPlays", "Saikat09", "Krunal", "Pikachu", "Rolex"] },
    { placement: 12, team: "Revenant Esports", phase: "League Stage", players: ["SENSEI", "MJ", "Fierce", "Apollo", "SIMP"] },
    { placement: 13, team: "8Bit x CS Esports", phase: "League Stage", players: ["Juicy", "Mighty", "Sarthak", "Ronak", "LeeoYT", "Ranadip"] },
    { placement: 14, team: "Gladiators Esports", phase: "League Stage", players: ["Destro", "DeltaPG", "Justin", "SHOGUN"] },
    { placement: 15, team: "Entity Gaming", phase: "League Stage", players: ["Saumraj", "GamlaBoy", "Troye", "Gabbar", "Siuuu786", "Xypex"] },
    { placement: 16, team: "Numen Esports", phase: "League Stage", players: ["SHADOW", "ClutchGod", "GiLL", "Savitar", "Wixxky"] },
  ],
  rankings: [
    {
      title: "MVP Rankings (League + Finals)",
      entries: [
        { placement: 1, player: "Spower", team: "Blind eSports", finishes: 69 },
        { placement: 2, player: "Goblin", team: "Team SouL", finishes: 65 },
        { placement: 3, player: "Darklord", team: "TEAM iNSANE", finishes: 62 },
        { placement: 4, player: "Manya", team: "Blind eSports", finishes: 57 },
        { placement: 5, player: "NakuL", team: "Blind eSports", finishes: 57 },
      ],
    },
  ],
  stages: [
    {
      name: "League Stage",
      order: 1,
      status: "completed",
      teamCount: 96,
      summary:
        "Nov 22nd - Dec 9th, 2023. 96 teams were divided into Blue and Red groups, each featuring six sub-groups. Each sub-group played across 3 weeks with 3 matchdays per week, and the top 16 teams overall advanced to the Grand Finals.",
    },
    {
      name: "Grand Finals",
      order: 2,
      status: "completed",
      teamCount: 16,
      summary:
        "Dec 15th - 17th, 2023. 16 teams competed across 18 matches, with Blind eSports winning the title on 249 total points.",
      standings: [
        { placement: 1, team: "BLIND", fullTeam: "Blind eSports", matches: 18, wwcd: 3, pos: 128, elimins: 121, points: 249, outcome: "Champion" },
        { placement: 2, team: "GDR", fullTeam: "Gladiator Esports", matches: 18, wwcd: 3, pos: 101, elimins: 120, points: 221, outcome: "Runner-up" },
        { placement: 3, team: "INSANE", fullTeam: "Team Insane", matches: 18, wwcd: 2, pos: 83, elimins: 93, points: 176, outcome: "3rd Place" },
        { placement: 4, team: "ENTITY", fullTeam: "EntityxVST", matches: 18, wwcd: 0, pos: 103, elimins: 64, points: 167, outcome: "Top 4" },
        { placement: 5, team: "SOUL", fullTeam: "iQOO Soul", matches: 18, wwcd: 2, pos: 81, elimins: 77, points: 158, outcome: "Top 8" },
        { placement: 6, team: "8BIT", fullTeam: "8Bit x CS Esports", matches: 18, wwcd: 2, pos: 104, elimins: 36, points: 140, outcome: "Top 8" },
        { placement: 7, team: "GXR", fullTeam: "GlitchX Reborn", matches: 18, wwcd: 1, pos: 66, elimins: 68, points: 134, outcome: "Top 8" },
        { placement: 8, team: "RNT", fullTeam: "Revenant Esports", matches: 18, wwcd: 0, pos: 62, elimins: 69, points: 131, outcome: "Top 8" },
        { placement: 9, team: "NUMEN", fullTeam: "Numen Gaming", matches: 18, wwcd: 1, pos: 51, elimins: 79, points: 130, outcome: "Finalist" },
        { placement: 10, team: "HYDRA", fullTeam: "HYDRA OFFICIAL", matches: 18, wwcd: 3, pos: 69, elimins: 55, points: 124, outcome: "Finalist" },
        { placement: 11, team: "TX", fullTeam: "Team X Spark", matches: 18, wwcd: 0, pos: 56, elimins: 68, points: 124, outcome: "Finalist" },
        { placement: 12, team: "GENXFM", fullTeam: "GenxFM Esports", matches: 18, wwcd: 0, pos: 53, elimins: 51, points: 104, outcome: "Finalist" },
        { placement: 13, team: "TTE", fullTeam: "Team Together Esports", matches: 18, wwcd: 0, pos: 71, elimins: 29, points: 100, outcome: "Finalist" },
        { placement: 14, team: "GS", fullTeam: "Growing Strong", matches: 18, wwcd: 1, pos: 35, elimins: 35, points: 70, outcome: "Finalist" },
        { placement: 15, team: "AUTO", fullTeam: "Autobotz Esports", matches: 18, wwcd: 0, pos: 27, elimins: 41, points: 68, outcome: "Finalist" },
        { placement: 16, team: "PSYCHE", fullTeam: "Team Psyche", matches: 18, wwcd: 0, pos: 33, elimins: 28, points: 61, outcome: "Finalist" },
      ],
    },
  ],
};

const teams = [
  { name: "Blind eSports", tag: "BLIND", players: ["Spower", "Manya", "Rony", "NakuL", "Jokerr", "Ayogi"] },
  { name: "Gladiators Esports", tag: "GDR", players: ["Destro", "DeltaPG", "Justin", "SHOGUN"] },
  { name: "TEAM iNSANE", tag: "INSANE", players: ["Aadi", "Tsunami", "Jazzyy", "Darklord", "Skipz"] },
  { name: "Entity Gaming", tag: "ENTITY", players: ["Saumraj", "GamlaBoy", "Troye", "Gabbar", "Siuuu786", "Xypex"] },
  { name: "Team SouL", tag: "SOUL", players: ["Goblin", "Omega", "AkshaT", "Hector", "Neyo", "Amit"] },
  { name: "8Bit x CS Esports", tag: "8BIT", players: ["Juicy", "Mighty", "Sarthak", "Ronak", "LeeoYT", "Ranadip"] },
  { name: "GlitchXReborn", tag: "GXR", players: ["Roman", "Ralph", "Scuba", "Duke", "Kris"] },
  { name: "Revenant Esports", tag: "RNT", players: ["SENSEI", "MJ", "Fierce", "Apollo", "SIMP"] },
  { name: "Numen Esports", tag: "NUMEN", players: ["SHADOW", "ClutchGod", "GiLL", "Savitar", "Wixxky"] },
  { name: "Hydra", tag: "HYDRA", players: ["DuoraOP", "SparshOP", "Spraygod", "Starboy"] },
  { name: "TeamXSpark", tag: "TX", players: ["Pukar", "Sarang", "DreamS", "SPRAYGOD", "ScoutOP", "Osmium"] },
  { name: "GENxFM Esports", tag: "GENXFM", players: ["Insidious", "Moksh", "Madwreck", "Vishu", "Crypto", "Storm99", "Atwood"] },
  { name: "Team Together Esports", tag: "TTE", players: ["ParaBTC", "SeviPlays", "Saikat09", "Krunal", "Pikachu", "Rolex"] },
  { name: "Growing Strong", tag: "GS", players: ["Faith", "EclipseOP", "Sparkey", "Godbott"] },
  { name: "Autobotz Esports", tag: "AUTO", players: ["Seervi", "CarryOP", "Rico", "MrSpray", "Skrilzz", "Orlo", "Kilua"] },
  { name: "Team Psyche", tag: "PSYCHE", players: ["Vampire", "Orva", "Orzi", "Saad", "Striker", "Ravan"] },
];

const finalsStandings = tournament.stages.find((stage) => stage.name === "Grand Finals").standings.map((entry) => ({
  teamName: entry.fullTeam,
  placement: entry.placement,
  matches: entry.matches,
  wwcd: entry.wwcd,
  placementPoints: entry.pos,
  killPoints: entry.elimins,
  totalPoints: entry.points,
}));

const grandFinalSchedule = [
  "2023-12-15T13:30:00+05:30",
  "2023-12-15T14:15:00+05:30",
  "2023-12-15T15:00:00+05:30",
  "2023-12-15T15:45:00+05:30",
  "2023-12-15T16:30:00+05:30",
  "2023-12-15T17:15:00+05:30",
  "2023-12-16T13:30:00+05:30",
  "2023-12-16T14:15:00+05:30",
  "2023-12-16T15:00:00+05:30",
  "2023-12-16T15:45:00+05:30",
  "2023-12-16T16:30:00+05:30",
  "2023-12-16T17:15:00+05:30",
  "2023-12-17T13:30:00+05:30",
  "2023-12-17T14:15:00+05:30",
  "2023-12-17T15:00:00+05:30",
  "2023-12-17T15:45:00+05:30",
  "2023-12-17T16:30:00+05:30",
  "2023-12-17T17:15:00+05:30",
];

const mapRotation = ["Erangel", "Miramar", "Sanhok", "Erangel", "Miramar", "Erangel"];

const articles = [
  {
    title: "Blind eSports win BMPS 2023 Grand Finals",
    content:
      "Blind eSports won BMPS 2023 with 249 total points in the Grand Finals, finishing ahead of Gladiator Esports and Team Insane. The event featured a ₹1 crore prize pool and concluded on December 17, 2023.",
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
    upsertTeam.run(teamId, team.name, team.tag, null, "BGMI", "India", 0, 0, 0, 0, now, now, "admin@stagecore.local");
    deletePlayersByTeam.run(teamId);
    for (const ign of team.players) {
      insertPlayer.run(randomUUID(), ign, null, teamId, "Assaulter", null, 0, 0, 0, now, now, "admin@stagecore.local");
    }
    teamIds.set(team.name, teamId);
  }

  const aliasToTeamName = new Map([
    ["Blind eSports", "Blind eSports"],
    ["Gladiator Esports", "Gladiators Esports"],
    ["Team Insane", "TEAM iNSANE"],
    ["EntityxVST", "Entity Gaming"],
    ["iQOO Soul", "Team SouL"],
    ["8Bit x CS Esports", "8Bit x CS Esports"],
    ["GlitchX Reborn", "GlitchXReborn"],
    ["Revenant Esports", "Revenant Esports"],
    ["Numen Gaming", "Numen Esports"],
    ["HYDRA OFFICIAL", "Hydra"],
    ["Team X Spark", "TeamXSpark"],
    ["GenxFM Esports", "GENxFM Esports"],
    ["Team Together Esports", "Team Together Esports"],
    ["Growing Strong", "Growing Strong"],
    ["Autobotz Esports", "Autobotz Esports"],
    ["Team Psyche", "Team Psyche"],
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
    "2023-12-17T17:15:00+05:30",
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

console.log("Imported BMPS 2023 tournament, finalists, schedule, standings, and article.");
