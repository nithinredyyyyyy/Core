import { db } from "../server/db.js";
const t = db.prepare("SELECT name, rankings FROM tournaments WHERE rankings IS NOT NULL LIMIT 1").get();
console.log(t.name);
console.log(t.rankings?.slice(0, 500));
