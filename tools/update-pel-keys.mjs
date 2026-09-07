import { db } from "../server/db.js";

const PEL_NAME = "Peacekeeper Elite League 2026 Summer";
const t = db.prepare("SELECT id, stages FROM tournaments WHERE name = ?").get(PEL_NAME);
if (!t) { console.error("Not found"); process.exit(1); }

let stages = JSON.parse(t.stages);

for (const stage of stages) {
  if (stage.standings) {
    for (const row of stage.standings) {
      if (row.placePts !== undefined) {
        row.pos = row.placePts;
        delete row.placePts;
      }
      if (row.elimPts !== undefined) {
        row.elimins = row.elimPts;
        delete row.elimPts;
      }
    }
  }
}

db.prepare("UPDATE tournaments SET stages = ? WHERE id = ?").run(JSON.stringify(stages), t.id);

console.log("Updated stages JSON to use 'pos' and 'elimins'");
