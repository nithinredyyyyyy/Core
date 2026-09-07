import { db } from "../server/db.js";

const PEL_NAME = "Peacekeeper Elite League 2026 Summer";
const t = db.prepare("SELECT id, participants FROM tournaments WHERE name = ?").get(PEL_NAME);
if (!t) { console.error("Not found"); process.exit(1); }

let participants = JSON.parse(t.participants);

for (const p of participants) {
  if (p.roster) {
    p.players = p.roster;
    delete p.roster;
  }
}

db.prepare("UPDATE tournaments SET participants = ? WHERE id = ?").run(JSON.stringify(participants), t.id);

console.log("Updated participants JSON to use 'players' instead of 'roster'");
