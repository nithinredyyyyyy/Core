import { db } from "../db.js";

const TOURNAMENT_NAME = "Battlegrounds Mobile India Pro Series 2026";
const SEMI_FINALS_SUMMARY =
  "June 9th - 12th, 2026. 24 teams play across 4 matchdays: the bottom 8 teams from Round 4 Group A, the top 8 teams from Round 4 Group B, and the 8 teams advancing from Survival Stage. Teams are divided into 3 groups of 8, use a double round-robin format, and play 16 matches each. The top 6 qualify for Grand Finals, teams placed 7th-22nd move to Last Chance Stage, and the bottom 2 are eliminated from BMPS 2026.";

const existing = db
  .prepare("SELECT id, stages FROM tournaments WHERE name = ?")
  .get(TOURNAMENT_NAME);

if (!existing) {
  throw new Error(`${TOURNAMENT_NAME} was not found.`);
}

const stages = JSON.parse(existing.stages || "[]").map((stage) =>
  String(stage?.name || "").trim().toLowerCase() === "semi finals"
    ? { ...stage, summary: SEMI_FINALS_SUMMARY }
    : stage,
);

db.prepare("UPDATE tournaments SET stages = ?, updated_date = ? WHERE id = ?").run(
  JSON.stringify(stages),
  new Date().toISOString(),
  existing.id,
);

console.log(`Updated ${TOURNAMENT_NAME} Semi Finals logic summary.`);
