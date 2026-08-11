import { db } from "../db.js";

const TOURNAMENT_NAME = "Battlegrounds Mobile India Pro Series 2026";
const now = new Date().toISOString();

const stmtGet = db.prepare("SELECT * FROM tournaments WHERE name = ?");
const tournament = stmtGet.get(TOURNAMENT_NAME);

if (!tournament) {
  console.error(`Tournament "${TOURNAMENT_NAME}" not found`);
  process.exit(1);
}

const stages = typeof tournament.stages === "string" ? JSON.parse(tournament.stages) : tournament.stages;
const gfStageIndex = stages.findIndex((s) => s.name === "Grand Finals");

if (gfStageIndex === -1) {
  console.error("Grand Finals stage not found");
  process.exit(1);
}

// Update the stage
stages[gfStageIndex].status = "completed";
stages[gfStageIndex].standings = [
  { placement: 1, team: "GodLike Esports", fullTeam: "GodLike Esports", matches: 18, wwcd: 2, pos: 58, elimins: 103, points: 161, outcome: "Champion" },
  { placement: 2, team: "Divine Gaming", fullTeam: "Divine Gaming", matches: 18, wwcd: 0, pos: 56, elimins: 93, points: 149, outcome: "Runner-up" },
  { placement: 3, team: "Victores Sumus", fullTeam: "Victores Sumus", matches: 18, wwcd: 0, pos: 54, elimins: 79, points: 133, outcome: "3rd Place" },
  { placement: 4, team: "Gods Reign", fullTeam: "Gods Reign", matches: 18, wwcd: 0, pos: 35, elimins: 93, points: 128, outcome: "Top 4" },
  { placement: 5, team: "Team Apex Gaming", fullTeam: "Team Apex Gaming", matches: 18, wwcd: 0, pos: 28, elimins: 93, points: 121, outcome: "Top 5" },
  { placement: 6, team: "Orangutan", fullTeam: "Orangutan", matches: 18, wwcd: 0, pos: 41, elimins: 78, points: 119, outcome: "Top 6" },
  { placement: 7, team: "Team Tamilas", fullTeam: "Team Tamilas", matches: 18, wwcd: 0, pos: 38, elimins: 78, points: 116, outcome: "Top 7" },
  { placement: 8, team: "Vasista Esports", fullTeam: "Vasista Esports", matches: 18, wwcd: 0, pos: 37, elimins: 75, points: 112, outcome: "Top 8" },
  { placement: 9, team: "Reckoning Esports", fullTeam: "Reckoning Esports", matches: 18, wwcd: 0, pos: 43, elimins: 67, points: 110, outcome: "Top 9" },
  { placement: 10, team: "Nebula Esports", fullTeam: "Nebula Esports", matches: 18, wwcd: 0, pos: 34, elimins: 73, points: 107, outcome: "Top 10" },
  { placement: 11, team: "8Bit", fullTeam: "8Bit", matches: 18, wwcd: 0, pos: 30, elimins: 71, points: 101, outcome: "Top 11" },
  { placement: 12, team: "Genesis Esports", fullTeam: "Genesis Esports", matches: 18, wwcd: 0, pos: 29, elimins: 69, points: 98, outcome: "Top 12" },
  { placement: 13, team: "Team Soul", fullTeam: "Team Soul", matches: 18, wwcd: 0, pos: 30, elimins: 65, points: 95, outcome: "Top 13" },
  { placement: 14, team: "7Gods Esports", fullTeam: "7Gods Esports", matches: 18, wwcd: 0, pos: 31, elimins: 61, points: 92, outcome: "Top 14" },
  { placement: 15, team: "Revenant XSpark", fullTeam: "Revenant XSpark", matches: 18, wwcd: 0, pos: 19, elimins: 65, points: 84, outcome: "Top 15" },
  { placement: 16, team: "Myth Official", fullTeam: "Myth Official", matches: 18, wwcd: 0, pos: 13, elimins: 50, points: 63, outcome: "Top 16" },
];

const stmt = db.prepare(
  `UPDATE tournaments SET stages = ?, updated_date = ? WHERE id = ?`,
);
stmt.run(JSON.stringify(stages), now, tournament.id);

console.log("Updated BMPS 2026 Grand Finals standings successfully.");
