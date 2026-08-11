import { db } from "../db.js";

const TOURNAMENT_NAME = "PUBG Mobile World Cup 2026";

const tournament = db
  .prepare("SELECT id FROM tournaments WHERE name = ?")
  .get(TOURNAMENT_NAME);

if (!tournament) {
  console.log("Tournament not found");
  process.exit(1);
}

console.log("Tournament ID:", tournament.id);

// Check if there are match results
const matchResults = db
  .prepare("SELECT COUNT(*) as count FROM match_results WHERE tournament_id = ?")
  .get(tournament.id);
console.log("Match results count:", matchResults.count);

// Check stages table
const stages = db
  .prepare("SELECT id, name, status FROM tournament_stages WHERE tournament_id = ?")
  .all(tournament.id);
console.log("\nTournament stages:");
for (const stage of stages) {
  console.log(`  ${stage.name} (${stage.status}) - ID: ${stage.id}`);
}

// Check stage standings
const stageStandings = db
  .prepare(`
    SELECT ss.*, ts.name as stage_name 
    FROM stage_standings ss 
    JOIN tournament_stages ts ON ts.id = ss.stage_id 
    WHERE ts.tournament_id = ?
  `)
  .all(tournament.id);
console.log("\nStage standings count:", stageStandings.length);
if (stageStandings.length > 0) {
  console.log("Sample:", JSON.stringify(stageStandings.slice(0, 3), null, 2));
}

// Check stage groups
const stageGroups = db
  .prepare(`
    SELECT tsg.*, ts.name as stage_name 
    FROM tournament_stage_groups tsg 
    JOIN tournament_stages ts ON ts.id = tsg.stage_id 
    WHERE ts.tournament_id = ?
  `)
  .all(tournament.id);
console.log("\nStage groups count:", stageGroups.length);
for (const group of stageGroups) {
  console.log(`  ${group.stage_name} - ${group.group_name}`);
}
