import { db } from "../server/db.js";
const row = db.prepare("SELECT id, name, status FROM tournaments WHERE name LIKE '%Peacekeeper%'").get();
console.log(row);
