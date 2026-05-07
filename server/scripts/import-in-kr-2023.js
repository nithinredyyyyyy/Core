import { randomUUID } from "node:crypto";
import { db, recomputeTeamStats } from "../db.js";

const now = new Date().toISOString();

const tournament = {
  name: "India - Korea Invitational",
  game: "BGMI",
  tier: "A-Tier",
  status: "completed",
  prize_pool: "₹1,00,00,000",
  start_date: "2023-10-26",
  end_date: "2023-10-28",
  max_teams: 16,
  banner_url: "/images/in-kr.png",
  description:
    "India - Korea Invitational was a BGMI invitational event featuring top teams from India and South Korea. The event ran from October 26 to October 28, 2023 and ended with Dplus KIA winning the 18-match finals.",
  format_overview:
    "The India - Korea Invitational featured 16 squad TPP teams across 3 matchdays. The field included 8 teams from Korea Pro Series Season 3 and the top 8 teams from India Series 2023, with 18 matches played across the event.",
  rules:
    "Final standings are based on finish points and position points accumulated over 18 matches, with WWCDs used as an additional headline metric in the standings table.",
  calendar: [
    { week: "Oct 26", label: "Matchday 1" },
    { week: "Oct 27", label: "Matchday 2" },
    { week: "Oct 28", label: "Matchday 3" },
  ],
  prize_breakdown: [
    { placement: "1st", team: "Dplus", inr: "4,000,000", usd: "48,034.29" },
    { placement: "2nd", team: "Gods Reign", inr: "2,000,000", usd: "24,017.14" },
    { placement: "3rd", team: "emTek StormX", inr: "1,000,000", usd: "12,008.57" },
    { placement: "4th", team: "Blind eSports", inr: "500,000", usd: "6,004.29" },
    { placement: "5th", team: "Revenant Esports", inr: "300,000", usd: "3,602.57" },
    { placement: "6th", team: "Eagle Owls", inr: "300,000", usd: "3,602.57" },
    { placement: "7th", team: "Gladiators Esports", inr: "200,000", usd: "2,401.71" },
    { placement: "8th", team: "Nongshim RedForce", inr: "200,000", usd: "2,401.71" },
    { placement: "9th", team: "TWM Gaming", inr: "150,000", usd: "1,801.29" },
    { placement: "10th", team: "Medal Esports", inr: "150,000", usd: "1,801.29" },
    { placement: "11th", team: "zz", inr: "150,000", usd: "1,801.29" },
    { placement: "12th", team: "DUKSAN Esports", inr: "150,000", usd: "1,801.29" },
    { placement: "13th", team: "ROX", inr: "100,000", usd: "1,200.86" },
    { placement: "14th", team: "BIG BROTHER ESPORTS", inr: "100,000", usd: "1,200.86" },
    { placement: "15th", team: "Maru Gaming", inr: "100,000", usd: "1,200.86" },
    { placement: "16th", team: "TeamXSpark", inr: "100,000", usd: "1,200.86" },
  ],
  awards: [
    { title: "MVP", player: "Nolbu", team: "Dplus", country: "South Korea", inr: "300,000", usd: "3,602.57" },
    { title: "Best IGL", player: "FAVIAN", team: "Dplus", country: "South Korea", inr: "200,000", usd: "2,401.71" },
  ],
  participants: [
    { placement: 1, team: "DUKSAN Esports", phase: "Korea Pro Series", players: ["JUNI", "BINI", "ZIPYAN", "Hoxy", "Qx"] },
    { placement: 2, team: "Dplus", phase: "Korea Pro Series", players: ["FAVIAN", "FOREST", "OSAL", "Nolbu", "LLLL"] },
    { placement: 3, team: "ZZ", phase: "Korea Pro Series", players: ["Cyxae", "Kay", "Y2NMON", "Chicken"] },
    { placement: 4, team: "Eagle Owls", phase: "Korea Pro Series", players: ["NOVA", "Danxy", "Junior", "SAEWOO"] },
    { placement: 5, team: "EmTek StormX", phase: "Korea Pro Series", players: ["AMEN", "Yeon", "Shun", "Clutch", "Eternal"] },
    { placement: 6, team: "NS RedForce", phase: "Korea Pro Series", players: ["TIZ1", "SPORTA", "WingS", "XZY", "Janchi"] },
    { placement: 7, team: "Maru Gaming", phase: "Korea Pro Series", players: ["Sine", "WHORU", "DDaHo", "TheShy"] },
    { placement: 8, team: "ROX", phase: "Korea Pro Series", players: ["Auto", "Ratel", "iDtt", "Timon", "Pumbaa", "KingMam"] },
    { placement: 9, team: "Gladiators Esports", phase: "India Series", players: ["Justin", "DeltaPG", "Destro", "SHOGUN"] },
    { placement: 10, team: "Big Brother Esports", phase: "India Series", players: ["Sarvit", "EzePzee", "Uzumaki", "Saif", "Rishi"] },
    { placement: 11, team: "TeamXSpark", phase: "India Series", players: ["Sarang", "Pukar", "Aditya", "ScoutOP", "DreamS"] },
    { placement: 12, team: "Blind Esports", phase: "India Series", players: ["Manya", "NakuL", "Rony", "Jokerr", "Spower", "Ayogi"] },
    { placement: 13, team: "Gods Reign", phase: "India Series", players: ["AquaNox", "NinjaJOD", "Blaze", "Robin", "Owais"] },
    { placement: 14, team: "Medal Esports", phase: "India Series", players: ["Paradox", "Topdawg", "Encore", "KyOya"] },
    { placement: 15, team: "Revenant Esports", phase: "India Series", players: ["SENSEI", "MJ", "Apollo", "Fierce"] },
    { placement: 16, team: "TWM Gaming", phase: "India Series", players: ["Ninzae", "Lobster", "DesTinY", "SAM"] },
  ],
  stages: [
    {
      name: "Grand Finals",
      order: 1,
      status: "completed",
      teamCount: 16,
      summary:
        "Oct 26th - 28th, 2023. 16 teams played across 3 matchdays and 18 matches, featuring 8 teams from Korea Pro Series Season 3 and the top 8 teams from India Series 2023.",
      standings: [
        { placement: 1, team: "DK", fullTeam: "Dplus KIA", matches: 18, wwcd: 5, pos: 125, elimins: 92, points: 217, outcome: "Champion" },
        { placement: 2, team: "GODS", fullTeam: "GODS REIGN", matches: 18, wwcd: 2, pos: 98, elimins: 73, points: 171, outcome: "Runner-up" },
        { placement: 3, team: "EMT", fullTeam: "emTek StormX", matches: 18, wwcd: 2, pos: 82, elimins: 71, points: 153, outcome: "3rd Place" },
        { placement: 4, team: "BLIND", fullTeam: "BLIND ESPORTS", matches: 18, wwcd: 1, pos: 74, elimins: 57, points: 131, outcome: "Top 4" },
        { placement: 5, team: "RNT", fullTeam: "REVENANT ESPORTS", matches: 18, wwcd: 0, pos: 59, elimins: 57, points: 116, outcome: "Top 8" },
        { placement: 6, team: "EO", fullTeam: "Eagle Owls", matches: 18, wwcd: 2, pos: 56, elimins: 51, points: 107, outcome: "Top 8" },
        { placement: 7, team: "GDR", fullTeam: "GLADIATORS ESPORTS", matches: 18, wwcd: 1, pos: 47, elimins: 53, points: 100, outcome: "Top 8" },
        { placement: 8, team: "NS", fullTeam: "NS RedForce", matches: 18, wwcd: 0, pos: 51, elimins: 49, points: 100, outcome: "Top 8" },
        { placement: 9, team: "TWM", fullTeam: "TWM GAMING", matches: 18, wwcd: 0, pos: 50, elimins: 49, points: 99, outcome: "Finalist" },
        { placement: 10, team: "MDL", fullTeam: "MEDAL ESPORTS", matches: 18, wwcd: 0, pos: 46, elimins: 53, points: 99, outcome: "Finalist" },
        { placement: 11, team: "ZZ", fullTeam: "ZZ ESPORTS", matches: 18, wwcd: 0, pos: 52, elimins: 46, points: 98, outcome: "Finalist" },
        { placement: 12, team: "DKS", fullTeam: "DUKSAN ESPORTS", matches: 18, wwcd: 0, pos: 58, elimins: 39, points: 97, outcome: "Finalist" },
        { placement: 13, team: "ROX", fullTeam: "ROX ESPORTS", matches: 18, wwcd: 1, pos: 37, elimins: 58, points: 95, outcome: "Finalist" },
        { placement: 14, team: "BB", fullTeam: "BIG BROTHER ESPORTS", matches: 18, wwcd: 1, pos: 53, elimins: 33, points: 86, outcome: "Finalist" },
        { placement: 15, team: "MARU", fullTeam: "MARU GAMING", matches: 18, wwcd: 0, pos: 25, elimins: 25, points: 50, outcome: "Finalist" },
        { placement: 16, team: "TX", fullTeam: "TEAM X SPARK", matches: 18, wwcd: 0, pos: 17, elimins: 28, points: 45, outcome: "Finalist" },
      ],
    },
  ],
};

