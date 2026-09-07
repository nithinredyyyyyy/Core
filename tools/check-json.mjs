import { db } from "../server/db.js";
const t = db.prepare("SELECT stage FROM match_results WHERE tournament_id = (SELECT id FROM tournaments WHERE name = 'Peacekeeper Elite League 2026 Summer')").all();
console.log(t);
