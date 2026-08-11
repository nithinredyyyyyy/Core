import { db } from "../server/db.js";

const rows = db.prepare("SELECT name, prize_breakdown FROM tournaments").all();
for (const r of rows) {
  const p = JSON.parse(r.prize_breakdown || "[]");
  const first = p[0] ? Object.keys(p[0]).join(",") : "none";
  console.log(`${r.name} | ${p.length} entries | keys: ${first}`);
}
process.exit(0);
