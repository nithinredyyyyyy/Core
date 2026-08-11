import { db } from "../server/db.js";

const t = db.prepare("SELECT id, name FROM tournaments WHERE name = ?").get("PUBG Mobile World Cup 2026");

const groups = db
  .prepare(
    `SELECT g.group_name, tm.name AS team_name, p.seed
     FROM tournament_stage_groups g
     JOIN tournament_participant_stage_entries e ON e.group_id = g.id
     JOIN tournament_participants p ON p.id = e.participant_id
     JOIN teams tm ON tm.id = p.team_id
     WHERE g.stage_id IN (SELECT id FROM tournament_stages WHERE tournament_id = ?)
     ORDER BY g.group_order, e.placement`,
  )
  .all(t.id);

for (const g of groups) console.log(`${g.group_name} | ${g.team_name} | ${g.seed}`);

const stageCount = db.prepare("SELECT COUNT(*) c FROM tournament_stages WHERE tournament_id = ?").get(t.id).c;
console.log("total stage rows:", stageCount);

process.exit(0);
