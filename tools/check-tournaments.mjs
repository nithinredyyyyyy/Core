import { db } from "../server/db.js";
// Check all tournaments with their status  
const rows = db.prepare("SELECT name, status FROM tournaments ORDER BY created_date DESC LIMIT 10").all();
console.log(rows);
