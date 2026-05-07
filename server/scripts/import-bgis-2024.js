import { randomUUID } from "node:crypto";
import { db, recomputeTeamStats } from "../db.js";

const now = new Date().toISOString();

const tournament = {
  name: "Battlegrounds Mobile India Series 2024",
  game: "BGMI",
  tier: "A-Tier",
  status: "completed",
  prize_pool: "₹2,00,00,000",
  start_date: "2024-05-02",
  end_date: "2024-06-30",
  max_teams: 1024,
  banner_url: "/images/bgis-2024.png",
  description:
    "Battlegrounds Mobile India Series 2024 was the third edition of BGIS, organized by KRAFTON with a total prize pool of ₹2,00,00,000 INR. The event ran from May 2 to June 30, 2024 and concluded with TeamXSpark winning the Hyderabad Grand Finals.",
  format_overview:
    "BGIS 2024 began with 1024 teams from in-game qualifiers and progressed through Round 1, Round 2, Round 3, Round 4, Wildcard Entry, Semi Finals Week 1, Semi Finals Week 2, and an 18-match Grand Finals in Hyderabad.",
  rules:
    "Match scoring: 1st 10, 2nd 6, 3rd 5, 4th 4, 5th 3, 6th 2, 7th-8th 1, 9th-16th 0. Each elimination gives 1 point. Tiebreakers: total WWCDs, then placement points, then elimination points, then the best placement in the most recent match.",
  calendar: [
    { week: "May 2 - May 5", label: "Round 1" },
    { week: "May 9 - May 12", label: "Round 2" },
    { week: "May 16 - May 19", label: "Round 3" },
    { week: "May 23 - May 26", label: "Round 4" },
    { week: "May 30 - Jun 2", label: "Wildcard Entry" },
    { week: "Jun 6 - Jun 9", label: "Semi Finals Week 1" },
    { week: "Jun 13 - Jun 16", label: "Semi Finals Week 2" },
    { week: "Jun 28 - Jun 30", label: "Grand Finals" },
  ],
  prize_breakdown: [
    { placement: "1st", team: "TeamXSpark", inr: "6,000,000", usd: "71,973.21" },
    { placement: "2nd", team: "Global Esports", inr: "3,000,000", usd: "35,986.61" },
    { placement: "3rd", team: "Reckoning Esports", inr: "2,000,000", usd: "23,991.07" },
    { placement: "4th", team: "Team SouL", inr: "1,500,000", usd: "17,993.30" },
    { placement: "5th", team: "Venom Gaming", inr: "1,250,000", usd: "14,994.42" },
    { placement: "6th", team: "Team Limra", inr: "1,000,000", usd: "11,995.54" },
    { placement: "7th", team: "8Bit", inr: "900,000", usd: "10,795.98" },
    { placement: "8th", team: "Team Tamilas", inr: "800,000", usd: "9,596.43" },
    { placement: "9th", team: "Raven Esports", inr: "600,000", usd: "7,197.32" },
    { placement: "10th", team: "FS Esports", inr: "600,000", usd: "7,197.32" },
    { placement: "11th", team: "TEAM iNSANE", inr: "400,000", usd: "4,798.21" },
    { placement: "12th", team: "Team Aaru", inr: "400,000", usd: "4,798.21" },
    { placement: "13th", team: "Vasista Esports", inr: "250,000", usd: "2,998.88" },
    { placement: "14th", team: "MOGO Esports", inr: "250,000", usd: "2,998.88" },
    { placement: "15th", team: "Carnival Gaming", inr: "250,000", usd: "2,998.88" },
    { placement: "16th", team: "Inferno Squad", inr: "250,000", usd: "2,998.88" },
  ],
  awards: [
    { title: "MVP", player: "NinjaBoi", team: "Global Esports", country: "India", inr: "250,000", usd: "2,998.88" },
    { title: "Most Finishes", player: "NinjaBoi", team: "Global Esports", country: "India", inr: "100,000", usd: "1,199.55" },
    { title: "Lone Survivor", player: "Robin", team: "MOGO Esports", country: "India", inr: "100,000", usd: "1,199.55" },
    { title: "Rampage", player: "NinjaBoi", team: "Global Esports", country: "India", inr: "100,000", usd: "1,199.55" },
  ],
  participants: [
    { placement: 1, team: "Global Esports", phase: "Semi Finals 1", players: ["Mavi", "NinjaBoi", "Beast", "Slug", "Arclyn"] },
    { placement: 2, team: "Team Aaru", phase: "Semi Finals 1", players: ["Aaru", "Attanki", "Dionysus", "Veyron"] },
    { placement: 3, team: "TeamXSpark", phase: "Semi Finals 1", players: ["NinjaJOD", "SPRAYGOD", "Sarang", "Shadow7", "Osmium"] },
    { placement: 4, team: "Team Soul", phase: "Semi Finals 1", players: ["Spower", "Manya", "NakuL", "Rony", "Jokerr"] },
    { placement: 5, team: "FS Esports", phase: "Semi Finals 1", players: ["Wizard", "Tracegod", "CLUCTH", "HITMAN", "FaTe"] },
    { placement: 6, team: "Vasista Esports", phase: "Semi Finals 1", players: ["AustinX", "Siuuu786", "RageGod", "Mj", "K47"] },
    { placement: 7, team: "Team Tamilas", phase: "Semi Finals 1", players: ["MantyOP", "Maxy", "MrIGL", "FoxOP"] },
    { placement: 8, team: "Raven Esports", phase: "Semi Finals 1", players: ["AIMGOD", "HANZO", "HULK", "Reaper"] },
    { placement: 9, team: "Carnival Gaming", phase: "Semi Finals 2", players: ["Goblin", "AkshaT", "Neyo", "Omega", "Hector", "Amit"] },
    { placement: 10, team: "MOGO Esports", phase: "Semi Finals 2", players: ["Destro", "DeltaPG", "Justin", "SHOGUN", "Robin"] },
    { placement: 11, team: "Team Limra", phase: "Semi Finals 2", players: ["GokulWNL", "PokoWNL", "Hesperos", "DragonOP"] },
    { placement: 12, team: "Venom Gaming", phase: "Semi Finals 2", players: ["FurY", "VeNoM", "PHANTOM", "ALTU"] },
    { placement: 13, team: "8BIT", phase: "Semi Finals 2", players: ["Juicy", "Mighty", "Aditya", "Mac", "MadMan"] },
    { placement: 14, team: "Team iNSANE", phase: "Semi Finals 2", players: ["AFU", "ShaDow", "Evil", "SpyOp", "Kaalan"] },
    { placement: 15, team: "Reckoning Esports", phase: "Semi Finals 2", players: ["ViPER", "HunterZ", "GravityJOD", "ShikariJOD", "IMMORTAL"] },
    { placement: 16, team: "Inferno Squad", phase: "Semi Finals 2", players: ["OwenOG", "BarryOG", "OmegaOG", "Zin", "JatinOG", "ManthanOG"] },
  ],
  rankings: [
    {
      title: "Finish Rankings",
      entries: [
        { placement: 1, player: "NinjaBoi", team: "Global Esports", finishes: 37 },
        { placement: 2, player: "Sarang", team: "TeamXSpark", finishes: 29 },
        { placement: 3, player: "GokulWNL", team: "Team Limra", finishes: 29 },
        { placement: 4, player: "NinjaJOD", team: "TeamXSpark", finishes: 27 },
        { placement: 5, player: "Mighty", team: "8Bit", finishes: 27 },
      ],
    },
  ],
  stages: [
    {
      name: "Round 1",
      order: 1,
      status: "completed",
      teamCount: 1024,
      summary:
        "May 2nd - 5th, 2024. 1024 teams from in-game qualifiers were divided into 64 groups of 16. The top 7 teams from each group plus the top 32 among the remaining teams advanced, producing 480 Round 2 qualifiers.",
    },
    {
      name: "Round 2",
      order: 2,
      status: "completed",
      teamCount: 512,
      summary:
        "May 9th - 12th, 2024. 480 teams from Round 1 were joined by 32 teams ranked 33rd to 64th from The Grind. The field was split into 32 groups of 16 and 240 teams advanced to Round 3.",
    },
    {
      name: "Round 3",
      order: 3,
      status: "completed",
      teamCount: 256,
      summary:
        "May 16th - 19th, 2024. 240 teams from Round 2 and 16 teams from The Grind were divided into 16 groups of 16. The top 3 teams from each group reached Round 4 and the next best 16 teams moved to Wildcard Entry.",
    },
    {
      name: "Round 4",
      order: 4,
      status: "completed",
      teamCount: 64,
      summary:
        "May 23rd - 26th, 2024. 48 teams from Round 3 plus 16 teams from The Grind were divided into 4 groups. The top 16 teams advanced to Semi Finals Week 1 and the remaining 48 moved to Wildcard Entry.",
    },
    {
      name: "Wildcard Entry",
      order: 5,
      status: "completed",
      teamCount: 64,
      summary:
        "May 30th - June 2nd, 2024. 64 teams played four matchdays with group reshuffles after the first two days. The top 16 cumulative teams advanced to Semi Finals Week 1.",
    },
    {
      name: "Semi Finals Week 1",
      order: 6,
      status: "completed",
      teamCount: 32,
      summary:
        "June 6th - 9th, 2024. 32 teams played a round-robin format across 4 groups of 8. The top 8 teams advanced directly to the Grand Finals and the remaining 24 moved to Semi Finals Week 2.",
    },
    {
      name: "Semi Finals Week 2",
      order: 7,
      status: "completed",
      teamCount: 24,
      summary:
        "June 13th - 16th, 2024. 24 teams were divided into 3 groups of 8 and played a double round-robin format. The top 8 teams advanced to the Grand Finals.",
    },
    {
      name: "Grand Finals",
      order: 8,
      status: "completed",
      teamCount: 16,
      summary:
        "June 28th - 30th, 2024 at Hitex Exhibition Center, Hyderabad. 16 teams played 18 matches across 3 matchdays, with TeamXSpark winning the title on 142 total points.",
      standings: [
        { placement: 1, team: "TX", fullTeam: "Team XSpark", matches: 18, wwcd: 1, pos: 42, elimins: 100, points: 142, outcome: "Champion" },
        { placement: 2, team: "GE", fullTeam: "GLOBAL ESPORTS", matches: 18, wwcd: 2, pos: 41, elimins: 93, points: 134, outcome: "Runner-up" },
        { placement: 3, team: "RGE", fullTeam: "Reckoning Esports", matches: 18, wwcd: 2, pos: 61, elimins: 71, points: 132, outcome: "3rd Place" },
        { placement: 4, team: "SOUL", fullTeam: "Team SouL", matches: 18, wwcd: 2, pos: 34, elimins: 82, points: 116, outcome: "Top 4" },
        { placement: 5, team: "VENOM", fullTeam: "Venom Gaming", matches: 18, wwcd: 1, pos: 40, elimins: 76, points: 116, outcome: "Top 8" },
        { placement: 6, team: "LIMRA", fullTeam: "Team Limra", matches: 18, wwcd: 1, pos: 37, elimins: 78, points: 115, outcome: "Top 8" },
        { placement: 7, team: "8BIT", fullTeam: "8Bit", matches: 18, wwcd: 2, pos: 42, elimins: 65, points: 107, outcome: "Top 8" },
        { placement: 8, team: "TT", fullTeam: "Team Tamilas", matches: 18, wwcd: 2, pos: 53, elimins: 53, points: 106, outcome: "Top 8" },
        { placement: 9, team: "RAVEN", fullTeam: "Raven Esports", matches: 18, wwcd: 1, pos: 37, elimins: 63, points: 100, outcome: "Finalist" },
        { placement: 10, team: "FS", fullTeam: "FS eSports", matches: 18, wwcd: 1, pos: 42, elimins: 57, points: 99, outcome: "Finalist" },
        { placement: 11, team: "INSANE", fullTeam: "Team Insane", matches: 18, wwcd: 0, pos: 38, elimins: 58, points: 96, outcome: "Finalist" },
        { placement: 12, team: "AARU", fullTeam: "TEAM AARU", matches: 18, wwcd: 0, pos: 31, elimins: 62, points: 93, outcome: "Finalist" },
        { placement: 13, team: "VST", fullTeam: "Vasista Esports", matches: 18, wwcd: 2, pos: 45, elimins: 44, points: 89, outcome: "Finalist" },
        { placement: 14, team: "MOGO", fullTeam: "MOGO ESPORTS", matches: 18, wwcd: 0, pos: 19, elimins: 60, points: 79, outcome: "Finalist" },
        { placement: 15, team: "CG", fullTeam: "CARNIVAL GAMING", matches: 18, wwcd: 0, pos: 21, elimins: 44, points: 65, outcome: "Finalist" },
        { placement: 16, team: "INFERNO", fullTeam: "Inferno Squad", matches: 18, wwcd: 0, pos: 2, elimins: 23, points: 25, outcome: "Finalist" },
      ],
    },
  ],
};

