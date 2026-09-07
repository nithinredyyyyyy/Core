import { db } from "../server/db.js";
const table = db.prepare("PRAGMA table_info(tournaments)").all();
console.log(table);
