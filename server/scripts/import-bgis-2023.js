import { randomUUID } from "node:crypto";
import { db, recomputeTeamStats } from "../db.js";

const now = new Date().toISOString();

const tournament = {
  name: "Battlegrounds Mobile India Series 2023",
  game: "BGMI",
  tier: "A-Tier",
  status: "completed",
  prize_pool: "₹2,00,00,000",
  start_date: "2023-08-31",
  end_date: "2023-10-15",
  max_teams: 2048,
  banner_url: "/images/bgis-2023.png",
  description:
    "Battlegrounds Mobile India Series 2023 was the second edition of BGIS, organized by KRAFTON with a total prize pool of ₹2,00,00,000 INR. The event ran from August 31 to October 15, 2023 and concluded with Gladiators Esports winning the Mumbai Grand Finals.",
  format_overview:
    "BGIS 2023 started with 2048 in-game qualifier teams and progressed through Round 1, Round 2, Round 3, Quarter Finals, Losers Bracket, Semi Finals, and a 16-team Grand Finals played across three matchdays in Mumbai.",
  rules:
    "Match scoring: 1st 15, 2nd 12, 3rd 10, 4th 8, 5th 6, 6th 4, 7th 2, 8th-12th 1, 13th-16th 0. Each elimination gives 1 point. Tiebreakers: total WWCDs, then placement points, then elimination points, then the best placement ranking in the most recent match.",
  calendar: [
    { week: "Aug 31 - Sep 3", label: "Round 1" },
    { week: "Sep 7 - Sep 10", label: "Round 2" },
    { week: "Sep 14 - Sep 17", label: "Round 3" },
    { week: "Sep 21 - Sep 24", label: "Quarter Finals" },
    { week: "Sep 28 - Oct 1", label: "Losers Bracket" },
    { week: "Oct 4 - Oct 7", label: "Semi Finals" },
    { week: "Oct 12 - Oct 15", label: "Grand Finals" },
  ],
  prize_breakdown: [
    { placement: "1st", team: "Gladiators Esports", inr: "7,500,000", usd: "90,139.08" },
    { placement: "2nd", team: "BIG BROTHER ESPORTS", inr: "3,750,000", usd: "45,069.54" },
    { placement: "3rd", team: "TeamXSpark", inr: "2,500,000", usd: "30,046.36" },
    { placement: "4th", team: "Blind eSports", inr: "1,250,000", usd: "15,023.18" },
    { placement: "5th", team: "Gods Reign", inr: "1,000,000", usd: "12,018.54" },
    { placement: "6th", team: "Medal Esports", inr: "800,000", usd: "9,614.84" },
    { placement: "7th", team: "Revenant Esports", inr: "600,000", usd: "7,211.13" },
    { placement: "8th", team: "TWM Gaming", inr: "400,000", usd: "4,807.42" },
    { placement: "9th", team: "OREsports", inr: "200,000", usd: "2,403.71" },
    { placement: "10th", team: "Midwave Esports", inr: "200,000", usd: "2,403.71" },
    { placement: "11th", team: "GlitchXReborn", inr: "200,000", usd: "2,403.71" },
    { placement: "12th", team: "MICI Esports", inr: "200,000", usd: "2,403.71" },
    { placement: "13th", team: "Growing Strong", inr: "100,000", usd: "1,201.85" },
    { placement: "14th", team: "4 Aggressive Man", inr: "100,000", usd: "1,201.85" },
    { placement: "15th", team: "Night Owls", inr: "100,000", usd: "1,201.85" },
    { placement: "16th", team: "CS Esports", inr: "100,000", usd: "1,201.85" },
  ],
  awards: [
    { title: "MVP", player: "DeltaPG", team: "Gladiators Esports", country: "India", inr: "400,000", usd: "4,807.42" },
    { title: "FMVP", player: "Saif", team: "BIG BROTHER ESPORTS", country: "India", inr: "200,000", usd: "2,403.71" },
    { title: "Rising Star", player: "Duke", team: "GlitchXReborn", country: "India", inr: "200,000", usd: "2,403.71" },
    { title: "Best IGL", player: "Manya", team: "Blind eSports", country: "India", inr: "200,000", usd: "2,403.71" },
  ],
  participants: [
    { placement: 1, team: "Medal Esports", phase: "Semi Finals", players: ["Paradox", "Topdawg", "Encore", "KyOya"] },
    { placement: 2, team: "Revenant Esports", phase: "Semi Finals", players: ["SENSEI", "MJ", "Apollo", "Fierce"] },
    { placement: 3, team: "Gladiators Esports", phase: "Semi Finals", players: ["Justin", "DeltaPG", "Destro", "SHOGUN"] },
    { placement: 4, team: "GlitchXReborn", phase: "Semi Finals", players: ["Roman", "Ralph", "Dexter", "Duke", "Kris"] },
    { placement: 5, team: "CS Esports", phase: "Semi Finals", players: ["Sarthak", "LeeoYT", "ParaBTC", "Ranadip"] },
    { placement: 6, team: "MICI Esports", phase: "Semi Finals", players: ["Mudit", "Sanchit", "Kunal", "Sorya"] },
    { placement: 7, team: "Gods Reign", phase: "Semi Finals", players: ["AquaNox", "NinjaJOD", "Blaze", "Robin", "Joyboy"] },
    { placement: 8, team: "Midwave Esports", phase: "Semi Finals", players: ["Aaru", "Attanki", "Wixxky", "Dionysus"] },
    { placement: 9, team: "Growing Strong", phase: "Semi Finals", players: ["Ace", "Faith", "EclipseOP", "Sparkey", "Godbott"] },
    { placement: 10, team: "TeamXSpark", phase: "Semi Finals", players: ["Sarang", "Pukar", "Aditya", "ScoutOP", "DreamS"] },
    { placement: 11, team: "OREsports", phase: "Semi Finals", players: ["Jelly", "MAX", "Mac", "ADMINO"] },
    { placement: 12, team: "TWM Gaming", phase: "Semi Finals", players: ["Ninzae", "Lobster", "DesTinY", "SAM"] },
    { placement: 13, team: "Blind eSports", phase: "Semi Finals", players: ["Manya", "NakuL", "Rony", "Jokerr", "Ayogi"] },
    { placement: 14, team: "BIG BROTHER ESPORTS", phase: "Semi Finals", players: ["Sarvit", "EzePzee", "Uzumaki", "Saif", "Rishi"] },
    { placement: 15, team: "4 Aggressive Man", phase: "Semi Finals", players: ["KingKO", "SpiderJOD", "Skillfull", "KAR4N", "P4SSWORD", "Commando"] },
    { placement: 16, team: "Night Owls", phase: "Semi Finals", players: ["ROXY", "CLEO", "DRACO", "KIRA", "DREAM"] },
  ],
  stages: [
    {
      name: "Round 1",
      order: 1,
      status: "completed",
      teamCount: 2048,
      summary:
        "Aug 31st - Sep 3rd, 2023. 2048 in-game qualifier teams were split into 128 groups of 16. The top 3 teams from each group plus 96 high-ranked teams advanced, producing 480 qualified teams for Round 2.",
    },
    {
      name: "Round 2",
      order: 2,
      status: "completed",
      teamCount: 512,
      summary:
        "Sep 7th - 10th, 2023. 480 teams from Round 1 were joined by the bottom 32 teams from The Grind Week 5. The 512 teams were split into 32 groups of 16, and the top 7 from each group advanced for a total of 224 Round 3 slots.",
    },
    {
      name: "Round 3",
      order: 3,
      status: "completed",
      teamCount: 256,
      summary:
        "Sep 14th - 17th, 2023. 224 teams from Round 2 plus the top 32 teams from The Grind Week 5 were divided into 16 groups. The top 4 from each group reached Quarter Finals, while teams ranked 65th to 80th entered the Losers Bracket.",
    },
    {
      name: "Quarter Finals",
      order: 4,
      status: "completed",
      teamCount: 64,
      summary:
        "Sep 21st - 24th, 2023. 64 Round 3 teams were divided into 4 groups. The top 4 from each group advanced directly to Semi Finals and the remaining 48 moved to the Losers Bracket.",
    },
    {
      name: "Losers Bracket",
      order: 5,
      status: "completed",
      teamCount: 64,
      summary:
        "Sep 28th - Oct 1st, 2023. 16 teams from Round 3 and 48 teams from Quarter Finals were split across 4 groups of 16. The top 4 from each group advanced to Semi Finals.",
    },
    {
      name: "Semi Finals",
      order: 6,
      status: "completed",
      teamCount: 32,
      summary:
        "Oct 4th - 7th, 2023. 32 teams played a round-robin format across 4 groups of 8. The top 16 teams advanced to the Grand Finals.",
    },
    {
      name: "Grand Finals",
      order: 7,
      status: "completed",
      teamCount: 16,
      summary:
        "Oct 12th - 13th and 15th, 2023 at Sardar Vallabhbhai Patel Indoor Stadium, Mumbai. 16 finalists played 18 matches across 3 matchdays, with Gladiators Esports winning the title on 200 points.",
      standings: [
        { placement: 1, team: "GDR", fullTeam: "Gladiator Esports", matches: 18, wwcd: 0, pos: 96, elimins: 104, points: 200, outcome: "Champion" },
        { placement: 2, team: "BB", fullTeam: "Big Brother Esports", matches: 18, wwcd: 3, pos: 87, elimins: 104, points: 191, outcome: "Runner-up" },
        { placement: 3, team: "TX", fullTeam: "Team X Spark", matches: 18, wwcd: 3, pos: 85, elimins: 88, points: 173, outcome: "3rd Place" },
        { placement: 4, team: "Blind", fullTeam: "Blind Esports", matches: 18, wwcd: 3, pos: 92, elimins: 72, points: 164, outcome: "Top 4" },
        { placement: 5, team: "Gods", fullTeam: "Gods Reign", matches: 18, wwcd: 2, pos: 86, elimins: 78, points: 164, outcome: "Top 8" },
        { placement: 6, team: "MDL", fullTeam: "Medal Esports", matches: 18, wwcd: 1, pos: 75, elimins: 88, points: 163, outcome: "Top 8" },
        { placement: 7, team: "RNT", fullTeam: "Revenant Esports", matches: 18, wwcd: 1, pos: 91, elimins: 70, points: 161, outcome: "Top 8" },
        { placement: 8, team: "TWM", fullTeam: "TWM Gaming", matches: 18, wwcd: 1, pos: 85, elimins: 70, points: 155, outcome: "Top 8" },
        { placement: 9, team: "OR", fullTeam: "OR Esports", matches: 18, wwcd: 1, pos: 79, elimins: 55, points: 134, outcome: "Finalist" },
        { placement: 10, team: "ME", fullTeam: "Midwave Esports", matches: 18, wwcd: 2, pos: 63, elimins: 65, points: 128, outcome: "Finalist" },
        { placement: 11, team: "GXR", fullTeam: "GlitchXReborn", matches: 18, wwcd: 0, pos: 62, elimins: 61, points: 123, outcome: "Finalist" },
        { placement: 12, team: "MICI", fullTeam: "MICI Esports", matches: 18, wwcd: 0, pos: 42, elimins: 54, points: 96, outcome: "Finalist" },
        { placement: 13, team: "GS", fullTeam: "Growing Strong", matches: 18, wwcd: 1, pos: 41, elimins: 51, points: 92, outcome: "Finalist" },
        { placement: 14, team: "4AM", fullTeam: "4 Aggressive Man", matches: 18, wwcd: 0, pos: 50, elimins: 38, points: 88, outcome: "Finalist" },
        { placement: 15, team: "NO", fullTeam: "Night Owls", matches: 18, wwcd: 0, pos: 33, elimins: 25, points: 58, outcome: "Finalist" },
        { placement: 16, team: "CS", fullTeam: "CS Esports x One Power", matches: 18, wwcd: 0, pos: 27, elimins: 28, points: 55, outcome: "Finalist" },
      ],
    },
  ],
};

