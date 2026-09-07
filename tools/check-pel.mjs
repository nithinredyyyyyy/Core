import { db } from "../server/db.js";
db.prepare("UPDATE tournaments SET max_teams=32 WHERE name='PUBG Mobile Global Championship 2025'").run();
console.log("Fixed max_teams to 32");
