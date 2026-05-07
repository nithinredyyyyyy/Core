import { randomUUID } from "node:crypto";
import { db, recomputeTeamStats } from "../db.js";

const now = new Date().toISOString();

const tournament = {
  name: "Battlegrounds Mobile India Pro Series 2024",
  game: "BGMI",
  tier: "A-Tier",
  status: "completed",
  prize_pool: "₹2,00,00,000",
  start_date: "2024-08-20",
  end_date: "2024-09-29",
  max_teams: 128,
  banner_url: "/images/bmps-2024.png",
  description:
    "Battlegrounds Mobile India Pro Series 2024 was the third edition of BMPS, organized by KRAFTON with a total prize pool of ₹2,00,00,000 INR. The event ran from August 20 to September 29, 2024 and concluded with Team XSpark winning the 18-match Grand Finals in Kochi.",
  format_overview:
    "BMPS 2024 started with 128 teams in the League Stage and progressed through Round 1, Round 2, Round 3, Semi Finals, and an 18-match Grand Finals at Adlux International Convention Centre in Kochi.",
  rules:
    "Match scoring: 1st 10, 2nd 6, 3rd 5, 4th 4, 5th 3, 6th 2, 7th-8th 1, 9th-16th 0. Each elimination gives 1 point. Tiebreakers: total WWCDs, then placement points, then elimination points, then the best placement in the most recent match.",
  calendar: [
    { week: "Aug 20 - Sep 5", label: "Round 1" },
    { week: "Sep 7 - Sep 10", label: "Round 2" },
    { week: "Sep 11 - Sep 14", label: "Round 3" },
    { week: "Sep 15 - Sep 18", label: "Semi Finals" },
    { week: "Sep 27 - Sep 29", label: "Grand Finals" },
  ],
  prize_breakdown: [
    { placement: "1st", team: "TeamXSpark", inr: "7,500,000", usd: "89,585.88" },
    { placement: "2nd", team: "Numen Esports", inr: "3,000,000", usd: "35,834.35" },
    { placement: "3rd", team: "GodLike Esports", inr: "2,000,000", usd: "23,889.57" },
    { placement: "4th", team: "TWOB", inr: "1,250,000", usd: "14,930.98" },
    { placement: "5th", team: "Reckoning Esports", inr: "1,000,000", usd: "11,944.78" },
    { placement: "6th", team: "Orangutan", inr: "800,000", usd: "9,555.83" },
    { placement: "7th", team: "Team Limra", inr: "700,000", usd: "8,361.35" },
    { placement: "8th", team: "Team Versatile", inr: "600,000", usd: "7,166.87" },
    { placement: "9th", team: "Phoenix Esports", inr: "500,000", usd: "5,972.39" },
    { placement: "10th", team: "Team Bliss", inr: "500,000", usd: "5,972.39" },
    { placement: "11th", team: "Inferno Squad", inr: "300,000", usd: "3,583.44" },
    { placement: "12th", team: "Hyderabad Hydras", inr: "300,000", usd: "3,583.44" },
    { placement: "13th", team: "Silly Esports", inr: "200,000", usd: "2,388.96" },
    { placement: "14th", team: "Medal Esports", inr: "200,000", usd: "2,388.96" },
    { placement: "15th", team: "8Bit", inr: "200,000", usd: "2,388.96" },
    { placement: "16th", team: "Ignite Gaming", inr: "200,000", usd: "2,388.96" },
  ],
  awards: [
    { title: "MVP", player: "SPRAYGOD", team: "TeamXSpark", country: "India", inr: "400,000", usd: "4,777.91" },
    { title: "Best IGL", player: "Punkk", team: "GodLike Esports", country: "India", inr: "200,000", usd: "2,388.96" },
    { title: "Emerging Star", player: "LEGIT", team: "TWOB", country: "India", inr: "100,000", usd: "1,194.48" },
    { title: "Fan Fav", player: "Juicy", team: "8Bit", country: "India", inr: "50,000", usd: "597.24" },
    { title: "Finals MVP", player: "Sarang", team: "TeamXSpark", country: "India", inr: "-", usd: "-" },
    { title: "Finals Survivor", player: "Jokerr", team: "TeamXSpark", country: "India", inr: "-", usd: "-" },
  ],
  participants: [
    { placement: 1, team: "Numen Esports", phase: "Semi Finals", players: ["Ash", "Owais", "Mafia36", "Ninjuu", "Omega"] },
    { placement: 2, team: "TWOB", phase: "Semi Finals", players: ["Prince", "Sarvit", "Syrax", "LEGIT"] },
    { placement: 3, team: "Phoenix Esports", phase: "Semi Finals", players: ["SnowJOD", "Shayaan", "HONEY", "GOKU"] },
    { placement: 4, team: "Team Versatile", phase: "Semi Finals", players: ["Saumraj", "AquaNox", "Raiden", "Troye", "InfinityOP"] },
    { placement: 5, team: "Medal Esports", phase: "Semi Finals", players: ["Encore", "Paradox", "Topdawg", "SahilOPAF"] },
    { placement: 6, team: "Team Limra", phase: "Semi Finals", players: ["GokulWNL", "PokoWNL", "Hesperos", "DragonOP"] },
    { placement: 7, team: "Reckoning Esports", phase: "Semi Finals", players: ["IMMORTAL", "GravityJOD", "HunterZ", "ViPER", "Dionysus"] },
    { placement: 8, team: "TeamXSpark", phase: "Semi Finals", players: ["Shadow7", "SPRAYGOD", "Sarang", "Jokerr"] },
    { placement: 9, team: "Inferno Squad", phase: "Semi Finals", players: ["JatinOG", "ZereF", "PmwiIGL", "Goten", "OwenOG"] },
    { placement: 10, team: "Ignite Gaming", phase: "Semi Finals", players: ["SARKAR26", "HULK07", "Aizen", "Arora", "VermITHoR"] },
    { placement: 11, team: "GodLike Esports", phase: "Semi Finals", players: ["JONATHAN", "ADMINO", "SIMP", "Punkk"] },
    { placement: 12, team: "Orangutan", phase: "Semi Finals", players: ["AKop", "WizzGOD", "Attanki", "Aaru", "Veyron"] },
    { placement: 13, team: "Team Bliss", phase: "Semi Finals", players: ["EGGY", "Sam", "Aj", "Turbo"] },
    { placement: 14, team: "Hyderabad Hydras", phase: "Semi Finals", players: ["Moksh", "Insidious", "Crypto", "Termi"] },
    { placement: 15, team: "8Bit", phase: "Semi Finals", players: ["Juicy", "Mighty", "Mac", "Aditya", "MadMan"] },
    { placement: 16, team: "Silly Esports", phase: "Semi Finals", players: ["RanveerOG", "AKSHU", "Hydro", "INFERNO"] },
  ],
  rankings: [
    {
      title: "Overall MVP (League + Finals)",
      entries: [
        { placement: 1, player: "SPRAYGOD", team: "TeamXSpark", finishes: 98 },
        { placement: 2, player: "ADMINO", team: "GodLike Esports", finishes: 98 },
        { placement: 3, player: "DragonOP", team: "Team Limra", finishes: 97 },
        { placement: 4, player: "LEGIT", team: "TWOB", finishes: 95 },
        { placement: 5, player: "JONATHAN", team: "GodLike Esports", finishes: 94 },
      ],
    },
    {
      title: "FMVP",
      entries: [
        { placement: 1, player: "Sarang", team: "TeamXSpark", finishes: 31 },
        { placement: 2, player: "Mafia", team: "Numen Esports", finishes: 31 },
        { placement: 3, player: "Jokerr", team: "TeamXSpark", finishes: 31 },
        { placement: 4, player: "ViPER", team: "Reckoning Esports", finishes: 30 },
        { placement: 5, player: "JONATHAN", team: "GodLike Esports", finishes: 27 },
      ],
    },
  ],
  stages: [
    {
      name: "League Stage",
      order: 1,
      status: "completed",
      teamCount: 128,
      summary:
        "Aug 20th - Sept 18th, 2024. BMPS 2024 began with 128 teams and progressed through Round 1, Round 2, Round 3, and Semi Finals before locking the 16 Grand Finalists.",
    },
    {
      name: "Round 1",
      order: 2,
      status: "completed",
      teamCount: 128,
      summary:
        "Aug 20th - 27th and Aug 29th - Sept 5th, 2024. Teams were split into Red and Blue groups, each divided into 4 sub-groups of 16. After 16 matchdays and a mid-stage reshuffle, the top 64 teams advanced.",
    },
    {
      name: "Round 2",
      order: 3,
      status: "completed",
      teamCount: 64,
      summary:
        "Sept 7th - 10th, 2024. 64 teams were divided into 4 groups of 16 and each team played 6 matches. The top 48 teams overall moved on to Round 3.",
    },
    {
      name: "Round 3",
      order: 4,
      status: "completed",
      teamCount: 48,
      summary:
        "Sept 11th - 14th, 2024. 48 teams were divided into 3 groups of 16 with reshuffles after two days. Each team played 8 total matches and the top 24 overall advanced to Semi Finals.",
    },
    {
      name: "Semi Finals",
      order: 5,
      status: "completed",
      teamCount: 24,
      summary:
        "Sept 15th - 18th, 2024. 24 teams were divided into 3 groups of 8 in a double round-robin format. Each team played 16 matches and the top 16 overall qualified for the Grand Finals.",
    },
    {
      name: "Grand Finals",
      order: 6,
      status: "completed",
      teamCount: 16,
      summary:
        "Sept 27th - 29th, 2024 at Adlux International Convention Centre, Kochi. 16 teams competed across 18 matches, with Team XSpark claiming the championship on 158 total points.",
      standings: [
        { placement: 1, team: "TX", fullTeam: "Team XSpark", matches: 18, wwcd: 4, pos: 56, elimins: 102, points: 158, outcome: "Champion" },
        { placement: 2, team: "TF", fullTeam: "Team Forever", matches: 18, wwcd: 2, pos: 60, elimins: 85, points: 145, outcome: "Runner-up" },
        { placement: 3, team: "GXG", fullTeam: "Hero Xtreme Godlike", matches: 18, wwcd: 3, pos: 51, elimins: 93, points: 144, outcome: "3rd Place" },
        { placement: 4, team: "TWOB", fullTeam: "TWOB", matches: 18, wwcd: 0, pos: 42, elimins: 79, points: 121, outcome: "Top 4" },
        { placement: 5, team: "RGE", fullTeam: "iQOO RECKONING ESPORTS", matches: 18, wwcd: 2, pos: 29, elimins: 82, points: 111, outcome: "Top 8" },
        { placement: 6, team: "OG", fullTeam: "iQOO ORANGUTAN", matches: 18, wwcd: 1, pos: 34, elimins: 77, points: 111, outcome: "Top 8" },
        { placement: 7, team: "LIMRA", fullTeam: "Team Limra", matches: 18, wwcd: 0, pos: 48, elimins: 63, points: 111, outcome: "Top 8" },
        { placement: 8, team: "TV", fullTeam: "Team Versatile", matches: 18, wwcd: 1, pos: 38, elimins: 67, points: 105, outcome: "Top 8" },
        { placement: 9, team: "PHX", fullTeam: "PHOENIX ESPORTS", matches: 18, wwcd: 0, pos: 40, elimins: 62, points: 102, outcome: "Finalist" },
        { placement: 10, team: "BLISS", fullTeam: "Team Bliss", matches: 18, wwcd: 1, pos: 36, elimins: 59, points: 95, outcome: "Finalist" },
        { placement: 11, team: "INF", fullTeam: "Rising Inferno Esports", matches: 18, wwcd: 2, pos: 36, elimins: 51, points: 87, outcome: "Finalist" },
        { placement: 12, team: "HH", fullTeam: "Hyderabad Hydras", matches: 18, wwcd: 1, pos: 33, elimins: 48, points: 81, outcome: "Finalist" },
        { placement: 13, team: "SILLY", fullTeam: "Silly Esports", matches: 18, wwcd: 0, pos: 27, elimins: 50, points: 77, outcome: "Finalist" },
        { placement: 14, team: "MDL", fullTeam: "Medal Esports", matches: 18, wwcd: 1, pos: 21, elimins: 43, points: 64, outcome: "Finalist" },
        { placement: 15, team: "8BIT", fullTeam: "iQOO 8bit", matches: 18, wwcd: 0, pos: 19, elimins: 45, points: 64, outcome: "Finalist" },
        { placement: 16, team: "IGNITE", fullTeam: "Ignite Gaming", matches: 18, wwcd: 0, pos: 6, elimins: 26, points: 32, outcome: "Finalist" },
      ],
    },
  ],
};

