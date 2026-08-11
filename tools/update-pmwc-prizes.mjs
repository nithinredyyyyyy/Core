import { db } from "../server/db.js";
import { PMWC_2026_PRIZE_BREAKDOWN } from "../server/tournamentOverrides.js";

const row = db
  .prepare("SELECT id FROM tournaments WHERE name = ?")
  .get("PUBG Mobile World Cup 2026");

if (!row) {
  console.error("PMWC 2026 not found");
  process.exit(1);
}

db.prepare("UPDATE tournaments SET prize_breakdown = ?, updated_date = ? WHERE id = ?").run(
  JSON.stringify(PMWC_2026_PRIZE_BREAKDOWN),
  new Date().toISOString(),
  row.id,
);

const stored = JSON.parse(
  db.prepare("SELECT prize_breakdown FROM tournaments WHERE id = ?").get(row.id).prize_breakdown,
);
const byStage = {};
for (const e of stored) {
  byStage[e.stage] = (byStage[e.stage] || 0) + 1;
}
console.log("total entries:", stored.length);
for (const [stage, count] of Object.entries(byStage)) {
  console.log(`  ${stage}: ${count} rows, first usd = ${stored.find((e) => e.stage === stage).usd}`);
}
process.exit(0);