const teams = [
  { name: "TeamXSpark", tag: "TX", players: ["NinjaJOD", "SPRAYGOD", "Sarang", "Shadow7", "Osmium"] },
  { name: "Global Esports", tag: "GE", players: ["Mavi", "NinjaBoi", "Beast", "Slug", "Arclyn"] },
  { name: "Reckoning Esports", tag: "RGE", players: ["ViPER", "HunterZ", "GravityJOD", "ShikariJOD", "IMMORTAL"] },
  { name: "Team Soul", tag: "SOUL", players: ["Spower", "Manya", "NakuL", "Rony", "Jokerr"] },
  { name: "Venom Gaming", tag: "VENOM", players: ["FurY", "VeNoM", "PHANTOM", "ALTU"] },
  { name: "Team Limra", tag: "LIMRA", players: ["GokulWNL", "PokoWNL", "Hesperos", "DragonOP"] },
  { name: "8BIT", tag: "8BIT", players: ["Juicy", "Mighty", "Aditya", "Mac", "MadMan"] },
  { name: "Team Tamilas", tag: "TT", players: ["MantyOP", "Maxy", "MrIGL", "FoxOP"] },
  { name: "Raven Esports", tag: "RAVEN", players: ["AIMGOD", "HANZO", "HULK", "Reaper"] },
  { name: "FS Esports", tag: "FS", players: ["Wizard", "Tracegod", "CLUCTH", "HITMAN", "FaTe"] },
  { name: "Team iNSANE", tag: "INSANE", players: ["AFU", "ShaDow", "Evil", "SpyOp", "Kaalan"] },
  { name: "Team Aaru", tag: "AARU", players: ["Aaru", "Attanki", "Dionysus", "Veyron"] },
  { name: "Vasista Esports", tag: "VST", players: ["AustinX", "Siuuu786", "RageGod", "Mj", "K47"] },
  { name: "MOGO Esports", tag: "MOGO", players: ["Destro", "DeltaPG", "Justin", "SHOGUN", "Robin"] },
  { name: "Carnival Gaming", tag: "CG", players: ["Goblin", "AkshaT", "Neyo", "Omega", "Hector", "Amit"] },
  { name: "Inferno Squad", tag: "INFERNO", players: ["OwenOG", "BarryOG", "OmegaOG", "Zin", "JatinOG", "ManthanOG"] },
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
  "2024-06-28T13:30:00+05:30",
  "2024-06-28T14:20:00+05:30",
  "2024-06-28T15:10:00+05:30",
  "2024-06-28T16:00:00+05:30",
  "2024-06-28T16:50:00+05:30",
  "2024-06-28T17:40:00+05:30",
  "2024-06-29T13:30:00+05:30",
  "2024-06-29T14:20:00+05:30",
  "2024-06-29T15:10:00+05:30",
  "2024-06-29T16:00:00+05:30",
  "2024-06-29T16:50:00+05:30",
  "2024-06-29T17:40:00+05:30",
  "2024-06-30T13:30:00+05:30",
  "2024-06-30T14:20:00+05:30",
  "2024-06-30T15:10:00+05:30",
  "2024-06-30T16:00:00+05:30",
  "2024-06-30T16:50:00+05:30",
  "2024-06-30T17:40:00+05:30",
];

