import { db } from "../db.js";

const TOURNAMENT_NAME = "BGMI Masters Series Season 5";

// Grand Finals FINAL standings — all 16 matches played.
// Source columns: rank, team, matches, wwcd, place(pos pts), elims(kills), total
const GF_RAW = [
  //  rank   team                     matches  wwcd  place  elims  total
  [1,  "Nebula Esports",         17,  4,  66,  116,  210],
  [2,  "Orangutan",              17,  3,  41,  117,  179],
  [3,  "Gladiators Esports",     17,  3,  52,  107,  172],
  [4,  "Team Apex Gaming",       17,  1,  40,   87,  157],
  [5,  "RAPID CHAOS ESPORTS",    17,  1,  53,   80,  153],
  [6,  "Reckoning Esports",      17,  1,  52,   78,  143],
  [7,  "Team Soul",              17,  1,  29,   79,  136],
  [8,  "GENESIS ESPORTS",        17,  0,  22,   89,  131],
  [9,  "Team Tamilas",           17,  1,  38,   70,  130],
  [10, "Revenant XSpark",        17,  1,  19,   81,  125],
  [11, "Team 8Bit",              17,  1,  18,   73,  124],
  [12, "Elite Nova Esports",     17,  0,  27,   74,  115],
  [13, "7Gods Esports",          17,  0,  25,   61,  108],
  [14, "Team OutRage",           17,  0,  22,   64,  100],
  [15, "Wyld Fangs",             17,  0,  18,   62,   88],
  [16, "MYTH OFFICIAL",          17,  0,  22,   49,   82],
];

const standings = GF_RAW.map(([rank, team, matches, wwcd, pos, elimins, points]) => ({
  placement: rank,
  team,
  fullTeam: team,
  points,
  outcome: rank === 1 ? "Champion" : "Stage result",
  matches,
  wwcd,
  pos,
  elimins,
}));

const tournament = db.prepare("SELECT * FROM tournaments WHERE name = ?").get(TOURNAMENT_NAME);
if (!tournament) { console.error("Tournament not found"); process.exit(1); }

const stages = JSON.parse(tournament.stages);
const gf = stages.find(s => s.name === "Grand Finals");
if (!gf) { console.error("Grand Finals stage not found"); process.exit(1); }

gf.standings = standings;
gf.status = "completed";

db.prepare("UPDATE tournaments SET status = ?, stages = ?, updated_date = ? WHERE id = ?").run(
  "completed",
  JSON.stringify(stages),
  new Date().toISOString(),
  tournament.id,
);
console.log(`Grand Finals updated: ${standings.length} teams.`);
console.log(`Champion: ${standings[0].team} — ${standings[0].points} pts, ${standings[0].wwcd} WWCDs, ${standings[0].elimins} elims.`);
console.log("\nFull standings:");
standings.forEach(s => console.log(`  #${s.placement} ${s.team.padEnd(25)} | M:${s.matches} WWCD:${s.wwcd} Pos:${s.pos} Elim:${s.elimins} Total:${s.points}`));
