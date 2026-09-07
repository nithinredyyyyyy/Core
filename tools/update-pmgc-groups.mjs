import { db } from "../server/db.js";

const t = db.prepare("SELECT id, stages FROM tournaments WHERE name='PUBG Mobile Global Championship 2025'").get();

// Update the matches table: rename "Group Stage - Green" / "Group Stage - Red" to "Group Stage" with group_name
db.prepare("UPDATE matches SET stage = 'Group Stage', group_name = 'Green' WHERE tournament_id = ? AND stage = 'Group Stage - Green'").run(t.id);
db.prepare("UPDATE matches SET stage = 'Group Stage', group_name = 'Red' WHERE tournament_id = ? AND stage = 'Group Stage - Red'").run(t.id);

// Also update match_results stage names
db.prepare("UPDATE match_results SET stage = 'Group Stage' WHERE tournament_id = ? AND stage = 'Group Stage - Green'").run(t.id);
db.prepare("UPDATE match_results SET stage = 'Group Stage' WHERE tournament_id = ? AND stage = 'Group Stage - Red'").run(t.id);

const mCount = db.prepare("SELECT COUNT(*) as c FROM matches WHERE tournament_id=? AND stage='Group Stage'").get(t.id);
const rCount = db.prepare("SELECT COUNT(*) as c FROM match_results WHERE tournament_id=? AND stage='Group Stage'").get(t.id);
console.log(`Done: ${mCount.c} matches, ${rCount.c} results updated to "Group Stage" with group_name`);