const mapRotation = ["Erangel", "Miramar", "Sanhok", "Vikendi", "Miramar", "Erangel"];

const articles = [
  {
    title: "TeamXSpark win BGIS 2024 in Hyderabad",
    content:
      "TeamXSpark won BGIS 2024 with 142 total points in the Grand Finals, finishing ahead of Global Esports and Reckoning Esports. The event featured a ₹2 crore prize pool and concluded at Hitex Exhibition Center in Hyderabad.",
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
    ["iQOO Revenant XSpark", "TeamXSpark"],
    ["GLOBAL ESPORTS", "Global Esports"],
    ["iQOO RECKONING ESPORTS", "Reckoning Esports"],
    ["iQOO Soul", "Team Soul"],
    ["Venom Gaming", "Venom Gaming"],
    ["Team Limra", "Team Limra"],
    ["iQOO 8bit", "8BIT"],
    ["iQOO Team Tamilas", "Team Tamilas"],
    ["Raven Esports", "Raven Esports"],
    ["FS eSports", "FS Esports"],
    ["Team Insane", "Team iNSANE"],
    ["TEAM AARU", "Team Aaru"],
    ["Vasista Esports", "Vasista Esports"],
    ["MOGO ESPORTS", "MOGO Esports"],
    ["CARNIVAL GAMING", "Carnival Gaming"],
    ["Rising Inferno Esports", "Inferno Squad"],
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
    "2024-06-30T17:40:00+05:30",
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

console.log("Imported BGIS 2024 tournament, finalists, schedule, standings, rankings, and article.");
