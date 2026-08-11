import { db } from "../server/db.js";

const tid = "b7224eb0-f9c3-40fd-b568-0cceda3a6fe9";

console.log("=== matches ===");
const matches = db.prepare("SELECT id, tournament_id, stage, group_name, match_number, map, status FROM matches WHERE tournament_id = ?").all(tid);
for (const m of matches) {
  console.log(JSON.stringify(m));
}

console.log("\n=== match_results (with tournament via join) ===");
const results = db.prepare(`
  SELECT mr.match_id, mr.team_id, mr.placement, mr.total_points, mr.kill_points, mr.placement_points, mr.matches_count, m.stage, m.group_name
  FROM match_results mr
  JOIN matches m ON m.id = mr.match_id
  WHERE m.tournament_id = ?
  ORDER BY mr.total_points DESC
`).all(tid);
for (const r of results) {
  console.log(JSON.stringify(r));
}

console.log("\n=== teams referenced ===");
const teamIds = [...new Set(results.map((r) => r.team_id).filter(Boolean))];
for (const id of teamIds) {
  const t = db.prepare("SELECT id, name, tag FROM teams WHERE id = ?").get(id);
  console.log(JSON.stringify(t));
}