const teams = [
  { name: "Dplus", tag: "DK", players: ["FAVIAN", "FOREST", "OSAL", "Nolbu", "LLLL"] },
  { name: "Gods Reign", tag: "GODS", players: ["AquaNox", "NinjaJOD", "Blaze", "Robin", "Owais"] },
  { name: "EmTek StormX", tag: "EMT", players: ["AMEN", "Yeon", "Shun", "Clutch", "Eternal"] },
  { name: "Blind Esports", tag: "BLIND", players: ["Manya", "NakuL", "Rony", "Jokerr", "Spower", "Ayogi"] },
  { name: "Revenant Esports", tag: "RNT", players: ["SENSEI", "MJ", "Apollo", "Fierce"] },
  { name: "Eagle Owls", tag: "EO", players: ["NOVA", "Danxy", "Junior", "SAEWOO"] },
  { name: "Gladiators Esports", tag: "GDR", players: ["Justin", "DeltaPG", "Destro", "SHOGUN"] },
  { name: "NS RedForce", tag: "NS", players: ["TIZ1", "SPORTA", "WingS", "XZY", "Janchi"] },
  { name: "TWM Gaming", tag: "TWM", players: ["Ninzae", "Lobster", "DesTinY", "SAM"] },
  { name: "Medal Esports", tag: "MDL", players: ["Paradox", "Topdawg", "Encore", "KyOya"] },
  { name: "ZZ", tag: "ZZ", players: ["Cyxae", "Kay", "Y2NMON", "Chicken"] },
  { name: "DUKSAN Esports", tag: "DKS", players: ["JUNI", "BINI", "ZIPYAN", "Hoxy", "Qx"] },
  { name: "ROX", tag: "ROX", players: ["Auto", "Ratel", "iDtt", "Timon", "Pumbaa", "KingMam"] },
  { name: "Big Brother Esports", tag: "BB", players: ["Sarvit", "EzePzee", "Uzumaki", "Saif", "Rishi"] },
  { name: "Maru Gaming", tag: "MARU", players: ["Sine", "WHORU", "DDaHo", "TheShy"] },
  { name: "TeamXSpark", tag: "TX", players: ["Sarang", "Pukar", "Aditya", "ScoutOP", "DreamS"] },
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
  "2023-10-26T13:30:00+05:30",
  "2023-10-26T14:20:00+05:30",
  "2023-10-26T15:10:00+05:30",
  "2023-10-26T16:00:00+05:30",
  "2023-10-26T16:50:00+05:30",
  "2023-10-26T17:40:00+05:30",
  "2023-10-27T13:30:00+05:30",
  "2023-10-27T14:20:00+05:30",
  "2023-10-27T15:10:00+05:30",
  "2023-10-27T16:00:00+05:30",
  "2023-10-27T16:50:00+05:30",
  "2023-10-27T17:40:00+05:30",
  "2023-10-28T13:30:00+05:30",
  "2023-10-28T14:20:00+05:30",
  "2023-10-28T15:10:00+05:30",
  "2023-10-28T16:00:00+05:30",
  "2023-10-28T16:50:00+05:30",
  "2023-10-28T17:40:00+05:30",
];

