import { db } from "../db.js";
import { randomUUID } from "node:crypto";

const TOURNAMENT_NAME = "Battlegrounds Mobile India Pro Series 2026";
const STAGE_NAME = "Grand Finals";

const COMPENSATION_POINTS = {
  "divinegaming": 3,
  "7godsesports": 3,
  "godlikeesports": 2,
  "8bit": 2,
  "revenantxspark": 2,
  "teamapexgaming": 2,
  "genesisesports": 1,
  "reckoningesports": 1,
  "vasistaesports": 1,
  "teamsoul": 1,
};

const now = new Date().toISOString();

const tournament = db
  .prepare("SELECT id FROM tournaments WHERE name = ?")
  .get(TOURNAMENT_NAME);

if (!tournament) {
  console.error(`Tournament not found: ${TOURNAMENT_NAME}`);
  process.exit(1);
}

const teams = db.prepare("SELECT id, name FROM teams").all();
const teamIdMap = new Map();
const teamNameMap = new Map();
for (const team of teams) {
  const normalized = team.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  teamIdMap.set(normalized, team.id);
  teamNameMap.set(normalized, team.name);
}

console.log("Adding compensation points for Grand Finals standings...");

const compensationMatchId = randomUUID();
const insertMatch = db.prepare("INSERT INTO matches (id, tournament_id, stage, match_number, map, status, created_date, updated_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
insertMatch.run(
  compensationMatchId,
  tournament.id,
  STAGE_NAME,
  99,
  "Compensation",
  "completed",
  now,
  now,
  "admin@stagecore.local"
);

let addedCount = 0;

for (const [teamKey, points] of Object.entries(COMPENSATION_POINTS)) {
  const teamId = teamIdMap.get(teamKey);
  if (!teamId) {
    console.warn(`Team not found for key: ${teamKey}`);
    continue;
  }

  const teamName = teamNameMap.get(teamKey);

  const existingResult = db.prepare("SELECT id FROM match_results WHERE match_id = ? AND team_id = ?").get(compensationMatchId, teamId);

  if (existingResult) {
    console.warn(`Compensation result already exists for: ${teamName}`);
    continue;
  }

  const insertResult = db.prepare("INSERT INTO match_results (id, match_id, tournament_id, team_id, placement, kill_points, placement_points, total_points, matches_count, wins_count, stage, created_date, updated_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertResult.run(
    randomUUID(),
    compensationMatchId,
    tournament.id,
    teamId,
    null,
    points,
    0,
    points,
    1,
    0,
    STAGE_NAME,
    now,
    now,
    "admin@stagecore.local"
  );

  console.log(`Added compensation for ${teamName}: +${points} pts`);
  addedCount++;
}

console.log(`\nAdded compensation points for ${addedCount} teams.`);