const teams = [
  { name: "TeamXSpark", tag: "TX", players: ["Shadow7", "SPRAYGOD", "Sarang", "Jokerr"] },
  { name: "Numen Esports", tag: "TF", players: ["Ash", "Owais", "Mafia36", "Ninjuu", "Omega"] },
  { name: "GodLike Esports", tag: "GXG", players: ["JONATHAN", "ADMINO", "SIMP", "Punkk"] },
  { name: "TWOB", tag: "TWOB", players: ["Prince", "Sarvit", "Syrax", "LEGIT"] },
  { name: "Reckoning Esports", tag: "RGE", players: ["IMMORTAL", "GravityJOD", "HunterZ", "ViPER", "Dionysus"] },
  { name: "Orangutan", tag: "OG", players: ["AKop", "WizzGOD", "Attanki", "Aaru", "Veyron"] },
  { name: "Team Limra", tag: "LIMRA", players: ["GokulWNL", "PokoWNL", "Hesperos", "DragonOP"] },
  { name: "Team Versatile", tag: "TV", players: ["Saumraj", "AquaNox", "Raiden", "Troye", "InfinityOP"] },
  { name: "Phoenix Esports", tag: "PHX", players: ["SnowJOD", "Shayaan", "HONEY", "GOKU"] },
  { name: "Team Bliss", tag: "BLISS", players: ["EGGY", "Sam", "Aj", "Turbo"] },
  { name: "Inferno Squad", tag: "INF", players: ["JatinOG", "ZereF", "PmwiIGL", "Goten", "OwenOG"] },
  { name: "Hyderabad Hydras", tag: "HH", players: ["Moksh", "Insidious", "Crypto", "Termi"] },
  { name: "Silly Esports", tag: "SILLY", players: ["RanveerOG", "AKSHU", "Hydro", "INFERNO"] },
  { name: "Medal Esports", tag: "MDL", players: ["Encore", "Paradox", "Topdawg", "SahilOPAF"] },
  { name: "8Bit", tag: "8BIT", players: ["Juicy", "Mighty", "Mac", "Aditya", "MadMan"] },
  { name: "Ignite Gaming", tag: "IGNITE", players: ["SARKAR26", "HULK07", "Aizen", "Arora", "VermITHoR"] },
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
  "2024-09-27T13:30:00+05:30",
  "2024-09-27T14:20:00+05:30",
  "2024-09-27T15:10:00+05:30",
  "2024-09-27T16:00:00+05:30",
  "2024-09-27T16:50:00+05:30",
  "2024-09-27T17:40:00+05:30",
  "2024-09-28T13:30:00+05:30",
  "2024-09-28T14:20:00+05:30",
  "2024-09-28T15:10:00+05:30",
  "2024-09-28T16:00:00+05:30",
  "2024-09-28T16:50:00+05:30",
  "2024-09-28T17:40:00+05:30",
  "2024-09-29T13:30:00+05:30",
  "2024-09-29T14:20:00+05:30",
  "2024-09-29T15:10:00+05:30",
  "2024-09-29T16:00:00+05:30",
  "2024-09-29T16:50:00+05:30",
  "2024-09-29T17:40:00+05:30",
];

