import { db } from "../db.js";

const TOURNAMENT_NAME = "PUBG Mobile World Cup 2026";

const tournament = db
  .prepare("SELECT id, stages, participants FROM tournaments WHERE name = ?")
  .get(TOURNAMENT_NAME);

if (!tournament) {
  console.log("Tournament not found");
  process.exit(1);
}

console.log("Tournament ID:", tournament.id);

const stages = JSON.parse(tournament.stages);
console.log("\nStages:");
for (const stage of stages) {
  console.log(`\n${stage.name} (${stage.status}):`);
  console.log(`  Teams: ${stage.teamCount}`);
  console.log(`  Standings: ${stage.standings.length} entries`);
  if (stage.standings.length > 0) {
    console.log("  Sample standings:", JSON.stringify(stage.standings.slice(0, 3), null, 2));
  }
}

const participants = JSON.parse(tournament.participants);
console.log("\nParticipants:", participants.length);
console.log("Group A:", participants.filter(p => p.phase.includes("Group A")).length);
console.log("Group B:", participants.filter(p => p.phase.includes("Group B")).length);
