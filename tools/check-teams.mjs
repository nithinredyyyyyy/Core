import { db } from "../server/db.js";

const rows = db
  .prepare(
    "SELECT name, tag FROM teams WHERE name LIKE '%Godlike%' OR name LIKE '%GodLike%' OR name LIKE '%Nongshim%' OR name LIKE '%Orangutan%' OR name LIKE '%Wolves%'",
  )
  .all();
for (const r of rows) console.log(`${r.name} | ${r.tag}`);
