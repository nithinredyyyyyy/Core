import { db } from "../server/db.js";

const newFormat = `**Event Brief**
- **Tournament**: Peacekeeper Elite League Summer 2026
- **Game**: Peacekeeper Elite (Chinese rebranded version of PUBG Mobile / "Game for Peace")
- **Organizers**: Tencent Games, Hero Esports
- **Tier**: S-Tier (offline)
- **Teams**: 22 (all China-based orgs)
- **Dates**: May 28, 2026 - Aug 30, 2026
- **Prize Pool**: ¥16,400,000 CNY (≈ $2,438,027 USD)
- **Sponsors**: OnePlus, Eastroc, Snapdragon, Taobao, Tongcheng Travel, AndaSeat
- **Venues**: Quantum Hero E-sports Center, Chengdu (Regular Season & Playoffs); Qingdao Citizen Fitness Center Gymnasium, Qingdao (Grand Finals)
- **Defending Champion (Spring 2026)**: All Gamers
- **Game Mode**: Squads TPP, 6 matches per day

**Format**

**Regular Season** (May 28 – Jun 21 & Jul 9 – 26, 2026 | 7 weeks)
Each week consists of two phases:
- **Breakout (Day 1):** 16 teams compete. Top 10 qualify for Weekly Finals; bottom 6 go to next week's Breakout. Ties are broken via 4v4 Team Deathmatch.
- **Weekly Finals (Day 2–4):** 16 teams (Top 6 from previous Weekly Finals + Top 10 from Breakout). Weeks 1–2 use the Points System; from Week 3 onwards the **Smash Rule** applies (Weekly Finals Winner + Top 5 in Points advance to next Weekly Finals). Points earned cumulate into the Overall Regular Season standings.

At the end of the Regular Season: **Top 6 → Grand Finals** (direct); **Bottom 16 → Playoffs**.

**Playoffs** (Jul 30 – Aug 2, 2026 | Chengdu)
16 teams seeded with Headstart Points based on Regular Season rank. Top 10 qualify for Grand Finals; bottom 6 are eliminated.

**Grand Finals** (Aug 28–30, 2026 | Qingdao)
16 teams (6 direct + 10 via Playoffs), each receiving Headstart Points. 3 matchdays. Smash Rule applied — the first "Match Point Eligible" team to win a WWCD is crowned champion. Match Point threshold = 2nd place total after Match 15 + 5 points.

**Game Details**
- Regular Map Order: Rondo → Erangel → Erangel → Erangel → Miramar → Miramar
- Smash Rule Final Day: Circle → Erangel → Look → Erangel → Erangel → Look → Circle`;

db.prepare("UPDATE tournaments SET format_overview = ? WHERE name LIKE '%Peacekeeper Elite League%'").run(newFormat);
console.log("Updated format_overview");
