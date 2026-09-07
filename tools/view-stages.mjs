import { db } from "../server/db.js";
const t = db.prepare("SELECT name, stages FROM tournaments WHERE stages IS NOT NULL LIMIT 1").get();
console.log(t.name);
console.log(t.stages?.slice(0, 1500));