const teams = [
  { name: "Medal Esports", tag: "MDL", players: ["Paradox", "Topdawg", "Encore", "KyOya"] },
  { name: "Revenant Esports", tag: "RNT", players: ["SENSEI", "MJ", "Apollo", "Fierce"] },
  { name: "Gladiators Esports", tag: "GDR", players: ["Justin", "DeltaPG", "Destro", "SHOGUN"] },
  { name: "GlitchXReborn", tag: "GXR", players: ["Roman", "Ralph", "Dexter", "Duke", "Kris"] },
  { name: "CS Esports", tag: "CS", players: ["Sarthak", "LeeoYT", "ParaBTC", "Ranadip"] },
  { name: "MICI Esports", tag: "MICI", players: ["Mudit", "Sanchit", "Kunal", "Sorya"] },
  { name: "Gods Reign", tag: "GODS", players: ["AquaNox", "NinjaJOD", "Blaze", "Robin", "Joyboy"] },
  { name: "Midwave Esports", tag: "ME", players: ["Aaru", "Attanki", "Wixxky", "Dionysus"] },
  { name: "Growing Strong", tag: "GS", players: ["Ace", "Faith", "EclipseOP", "Sparkey", "Godbott"] },
  { name: "TeamXSpark", tag: "TX", players: ["Sarang", "Pukar", "Aditya", "ScoutOP", "DreamS"] },
  { name: "OREsports", tag: "OR", players: ["Jelly", "MAX", "Mac", "ADMINO"] },
  { name: "TWM Gaming", tag: "TWM", players: ["Ninzae", "Lobster", "DesTinY", "SAM"] },
  { name: "Blind eSports", tag: "BLIND", players: ["Manya", "NakuL", "Rony", "Jokerr", "Ayogi"] },
  { name: "BIG BROTHER ESPORTS", tag: "BB", players: ["Sarvit", "EzePzee", "Uzumaki", "Saif", "Rishi"] },
  { name: "4 Aggressive Man", tag: "4AM", players: ["KingKO", "SpiderJOD", "Skillfull", "KAR4N", "P4SSWORD", "Commando"] },
  { name: "Night Owls", tag: "NO", players: ["ROXY", "CLEO", "DRACO", "KIRA", "DREAM"] },
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
  "2023-10-12T13:30:00+05:30",
  "2023-10-12T14:15:00+05:30",
  "2023-10-12T15:00:00+05:30",
  "2023-10-12T15:45:00+05:30",
  "2023-10-12T16:30:00+05:30",
  "2023-10-12T17:15:00+05:30",
  "2023-10-13T13:30:00+05:30",
  "2023-10-13T14:15:00+05:30",
  "2023-10-13T15:00:00+05:30",
  "2023-10-13T15:45:00+05:30",
  "2023-10-13T16:30:00+05:30",
  "2023-10-13T17:15:00+05:30",
  "2023-10-15T13:30:00+05:30",
  "2023-10-15T14:15:00+05:30",
  "2023-10-15T15:00:00+05:30",
  "2023-10-15T15:45:00+05:30",
  "2023-10-15T16:30:00+05:30",
  "2023-10-15T17:15:00+05:30",
];

const mapRotation = ["Erangel", "Miramar", "Sanhok", "Erangel", "Miramar", "Erangel"];

const articles = [
  {
    title: "Gladiators Esports win BGIS 2023 in Mumbai",
    content:
      "Gladiators Esports lifted the BGIS 2023 title with 200 points in the Grand Finals, finishing ahead of BIG BROTHER ESPORTS and TeamXSpark. The event featured a ₹2 crore prize pool and ended at Sardar Vallabhbhai Patel Indoor Stadium in Mumbai.",
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
    JSON.stringify([]),
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
    "2023-10-15T17:15:00+05:30",
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
    const teamId = teamIds.get(standing.teamName);
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

console.log("Imported BGIS 2023 tournament, finalists, schedule, standings, and article.");
