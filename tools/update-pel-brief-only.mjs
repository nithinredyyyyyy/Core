import { db } from "../server/db.js";

const PEL_NAME = "Peacekeeper Elite League 2026 Summer";
const t = db.prepare("SELECT id FROM tournaments WHERE name = ?").get(PEL_NAME);
if (!t) { console.error("Not found"); process.exit(1); }

const newFormat = `- Tournament: Peacekeeper Elite League Summer 2026
- Game: Peacekeeper Elite (Chinese rebranded version of PUBG Mobile / "Game for Peace")
- Organizers: Tencent Games, Hero Esports
- Tier: S-Tier (offline)
- Teams: 22 (all China-based orgs)
- Dates: May 28, 2026 - Aug 30, 2026
- Prize Pool: ¥16,400,000 CNY (≈ $2,438,027 USD)
- Sponsors: OnePlus, Eastroc, Snapdragon, Taobao, Tongcheng Travel, AndaSeat
- Venues: Quantum Hero E-sports Center, Chengdu (Regular Season & Playoffs); Qingdao Citizen Fitness Center Gymnasium, Qingdao (Grand Finals)
- Defending Champion (Spring 2026): All Gamers
- Game Mode: Squads TPP, 6 matches per day`;

db.prepare("UPDATE tournaments SET format_overview = ? WHERE id = ?").run(newFormat, t.id);
console.log("Updated format_overview to only contain the simplified Event Brief");