const mapRotation = ["Erangel", "Miramar", "Sanhok", "Erangel", "Miramar", "Erangel"];

const articles = [
  {
    title: "Team XSpark win BMPS 2024 in Kochi",
    content:
      "Team XSpark won BMPS 2024 with 158 total points in the Grand Finals, finishing ahead of Team Forever and Hero Xtreme Godlike. The event featured a ₹2 crore prize pool and concluded on September 29, 2024 in Kochi.",
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
    ["Team XSpark", "TeamXSpark"],
    ["Team Forever", "Numen Esports"],
    ["Hero Xtreme Godlike", "GodLike Esports"],
    ["TWOB", "TWOB"],
    ["iQOO RECKONING ESPORTS", "Reckoning Esports"],
    ["iQOO ORANGUTAN", "Orangutan"],
    ["Team Limra", "Team Limra"],
    ["Team Versatile", "Team Versatile"],
    ["PHOENIX ESPORTS", "Phoenix Esports"],
    ["Team Bliss", "Team Bliss"],
    ["Rising Inferno Esports", "Inferno Squad"],
    ["Hyderabad Hydras", "Hyderabad Hydras"],
    ["Silly Esports", "Silly Esports"],
    ["Medal Esports", "Medal Esports"],
    ["iQOO 8bit", "8Bit"],
    ["Ignite Gaming", "Ignite Gaming"],
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
    "2024-09-29T17:40:00+05:30",
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

console.log("Imported BMPS 2024 tournament, finalists, schedule, standings, rankings, and article.");
