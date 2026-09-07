import { db } from "../server/db.js";
const row = db.prepare("SELECT hero_image_url, logo_url FROM tournaments WHERE name LIKE '%Peacekeeper Elite League%'").get();
console.log(row);
