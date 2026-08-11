import { db } from "../server/db.js";

const rows = db
  .prepare(
    `SELECT t.id, t.name, COUNT(s.id) AS stages, COUNT(DISTINCT g.id) AS groups
     FROM tournaments t
     LEFT JOIN tournament_stages s ON s.tournament_id = t.id
     LEFT JOIN tournament_stage_groups g ON g.stage_id = s.id
     GROUP BY t.id ORDER BY t.name`,
  )
  .all();

for (const r of rows) console.log(`${r.name} | id=${r.id} | stages=${r.stages} groups=${r.groups}`);

process.exit(0);