const mapRotation = ["Erangel", "Miramar", "Sanhok", "Erangel", "Miramar"];

const articles = [
  {
    title: "Dplus KIA win India - Korea Invitational 2023",
    content:
      "Dplus KIA won the India - Korea Invitational with 217 total points across 18 matches, finishing ahead of Gods Reign and emTek StormX. The event brought together top BGMI teams from India and South Korea in late October 2023.",
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
    upsertTeam.run(teamId, team.name, team.tag, null, "BGMI", team.name === "Dplus" || team.name === "EmTek StormX" || team.name === "Eagle Owls" || team.name === "NS RedForce" || team.name === "ZZ" || team.name === "DUKSAN Esports" || team.name === "ROX" || team.name === "Maru Gaming" ? "South Korea" : "India", 0, 0, 0, 0, now, now, "admin@stagecore.local");
    deletePlayersByTeam.run(teamId);
    for (const ign of team.players) {
      insertPlayer.run(randomUUID(), ign, null, teamId, "Assaulter", null, 0, 0, 0, now, now, "admin@stagecore.local");
    }
    teamIds.set(team.name, teamId);
  }

  const aliasToTeamName = new Map([
    ["Dplus KIA", "Dplus"],
    ["GODS REIGN", "Gods Reign"],
    ["emTek StormX", "EmTek StormX"],
    ["BLIND ESPORTS", "Blind Esports"],
    ["REVENANT ESPORTS", "Revenant Esports"],
    ["Eagle Owls", "Eagle Owls"],
    ["GLADIATORS ESPORTS", "Gladiators Esports"],
    ["NS RedForce", "NS RedForce"],
    ["TWM GAMING", "TWM Gaming"],
    ["MEDAL ESPORTS", "Medal Esports"],
    ["ZZ ESPORTS", "ZZ"],
    ["DUKSAN ESPORTS", "DUKSAN Esports"],
    ["ROX ESPORTS", "ROX"],
    ["BIG BROTHER ESPORTS", "Big Brother Esports"],
    ["MARU GAMING", "Maru Gaming"],
    ["TEAM X SPARK", "TeamXSpark"],
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
    "2023-10-28T16:50:00+05:30",
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

console.log("Imported India - Korea Invitational tournament, teams, schedule, standings, and article.");
