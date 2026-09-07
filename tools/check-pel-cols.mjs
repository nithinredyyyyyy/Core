import { db } from "../server/db.js";
const cols = db.prepare("PRAGMA table_info(tournaments)").all().map(c => c.name);
console.log("Columns:", cols);
const row = db.prepare("SELECT name FROM tournaments WHERE name LIKE '%Peacekeeper%'").get();
// Check all string columns
const full = db.prepare("SELECT * FROM tournaments WHERE name LIKE '%Peacekeeper%'").get();
// Print non-json columns only
for (const [k, v] of Object.entries(full)) {
  if (typeof v === 'string' && v.length < 200) {
    console.log(`${k}: ${v}`);
  }
}
